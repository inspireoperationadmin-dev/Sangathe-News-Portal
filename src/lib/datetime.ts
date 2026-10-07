const COLOMBO_TIME_ZONE = "Asia/Colombo";
const COLOMBO_OFFSET = "+05:30";

function colomboParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function toColomboDateTimeInput(date?: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const value = colomboParts(date);
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export function parseColomboDateTime(value: string) {
  const input = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return null;
  const date = new Date(`${input}:00${COLOMBO_OFFSET}`);
  if (Number.isNaN(date.getTime()) || toColomboDateTimeInput(date) !== input) return null;
  return date;
}

export function formatColomboDateTime(date: Date) {
  return `${new Intl.DateTimeFormat("en-LK", {
    timeZone: COLOMBO_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)} (Sri Lanka time)`;
}
