package dev.kuanxinji.preview;

/** Pure rules shared by scheduling, recovery and device diagnostics. */
public final class DeliveryPolicy {
    private DeliveryPolicy() {}
    public static final long TEST_DELAY = 120000L;
    public static boolean expired(long due, long now) { return due > 0 && now - due > 30 * 60000L; }
    public static boolean reuseTest(long due, long now) { return due > 0 && now < due + 10 * 60000L; }
}
