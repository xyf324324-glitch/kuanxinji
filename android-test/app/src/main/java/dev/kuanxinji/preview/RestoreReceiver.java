package dev.kuanxinji.preview;
import android.content.*;
import java.util.*;
public final class RestoreReceiver extends BroadcastReceiver {
    private static final Set<String> ACTIONS = new HashSet<>(Arrays.asList(Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED, Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_TIME_CHANGED, "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED"));
    @Override public void onReceive(Context context, Intent intent) {
        if (!ACTIONS.contains(intent.getAction())) return;
        try { new ReminderStore(context).restore(); }
        catch (Exception error) { android.util.Log.e("KuanxinReminder", "Unable to restore reminders: " + error.getClass().getSimpleName()); }
    }
}
