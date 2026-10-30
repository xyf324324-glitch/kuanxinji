package dev.kuanxinji.preview;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.Build;
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
    private PendingIntent intent(int minute) {
        Intent target = new Intent(context, ReminderReceiver.class).putExtra("minute", minute);
        return PendingIntent.getBroadcast(context, 100 + minute, target, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private void cancel(JSONObject times) throws JSONException {
        for (int minute : slots(times).keySet()) alarms.cancel(intent(minute));
        alarms.cancel(intent(2000));
    }
    @SuppressLint("ScheduleExactAlarm")
    public void scheduleSlot(int minute, long when) {
        if (!exact()) throw new SecurityException("请允许闹钟和提醒权限");
        alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, intent(minute));
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
            if (!prefs.edit().putString("times", next.toString()).putBoolean("enabled", true).commit()) throw new IllegalStateException("无法保存提醒设置");
        } catch (RuntimeException | JSONException error) {
            cancel(next);
            if (wasEnabled) schedule(previous);
            throw error;
        }
        return status();
    }
    public synchronized void disable() throws JSONException {
        if (!prefs.edit().putBoolean("enabled", false).commit()) throw new IllegalStateException("无法保存提醒设置");
        cancel(times());
    }
    public void restore() throws JSONException { if (desired() && permitted() && exact()) schedule(times()); }
    public long test() {
        if (!desired() || !permitted() || !exact()) throw new IllegalStateException("请先开启每日提醒");
        long due = System.currentTimeMillis() + 60000;
        scheduleSlot(2000, due);
        return due;
    }
    @SuppressLint("MissingPermission") // permitted() checks OS permission and channel before notify().
    public void fire(int minute) throws JSONException {
        if (!desired() || !permitted()) return;
        int kind;
        if (minute == 2000) kind = 3;
        else {
            Integer current = slots(times()).get(minute);
            if (current == null) return;
            kind = current;
            if (exact()) scheduleSlot(minute, ScheduleMath.next(minute, System.currentTimeMillis(), ZoneId.systemDefault()));
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
    }
}
