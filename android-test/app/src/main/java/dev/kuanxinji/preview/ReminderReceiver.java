package dev.kuanxinji.preview;
import android.content.*;
public final class ReminderReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        try { new ReminderStore(context).fire(intent.getIntExtra("minute", -1), intent.getLongExtra("due", 0)); }
        catch (Exception error) { new ReminderStore(context).record("通知执行失败 " + error.getClass().getSimpleName()); }
    }
}
