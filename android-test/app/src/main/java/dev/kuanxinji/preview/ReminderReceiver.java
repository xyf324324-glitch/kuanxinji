package dev.kuanxinji.preview;
import android.content.*;
public final class ReminderReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        try { new ReminderStore(context).fire(intent.getIntExtra("minute", -1)); }
        catch (Exception error) { android.util.Log.e("KuanxinReminder", "Unable to show reminder: " + error.getClass().getSimpleName()); }
    }
}
