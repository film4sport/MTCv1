/**
 * Single source of truth for MTC event data.
 * Imported by: Events.tsx, Schedule.tsx, layout.tsx (JSON-LD)
 *
 * When updating events, change ONLY this file.
 */

export type EventCategory = 'social' | 'tournament' | 'camp' | 'coaching';
export type CalendarEventType = 'social' | 'tournament' | 'special' | 'match';

export interface MTCEvent {
  id: string;
  title: string;
  category: EventCategory;
  isoDate: string;            // YYYY-MM-DD (start date)
  endDate?: string;           // YYYY-MM-DD (if multi-day)
  date: string;               // Human-readable date string
  time: string;               // e.g. "12:30 - 3:00 PM" or "Evening"
  description: string;
  highlight: string;          // Time or price shown on card
  calendarType: CalendarEventType; // How it appears on the calendar
  price?: string;             // e.g. "180" (CAD, for JSON-LD)
  isFree?: boolean;           // For JSON-LD isAccessibleForFree
  recurring?: boolean;        // If this represents a recurring weekly event
}

export interface RecurringEvent {
  day: number;                // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  title: string;
  time: string;
  calendarType: CalendarEventType;
}

// ────────────────────────────────────────────────────────────
// SPECIAL / ONE-OFF EVENTS
// ────────────────────────────────────────────────────────────

export const specialEvents: MTCEvent[] = [
  {
    id: 'euchre-tournament',
    category: 'social',
    isoDate: '2026-03-14',
    date: 'March 14, 2026',
    title: 'Euchre Tournament',
    description:
      'Pre-season Euchre tournament! Open to members and guests. Prizes for top teams. Come kick off the new season.',
    highlight: 'Evening',
    time: 'Evening',
    calendarType: 'social',
    isFree: true,
  },
  {
    id: 'opening-day-bbq',
    category: 'social',
    isoDate: '2026-05-09',
    date: 'May 9, 2026',
    title: 'Opening Day BBQ & Round Robin',
    description:
      'Kick off the 2026 season! BBQ, music, and meet our coaching staff including Mark Taylor. All members, families, and guests welcome.',
    highlight: '12:30 - 3:00 PM',
    time: '12:30 - 3:00 PM',
    calendarType: 'special',
    isFree: true,
  },
  {
    id: 'french-open-rr',
    category: 'social',
    isoDate: '2026-06-07',
    date: 'June 7, 2026',
    title: 'French Open Round Robin Social',
    description:
      'Celebrate the French Open with a themed round robin social! Mixed doubles, prizes, and refreshments. All skill levels welcome.',
    highlight: '1:00 - 4:00 PM',
    time: '1:00 - 4:00 PM',
    calendarType: 'social',
    isFree: true,
  },
  {
    id: 'wimbledon-rr',
    category: 'social',
    isoDate: '2026-07-12',
    date: 'July 12, 2026',
    title: 'Wimbledon Open Round Robin',
    description:
      'Whites encouraged! Join our Wimbledon-themed round robin with mixed doubles play, strawberries & cream, and great prizes.',
    highlight: '1:00 - 4:00 PM',
    time: '1:00 - 4:00 PM',
    calendarType: 'social',
    isFree: true,
  },
  {
    id: 'mixed-doubles-tournament',
    category: 'tournament',
    isoDate: '2026-07-18',
    endDate: '2026-07-19',
    date: 'July 18-19, 2026',
    title: '95+ Mixed Doubles Tournament',
    description:
      '$180/Team — 2 Matches Guaranteed. A+B Draw, Over 95 Mixed Doubles. Includes lunches at Mono Cliffs Inn and great prizes!',
    highlight: '$180/Team',
    time: 'All Day',
    calendarType: 'tournament',
    price: '180',
  },
  {
    id: 'summer-camps',
    category: 'camp',
    isoDate: '2026-07-01',
    date: 'Summer 2026 · Dates TBA',
    title: 'Summer Camps',
    description:
      'Junior camps coming this summer! Dates are being confirmed once pros are available. Stay tuned for registration details.',
    highlight: 'Dates Coming Soon',
    time: 'TBA',
    calendarType: 'special',
    isFree: false,
  },
];

// ────────────────────────────────────────────────────────────
// RECURRING WEEKLY EVENTS (shown on cards + calendar)
// ────────────────────────────────────────────────────────────

export const recurringCardEvents: MTCEvent[] = [
  {
    id: 'mens-round-robin',
    category: 'social',
    isoDate: '2026-05-12',
    date: 'Every Tuesday · Starts May 12',
    title: "Men's Round Robin",
    description:
      "Weekly men's round robin every Tuesday morning. All skill levels welcome. Courts 1-2.",
    highlight: '9:00 - 11:00 AM',
    time: '9:00 - 11:00 AM',
    calendarType: 'social',
    recurring: true,
    isFree: true,
  },
  {
    id: 'freedom-55',
    category: 'social',
    isoDate: '2026-05-14',
    date: 'Every Thursday · Starts May 14',
    title: 'Freedom 55 League',
    description:
      'Thursday morning league for the 55+ crowd. Fun and social tennis. Courts 1-2.',
    highlight: '9:00 - 11:00 AM',
    time: '9:00 - 11:00 AM',
    calendarType: 'social',
    recurring: true,
    isFree: true,
  },
  {
    id: 'ladies-round-robin',
    category: 'social',
    isoDate: '2026-05-15',
    date: 'Every Friday · Starts May 15',
    title: "Ladies Round Robin",
    description:
      "Weekly ladies round robin every Friday morning. All skill levels welcome. Courts 1-2.",
    highlight: '9:00 - 11:00 AM',
    time: '9:00 - 11:00 AM',
    calendarType: 'social',
    recurring: true,
    isFree: true,
  },
  {
    id: 'friday-mixed',
    category: 'social',
    isoDate: '2026-05-15',
    date: 'Every Friday · Starts May 15',
    title: 'Friday Night Mixed Round Robin',
    description:
      'Mixed doubles round robin every Friday evening. Rotating partners, fun format! All Courts.',
    highlight: '6:00 - 9:00 PM',
    time: '6:00 - 9:00 PM',
    calendarType: 'social',
    recurring: true,
    isFree: true,
  },
];

// Combined list for the Events section cards (special + recurring, sorted by date)
export const allCardEvents: MTCEvent[] = [
  ...specialEvents,
  ...recurringCardEvents,
].sort((a, b) => a.isoDate.localeCompare(b.isoDate));

// ────────────────────────────────────────────────────────────
// CALENDAR-SPECIFIC DATA (for Schedule.tsx)
// ────────────────────────────────────────────────────────────

/** Special events mapped for calendar rendering (one entry per date) */
export const calendarSpecialEvents = specialEvents.flatMap((e) => {
  const entries = [{ date: e.isoDate, title: e.title, time: e.time, type: e.calendarType }];
  // Multi-day events get separate calendar entries
  if (e.endDate && e.endDate !== e.isoDate) {
    entries.push({ date: e.endDate, title: `${e.title} (Day 2)`, time: e.time, type: e.calendarType });
  }
  return entries;
});

/** Recurring weekly events for calendar dots */
export const calendarRecurringEvents: RecurringEvent[] = [
  { day: 2, title: "Men's Round Robin", time: '9:00 - 11:00 AM', calendarType: 'social' },
  { day: 4, title: 'Freedom 55 League', time: 'Morning', calendarType: 'social' },
  { day: 4, title: 'Interclub Competitive League (A & B)', time: '7:00 - 9:30 PM', calendarType: 'match' },
  { day: 5, title: "Ladies Round Robin", time: '9:00 - 11:00 AM', calendarType: 'social' },
  { day: 5, title: 'Friday Night Mixed Round Robin', time: '6:00 - 9:00 PM', calendarType: 'social' },
];

// ────────────────────────────────────────────────────────────
// JSON-LD HELPERS (for layout.tsx)
// ────────────────────────────────────────────────────────────

const SITE_URL = 'https://www.monotennisclub.com';

/** Generate schema.org event objects from the shared data */
export function getJsonLdEvents() {
  // Only include key events in JSON-LD (not recurring card events)
  return specialEvents
    .filter((e) => e.id !== 'summer-camps') // camps TBA, skip JSON-LD
    .map((e) => {
      const isSportsEvent = e.category === 'tournament' || e.category === 'social';
      const base: Record<string, unknown> = {
        '@type': isSportsEvent ? 'SportsEvent' : 'Event',
        name: e.title,
        description: e.description,
        startDate: e.isoDate,
        location: { '@id': `${SITE_URL}/#organization` },
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        organizer: { '@id': `${SITE_URL}/#organization` },
      };
      if (isSportsEvent) base.sport = 'Tennis';
      if (e.endDate) base.endDate = e.endDate;
      if (e.price) {
        base.offers = {
          '@type': 'Offer',
          price: e.price,
          priceCurrency: 'CAD',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/#events`,
        };
      } else {
        base.isAccessibleForFree = true;
      }
      return base;
    });
}

/** Event filter categories for the landing page */
export const eventFilters = [
  { label: 'All Events', value: 'all' },
  { label: 'Tournaments', value: 'tournament' },
  { label: 'Camps', value: 'camp' },
  { label: 'Coaching', value: 'coaching' },
  { label: 'Social', value: 'social' },
] as const;
