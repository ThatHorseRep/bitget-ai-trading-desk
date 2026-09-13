import type { SessionStatus } from "../../domain/market/types";

export interface HolidayClosureRange {
  startTime: string; // "YYYY-MM-DD HH:mm" or ISO
  endTime: string;
}

export function getEasternTimeParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short"
  });

  const parts = formatter.formatToParts(date);
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let weekdayStr = "";

  for (const part of parts) {
    if (part.type === "year") year = parseInt(part.value, 10);
    else if (part.type === "month") month = parseInt(part.value, 10);
    else if (part.type === "day") day = parseInt(part.value, 10);
    else if (part.type === "hour") hour = parseInt(part.value, 10);
    else if (part.type === "minute") minute = parseInt(part.value, 10);
    else if (part.type === "weekday") weekdayStr = part.value;
  }

  // Handle midnight wrap if hour is 24 in some ICU versions
  if (hour === 24) hour = 0;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  const dayOfWeek = weekdayMap[weekdayStr] ?? date.getUTCDay();

  return { year, month, day, hour, minute, dayOfWeek };
}

// Known standard US equity holiday checks (e.g. fixed dates or approximate observed)
export function isStandardUsHoliday(year: number, month: number, day: number): boolean {
  // New Year's Day (Jan 1)
  if (month === 1 && day === 1) return true;
  // Independence Day (Jul 4)
  if (month === 7 && day === 4) return true;
  // Juneteenth (Jun 19)
  if (month === 6 && day === 19) return true;
  // Christmas Day (Dec 25)
  if (month === 12 && day === 25) return true;
  return false;
}

export function determineUsMarketSession(
  date: Date = new Date(),
  holidayClosures: HolidayClosureRange[] = []
): SessionStatus {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "UNKNOWN";
  }

  const { year, month, day, hour, minute, dayOfWeek } = getEasternTimeParts(date);

  // Check custom holiday closures (from Bitget calendar or configured list)
  const timeMs = date.getTime();
  for (const range of holidayClosures) {
    const startMs = Date.parse(range.startTime);
    const endMs = Date.parse(range.endTime);
    if (Number.isFinite(startMs) && Number.isFinite(endMs)) {
      if (timeMs >= startMs && timeMs <= endMs) {
        return "HOLIDAY";
      }
    }
  }

  // Check known standard holidays
  if (isStandardUsHoliday(year, month, day)) {
    return "HOLIDAY";
  }

  // Saturday or Sunday is always WEEKEND
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return "WEEKEND";
  }

  // Friday after 16:00 ET transitions into WEEKEND closure
  if (dayOfWeek === 5 && hour >= 16) {
    return "WEEKEND";
  }

  // Monday to Friday: regular trading hours are 09:30 to 16:00 ET
  const isAfterMarketOpen = hour > 9 || (hour === 9 && minute >= 30);
  const isBeforeMarketClose = hour < 16;

  if (isAfterMarketOpen && isBeforeMarketClose) {
    return "REGULAR";
  }

  return "OFF_HOURS";
}

export function isReferenceMarketOpen(status: SessionStatus): boolean {
  return status === "REGULAR";
}


