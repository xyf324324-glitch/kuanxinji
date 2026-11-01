package dev.kuanxinji.preview;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.webkit.*;
import android.widget.*;
import androidx.webkit.*;
import org.json.*;
import java.net.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public final class MainActivity extends Activity {
    private WebView web;
    private ReminderStore store;
    private String origin;
    private JSONObject pending;
    private JavaScriptReplyProxy pendingReply;
    private boolean awaitingExact;
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(248,246,241));
        getWindow().setNavigationBarColor(Color.rgb(248,246,241));
        getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        store = new ReminderStore(this);
        Uri site = Uri.parse(BuildConfig.SITE_URL);
        if (!"https".equals(site.getScheme()) || site.getHost() == null || !(site.getHost().equals("kuanxinji.pages.dev") || site.getHost().endsWith(".kuanxinji.pages.dev"))) {
            showProblem("测试地址配置不正确"); return;
        }
        origin = "https://" + site.getHost();
        web = new WebView(this);
        web.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        web.setBackgroundColor(Color.rgb(248,246,241));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        web.setWebChromeClient(new WebChromeClient());
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            showProblem("请先通过手机应用商店更新 Android System WebView，再打开测试版。"); return;
        }
        WebViewCompat.addWebMessageListener(web, "KuanxinAndroid", Collections.singleton(origin), (view, message, sourceOrigin, isMainFrame, reply) -> {
            if (!isMainFrame || !origin.equals(sourceOrigin.toString())) return;
            String text = message.getData();
            if (text == null || text.length() > 8192) return;
            runOnUiThread(() -> handle(text, reply));
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (origin.equals(originOf(url))) return false;
                if (request.isForMainFrame() && "https".equals(url.getScheme())) openExternal(url);
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showProblem("页面暂时无法连接。已开启的本地提醒仍会保留，请检查网络后重试。");
            }
            // Default SSL handling cancels untrusted certificates; never override it.
        });
        setContentView(web);
        web.loadUrl(BuildConfig.SITE_URL);
        try { checkUpdate(new JSONObject().put("id", "startup"), null); }
        catch (JSONException ignored) { /* Constant request ID. */ }
    }
    private String originOf(Uri uri) { return uri.getScheme() + "://" + uri.getAuthority(); }
    private void openExternal(Uri uri) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (ActivityNotFoundException error) { Toast.makeText(this, "未找到可打开链接的应用", Toast.LENGTH_SHORT).show(); }
    }
    private void showProblem(String message) {
        LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL); layout.setPadding(40,80,40,40);
        layout.setBackgroundColor(Color.rgb(248,246,241));
        TextView text = new TextView(this); text.setText(message); text.setTextSize(17); layout.addView(text);
        Button retry = new Button(this); retry.setText("重新打开"); retry.setOnClickListener(v -> recreate()); layout.addView(retry);
        setContentView(layout);
    }
    private void reply(JSONObject request, JavaScriptReplyProxy target, JSONObject data, String error) {
        if (target == null) return;
        try {
            JSONObject response = new JSONObject().put("id", request.getString("id")).put("ok", error == null);
            if (data != null) response.put("data", data);
            if (error != null) response.put("error", error);
            target.postMessage(response.toString());
        } catch (RuntimeException | JSONException ignored) { /* Page may have closed while system settings were open. */ }
    }
    private void handle(String text, JavaScriptReplyProxy reply) {
        JSONObject request = null;
        try {
            request = new JSONObject(text);
            if (!request.getString("id").matches("[a-zA-Z0-9-]{1,70}")) return;
            String action = request.getString("action");
            switch (action) {
                case "setupStatus": reply(request, reply, store.setupStatus(), null); break;
                case "confirmReceived":
                    try { reply(request, reply, store.confirmReceived(), null); }
                    catch (IllegalStateException error) { reply(request, reply, null, error.getMessage()); }
                    break;
                case "openReminderSettings":
                    String setting = request.optString("setting");
                    if ("notifications".equals(setting)) openSettings(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName()));
                    else if ("battery".equals(setting)) openSettings(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                    else if ("exact".equals(setting) && Build.VERSION.SDK_INT >= 31) openSettings(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getPackageName())));
                    else openSettings(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
                    reply(request, reply, new JSONObject(), null); break;
                case "status": reply(request, reply, store.status(), null); break;
                case "enable":
                    if (pending != null) { reply(request, reply, null, "正在处理另一个提醒请求"); return; }
                    store.normalize(request.getJSONObject("times"));
                    pending = request; pendingReply = reply;
                    continueEnable(); break;
                case "schedule":
                    if (!store.desired()) throw new IllegalStateException("请先开启每日提醒");
                    reply(request, reply, store.enable(request.getJSONObject("times")), null); break;
                case "disable": store.disable(); reply(request, reply, store.status(), null); break;
                case "test": reply(request, reply, new JSONObject().put("due", store.test()), null); break;
                case "diagnostics": showDiagnostics(); reply(request, reply, new JSONObject(), null); break;
                case "immediateTest": store.immediateTest(); reply(request, reply, new JSONObject(), null); break;
                case "checkUpdate": checkUpdate(request, reply); break;
                default: reply(request, reply, null, "不支持的操作");
            }
        } catch (Exception error) {
            if (request != null) reply(request, reply, null, error instanceof SecurityException ? "请允许通知及闹钟和提醒权限" : "操作未完成，请检查设置后重试");
        }
    }
    private void continueEnable() {
        if (pending == null) return;
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 10); return;
        }
        if (!store.permitted()) { failPending("通知已关闭，请在手机设置中允许宽心纪测试版通知"); return; }
        if (!store.exact() && Build.VERSION.SDK_INT >= 31) {
            new AlertDialog.Builder(this).setTitle("允许定时提醒")
                .setMessage("要按您选择的时间提醒，需要允许“闹钟和提醒”。这不会开启响铃闹钟。")
                .setPositiveButton("去允许", (dialog, which) -> {
                    try {
                        awaitingExact = true;
                        startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getPackageName())));
                    } catch (ActivityNotFoundException error) { awaitingExact = false; failPending("请在系统设置中允许闹钟和提醒后重试"); }
                }).setNegativeButton("暂不开启", (dialog, which) -> failPending("尚未允许定时提醒，可以稍后开启"))
                .setOnCancelListener(dialog -> failPending("尚未允许定时提醒，可以稍后开启")).show();
            return;
        }
        try {
            JSONObject result = store.enable(pending.getJSONObject("times"));
            reply(pending, pendingReply, result, null);

        } catch (Exception error) { reply(pending, pendingReply, null, "未能保存定时提醒，请重试"); }
        pending = null; pendingReply = null;
    }
    private void failPending(String error) {
        if (pending != null) reply(pending, pendingReply, null, error);
        pending = null; pendingReply = null;
    }
    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 10 && pending != null) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) continueEnable();
            else failPending("尚未允许通知，可以在手机设置中开启后重试");
        }
    }
    @Override protected void onResume() {
        super.onResume();
        if (store != null) store.setForeground(true);
        if (web != null) web.evaluateJavascript("window.dispatchEvent(new Event('kuanxin-resume'))", null);
        if (store != null) try { store.reconcile(); } catch (Exception error) { store.record("恢复失败 " + error.getClass().getSimpleName()); }
        if (awaitingExact) {
            awaitingExact = false;
            if (store.exact()) continueEnable(); else failPending("尚未允许闹钟和提醒，可以稍后开启");
        }
    }
    @Override protected void onPause() {
        if (store != null) store.setForeground(false);
        super.onPause();
    }
    private void openSettings(Intent intent) {
        try { startActivity(intent); }
        catch (ActivityNotFoundException error) { Toast.makeText(this, "请在系统设置中搜索应用电池或启动管理", Toast.LENGTH_LONG).show(); }
    }
    private void showDiagnostics() throws JSONException {
        JSONObject data = store.diagnostics();
        String maker = Build.MANUFACTURER.toLowerCase(Locale.ROOT);
        String guide = maker.contains("samsung") ? "三星：将宽心纪移出休眠/深度休眠应用，电池设为不受限制。"
            : maker.contains("huawei") || maker.contains("honor") ? "华为/荣耀：应用启动管理改为手动，允许自启动、关联启动和后台活动。"
            : maker.contains("xiaomi") || maker.contains("redmi") ? "小米：允许后台自启动，应用省电设为无限制。" : "请允许应用后台活动，并检查应用电池限制。";
        StringBuilder text = new StringBuilder("设备：" + data.getString("device") + " / Android " + data.getString("android")
            + "\n通知：" + data.getBoolean("canNotify") + "　精确定时：" + data.getBoolean("exact")
            + "\n系统后台限制：" + data.getBoolean("backgroundRestricted") + "\n电池优化豁免：" + data.getBoolean("batteryExempt")
            + "\n\n" + guide + "\n厂商自启动开关无法可靠自动读取，请手动核对。\n\n最近记录（仅保存在手机）：\n");
        JSONArray events = data.getJSONArray("events");
        for (int i=0; i<events.length(); i++) {
            JSONObject item = events.getJSONObject(i);
            text.append(java.time.Instant.ofEpochMilli(item.getLong("at")).atZone(java.time.ZoneId.systemDefault()).toString()).append(" ").append(item.getString("event")).append("\n");
        }
        ScrollView scroll = new ScrollView(this); TextView content = new TextView(this);
        content.setText(text); content.setTextIsSelectable(true); content.setPadding(32,24,32,24); scroll.addView(content);
        new AlertDialog.Builder(this).setTitle("后台提醒检查 · " + BuildConfig.VERSION_NAME).setView(scroll)
            .setPositiveButton("应用设置", (d,w) -> openSettings(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:"+getPackageName()))))
            .setNeutralButton("更多操作", (d,w) -> new AlertDialog.Builder(this).setItems(new String[]{"通知设置", "电池优化设置", "闹钟和提醒权限", "复制诊断记录"}, (dialog,which) -> {
                if (which==0) openSettings(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()));
                if (which==1) openSettings(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                if (which==2 && Build.VERSION.SDK_INT>=31) openSettings(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:"+getPackageName())));
                if (which==3) { ((android.content.ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("宽心纪诊断",text)); Toast.makeText(this,"诊断记录已复制",Toast.LENGTH_SHORT).show(); }
            }).show()).setNegativeButton("关闭", null).show();
    }
    private void checkUpdate(JSONObject request, JavaScriptReplyProxy reply) {
        network.execute(() -> {
            JSONObject result = new JSONObject(); String error = null;
            try {
                HttpURLConnection connection = (HttpURLConnection) new URL(origin + "/android/version.json").openConnection();
                connection.setConnectTimeout(8000); connection.setReadTimeout(8000); connection.setInstanceFollowRedirects(false);
                connection.setRequestProperty("Cache-Control", "no-cache");
                try {
                    if (connection.getResponseCode() == 404) result.put("available", false);
                    else if (connection.getResponseCode() == 200 && connection.getContentType() != null && connection.getContentType().contains("application/json")) {
                        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] buffer = new byte[1024]; int count;
                        try (InputStream input = connection.getInputStream()) {
                            while ((count = input.read(buffer)) != -1) { out.write(buffer,0,count); if (out.size() > 8192) throw new IOException("Manifest too large"); }
                        }
                        JSONObject manifest = new JSONObject(out.toString("UTF-8"));
                        boolean available = manifest.getInt("versionCode") > BuildConfig.VERSION_CODE;
                        result.put("available", available);
                        if (available) {
                            Uri download = Uri.parse(manifest.getString("apkUrl"));
                            if (!"https://kuanxinji.pages.dev".equals(originOf(download)) || !download.getPath().startsWith("/downloads/android/")) throw new IOException("Invalid update URL");
                            result.put("versionName", manifest.getString("versionName"));
                            runOnUiThread(() -> new AlertDialog.Builder(this).setTitle("发现新版宽心纪")
                                .setMessage("将使用浏览器下载新版安装包，由您确认安装。")
                                .setPositiveButton("下载", (dialog, which) -> openExternal(download)).setNegativeButton("稍后", null).show());
                        }
                    } else throw new IOException("Update service unavailable");
                } finally { connection.disconnect(); }
                result.put("currentVersion", BuildConfig.VERSION_NAME);
            } catch (Exception failure) { error = "暂时无法检查更新，请稍后重试"; }
            JSONObject response = result; String failure = error;
            runOnUiThread(() -> reply(request, reply, response, failure));
        });
    }
    @Override public void onBackPressed() { if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() {
        failPending("页面已关闭，请重新打开后操作");
        network.shutdownNow();
        if (web != null) { web.stopLoading(); web.destroy(); }
        super.onDestroy();
    }
}
