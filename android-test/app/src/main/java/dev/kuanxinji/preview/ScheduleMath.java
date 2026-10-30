package dev.kuanxinji.preview;

import java.time.*;
import java.util.*;

public final class ScheduleMath {
    private ScheduleMath() { }
    public static int minute(String value) {
        if (value == null || !value.matches("([01]\\d|2[0-3]):[0-5]\\d")) throw new IllegalArgumentException("提醒时间格式不正确");
        return Integer.parseInt(value.substring(0, 2)) * 60 + Integer.parseInt(value.substring(3));
    }
    public static long next(int minute, long now, ZoneId zone) {
        if (minute < 0 || minute > 1439) throw new IllegalArgumentException("Invalid minute");
        ZonedDateTime local = Instant.ofEpochMilli(now).atZone(zone);
        ZonedDateTime due = local.toLocalDate().atTime(minute / 60, minute % 60).atZone(zone);
        if (!due.toInstant().isAfter(local.toInstant())) due = local.toLocalDate().plusDays(1).atTime(minute / 60, minute % 60).atZone(zone);
        return due.toInstant().toEpochMilli();
    }
    public static SortedMap<Integer, Integer> merge(List<String> nianfo, List<String> huiguang) {
        SortedMap<Integer, Integer> result = new TreeMap<>();
        for (String time : nianfo) result.merge(minute(time), 1, (a, b) -> a | b);
        for (String time : huiguang) result.merge(minute(time), 2, (a, b) -> a | b);
        return result;
    }
}
