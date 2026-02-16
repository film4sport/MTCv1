// .ics calendar file generator

interface CalendarEvent {
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  duration?: number; // minutes, default 60
  location?: string;
  description?: string;
}

function parseTime(time: string): { hour: number; minute: number } {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: 9, minute: 0 };
  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

function toICSDate(date: string, time: string): string {
  const { hour, minute } = parseTime(time);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function addMinutes(date: string, time: string, minutes: number): string {
  const { hour, minute } = parseTime(time);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(hour, minute + minutes, 0, 0);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function generateSingleEvent(event: CalendarEvent): string {
  const duration = event.duration || 60;
  const dtStart = toICSDate(event.date, event.time);
  const dtEnd = addMinutes(event.date, event.time, duration);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@mtc.ca`;

  let vevent = `BEGIN:VEVENT\r\n`;
  vevent += `UID:${uid}\r\n`;
  vevent += `DTSTART:${dtStart}\r\n`;
  vevent += `DTEND:${dtEnd}\r\n`;
  vevent += `SUMMARY:${event.title}\r\n`;
  if (event.location) vevent += `LOCATION:${event.location}\r\n`;
  if (event.description) vevent += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\r\n`;
  vevent += `END:VEVENT\r\n`;
  return vevent;
}

export function generateICS(events: CalendarEvent[]): string {
  let ics = `BEGIN:VCALENDAR\r\n`;
  ics += `VERSION:2.0\r\n`;
  ics += `PRODID:-//Mono Tennis Club//MTC//EN\r\n`;
  ics += `CALSCALE:GREGORIAN\r\n`;
  for (const event of events) {
    ics += generateSingleEvent(event);
  }
  ics += `END:VCALENDAR\r\n`;
  return ics;
}

export function downloadICS(events: CalendarEvent[], filename: string = 'mtc-booking.ics') {
  const ics = generateICS(events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
