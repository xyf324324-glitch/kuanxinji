package dev.kuanxinji.preview;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.PowerManager;
import org.json.*;
import java.time.*;
import java.util.*;

public final class ReminderStore {
    public static final String CHANNEL = "kuanxin_daily";
    private final Context context;
    private final SharedPreferences prefs;
    private final AlarmManager alarms;
    public ReminderStore(Context context) {
        this.context = context.getApplicationContext();
        prefs = this.context.getSharedPreferences("reminders-v1", Context.MODE_PRIVATE);
        alarms = this.context.getSystemService(AlarmManager.class);
        NotificationChannel channel = new NotificationChannel(CHANNEL, "宽心每日提醒", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("念佛与一念回光的定时提醒");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        this.context.getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }
    public static JSONObject defaults() {
        try { return new JSONObject("{\"nianfo\":[\"09:00\",\"21:00\"],\"huiguang\":[\"09:00\",\"13:00\",\"21:00\"]}"); }
        catch (JSONException error) { throw new IllegalStateException(error); }
    }
    public JSONObject times() {
        try { return new JSONObject(prefs.getString("times", defaults().toString())); }
        catch (JSONException error) { return defaults(); }
    }
    private List<String> list(JSONObject times, String key) throws JSONException {
        JSONArray values = times.getJSONArray(key);
        if (values.length() < 1 || values.length() > 5) throw new IllegalArgumentException("每项请设置 1 至 5 个提醒时间");
        List<String> result = new ArrayList<>();
        for (int i = 0; i < values.length(); i++) {
            Object raw = values.get(i);
            if (!(raw instanceof String)) throw new IllegalArgumentException("提醒时间格式不正确");
            String time = (String) raw;
            ScheduleMath.minute(time);
            if (!result.contains(time)) result.add(time);
        }
        Collections.sort(result);
        return result;
    }
    public JSONObject normalize(JSONObject times) throws JSONException {
        return new JSONObject().put("nianfo", new JSONArray(list(times, "nianfo"))).put("huiguang", new JSONArray(list(times, "huiguang")));
    }
    public SortedMap<Integer, Integer> slots(JSONObject times) throws JSONException { return ScheduleMath.merge(list(times, "nianfo"), list(times, "huiguang")); }
    public boolean permitted() {
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        return nm.areNotificationsEnabled()
            && nm.getNotificationChannel(CHANNEL).getImportance() != NotificationManager.IMPORTANCE_NONE
            && (Build.VERSION.SDK_INT < 33 || context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED);
    }
    public boolean exact() { return Build.VERSION.SDK_INT < 31 || alarms.canScheduleExactAlarms(); }
    public boolean desired() { return prefs.getBoolean("enabled", false); }
    public JSONObject status() throws JSONException { return new JSONObject().put("enabled", desired() && permitted() && exact()).put("times", times()).put("canNotify", permitted()).put("exact", exact()).put("native", true); }
    public synchronized void record(String event) {
        try {
            JSONArray old = new JSONArray(prefs.getString("events", "[]")), next = new JSONArray();
            for (int i = Math.max(0, old.length()-49); i < old.length(); i++) next.put(old.get(i));
            next.put(new JSONObject().put("at", System.currentTimeMillis()).put("event", event));
            prefs.edit().putString("events", next.toString()).commit();
        } catch (JSONException ignored) { /* Diagnostics must not interrupt delivery. */ }
    }
    public JSONObject diagnostics() throws JSONException {
        PowerManager power = context.getSystemService(PowerManager.class);
        return status().put("device", Build.MANUFACTURER + " " + Build.MODEL).put("android", Build.VERSION.RELEASE)
            .put("batteryExempt", power.isIgnoringBatteryOptimizations(context.getPackageName()))
            .put("backgroundRestricted", (Build.VERSION.SDK_INT >= 28 && context.getSystemService(ActivityManager.class).isBackgroundRestricted()))
            .put("idle", power.isDeviceIdleMode()).put("testDue", prefs.getLong("due-2000", 0))
            .put("events", new JSONArray(prefs.getString("events", "[]")));
    }
    public void setForeground(boolean value) { prefs.edit().putBoolean("foreground", value).commit(); }
    public JSONObject setupStatus() throws JSONException {
        return status().put("manufacturer", Build.MANUFACTURER)
            .put("backgroundRestricted", Build.VERSION.SDK_INT >= 28 && context.getSystemService(ActivityManager.class).isBackgroundRestricted())
            .put("verified", prefs.getLong("confirmed_at", 0) > 0)
            .put("testReceivedAt", prefs.getLong("test_received", 0));
    }
    public JSONObject confirmReceived() throws JSONException {
        if (!desired() || !permitted() || !exact()) throw new IllegalStateException("请先允许通知及定时权限");
        if (!DeliveryPolicy.canConfirm(prefs.getLong("test_received", 0), prefs.getBoolean("test_was_background", false)))
            throw new IllegalStateException("尚无后台测试执行记录。请先点击两分钟测试，锁屏或切换应用，收到后再确认。");
        prefs.edit().putLong("confirmed_at", System.currentTimeMillis()).commit();
        record("用户确认收到后台测试通知");
        return setupStatus();
    }
    private PendingIntent intent(int minute) {
        Intent target = new Intent(context, ReminderReceiver.class).putExtra("minute", minute);
        return PendingIntent.getBroadcast(context, 100 + minute, target, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private void cancel(JSONObject times) throws JSONException {
        for (int minute : slots(times).keySet())  { alarms.cancel(intent(minute)); prefs.edit().remove("due-" + minute).commit(); }
        alarms.cancel(intent(2000)); prefs.edit().remove("due-2000").commit();
    }
    @SuppressLint("ScheduleExactAlarm")
    public void scheduleSlot(int minute, long when) {
        if (!exact()) throw new SecurityException("请允许闹钟和提醒权限");
        Intent target = new Intent(context, ReminderReceiver.class).putExtra("minute", minute).putExtra("due", when);
        PendingIntent delivery = PendingIntent.getBroadcast(context, 100 + minute, target, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, delivery);
        prefs.edit().putLong("due-" + minute, when).commit();
        record("已安排 " + minute + "，计划时间 " + Instant.ofEpochMilli(when).atZone(ZoneId.systemDefault()));
    }
    private void schedule(JSONObject times) throws JSONException {
        for (int minute : slots(times).keySet()) scheduleSlot(minute, ScheduleMath.next(minute, System.currentTimeMillis(), ZoneId.systemDefault()));
    }
    public synchronized JSONObject enable(JSONObject raw) throws JSONException {
        if (!permitted() || !exact()) throw new SecurityException("请允许通知及闹钟和提醒权限");
        JSONObject next = normalize(raw), previous = times();
        boolean wasEnabled = desired();
        cancel(previous);
        try {
            schedule(next);
            if (!prefs.edit().putString("times", next.toString()).putBoolean("enabled", true).remove("confirmed_at").remove("test_received").putBoolean("test_was_background", false).commit()) throw new IllegalStateException("无法保存提醒设置");
        } catch (RuntimeException | JSONException error) {
            cancel(next);
            if (wasEnabled) schedule(previous);
            throw error;
        }
        return status();
    }
    public synchronized void disable() throws JSONException {
        if (!prefs.edit().putBoolean("enabled", false).remove("confirmed_at").commit()) throw new IllegalStateException("无法保存提醒设置");
        cancel(times());
    }
    public void restore() throws JSONException { if (desired() && permitted() && exact()) { record("系统事件恢复任务"); schedule(times()); } }
    public void reconcile() throws JSONException {
        record("应用进入前台");
        if (!desired() || !permitted() || !exact()) return;
        for (int minute : slots(times()).keySet()) {
            // Leave overdue alarms intact briefly so their actual delayed receipt can be diagnosed.
            long due = prefs.getLong("due-" + minute, 0);
            if (due == 0 || DeliveryPolicy.expired(due, System.currentTimeMillis())) {
                record("修复后续任务 " + minute);
                scheduleSlot(minute, ScheduleMath.next(minute, System.currentTimeMillis(), ZoneId.systemDefault()));
            }
        }
    }
    public long test() {
        if (!desired() || !permitted() || !exact()) throw new IllegalStateException("请先开启每日提醒");
        long existing = prefs.getLong("due-2000", 0);
        if (DeliveryPolicy.reuseTest(existing, System.currentTimeMillis())) return existing;
        prefs.edit().remove("confirmed_at").remove("test_received").putBoolean("test_was_background", false).commit();
        long due = System.currentTimeMillis() + DeliveryPolicy.TEST_DELAY;
        scheduleSlot(2000, due);
        return due;
    }
    public void immediateTest() throws JSONException {
        if (!desired() || !permitted()) throw new IllegalStateException("请先开启每日提醒");
        fire(2001, 0);
    }
    @SuppressLint("MissingPermission") // permitted() checks OS permission and channel before notify().
    public void fire(int minute, long scheduledDue) throws JSONException {
        long now = System.currentTimeMillis(), due = scheduledDue > 0 ? scheduledDue : prefs.getLong("due-" + minute, 0);
        record("系统唤醒 " + minute + "，延迟毫秒 " + (due > 0 ? now-due : -1));
        if (!desired() || !permitted()) { record("权限或提醒开关阻止发送"); return; }
        int kind;
        if (minute == 2000 || minute == 2001) { kind = 3; if (minute == 2000) prefs.edit().remove("due-2000").commit(); }
        else {
            Integer current = slots(times()).get(minute);
            if (current == null) return;
            kind = current;
            if (exact()) scheduleSlot(minute, ScheduleMath.next(minute, System.currentTimeMillis(), ZoneId.systemDefault()));
            if (DeliveryPolicy.expired(due, now)) { record("已跳过超过30分钟的旧提醒"); return; }
            // Suppress duplicate broadcasts for the same local day and time.
            String today = LocalDate.now().toString(), dedup = "sent-" + minute;
            if (today.equals(prefs.getString(dedup, ""))) return;
            prefs.edit().putString(dedup, today).apply();
        }
        String body = kind == 1 ? "记得念佛。" : kind == 2 ? "记得一念回光。" : "记得念佛，也记得一念回光。";
        PendingIntent open = PendingIntent.getActivity(context, 0, new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new Notification.Builder(context, CHANNEL).setSmallIcon(dev.kuanxinji.preview.R.drawable.ic_lotus)
            .setContentTitle("宽心的提醒").setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body))
            .setVisibility(Notification.VISIBILITY_PUBLIC).setCategory(Notification.CATEGORY_REMINDER).setContentIntent(open).setAutoCancel(true).build();
        context.getSystemService(NotificationManager.class).notify(100 + minute, notification);
        if (minute == 2000) prefs.edit().putLong("test_received", now).putBoolean("test_was_background", !prefs.getBoolean("foreground", false)).commit();
        record("已提交通知 " + minute + "；是否展示横幅由系统决定");
    }
}
