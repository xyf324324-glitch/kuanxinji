package dev.kuanxinji.preview;
import org.junit.Test;
import static org.junit.Assert.*;
public class DeliveryPolicyTest {
    @Test public void immediateOrUnfiredTestsCannotConfirmBackgroundDelivery() {
        assertFalse(DeliveryPolicy.canConfirm(0, true));
        assertFalse(DeliveryPolicy.canConfirm(100, false));
        assertTrue(DeliveryPolicy.canConfirm(100, true));
    }
    @Test public void repeatedTapKeepsOriginalTestDeadline() {
        assertTrue(DeliveryPolicy.reuseTest(120000, 30000));
        assertTrue(DeliveryPolicy.reuseTest(120000, 130000));
        assertFalse(DeliveryPolicy.reuseTest(120000, 800000));
    }
    @Test public void lateDailyRemindersExpireWithoutAffectingFutureOnes() {
        assertFalse(DeliveryPolicy.expired(2000000, 1000000));
        assertFalse(DeliveryPolicy.expired(1000000, 1060000));
        assertTrue(DeliveryPolicy.expired(1000000, 2800001));
    }
}
