package dev.kuanxinji.preview;
import org.junit.Test;
import java.time.*;
import java.util.*;
import static org.junit.Assert.*;
public class ScheduleMathTest {
    @Test public void mergesPracticesWithoutDuplicatingSameTime() {
        SortedMap<Integer,Integer> result = ScheduleMath.merge(Arrays.asList("09:00","21:00","09:00"), Arrays.asList("09:00","13:00","21:00"));
        assertEquals(3, result.size());
        assertEquals(Integer.valueOf(3), result.get(540));
        assertEquals(Integer.valueOf(2), result.get(780));
        assertEquals(Integer.valueOf(3), result.get(1260));
    }
    @Test public void customTimesAndLocalCalendarAreUsed() {
        long before = Instant.parse("2026-10-30T00:59:00Z").toEpochMilli();
        assertEquals(Instant.parse("2026-10-30T01:00:00Z").toEpochMilli(), ScheduleMath.next(540, before, ZoneId.of("Asia/Shanghai")));
        long fired = Instant.parse("2026-10-30T01:00:00Z").toEpochMilli();
        assertEquals(Instant.parse("2026-10-31T01:00:00Z").toEpochMilli(), ScheduleMath.next(540, fired, ZoneId.of("Asia/Shanghai")));
        assertEquals(1439, ScheduleMath.minute("23:59"));
    }
    @Test public void dstGapUsesNextValidLocalTime() {
        assertEquals(Instant.parse("2026-03-08T07:30:00Z").toEpochMilli(), ScheduleMath.next(150, Instant.parse("2026-03-08T05:00:00Z").toEpochMilli(), ZoneId.of("America/New_York")));
    }
    @Test(expected=IllegalArgumentException.class) public void rejectsInvalidTimes() { ScheduleMath.minute("25:00"); }
}
