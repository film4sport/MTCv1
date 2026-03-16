'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { User, Court, Booking, ClubEvent, Partner, Conversation, Announcement, Notification, WeatherData, AdminAnalytics, CoachingProgram, NotificationPreferences, FamilyMember, ActiveProfile } from './types';
import { CLUB_LOCATION, DEFAULT_NOTIFICATION_PREFS } from './types';
import { DEFAULT_COURTS, DEFAULT_EVENTS, DEFAULT_ANNOUNCEMENTS, DEFAULT_PROGRAMS } from './data';
import { generateId } from './utils';
import { pinLogin, signOut, getCurrentUser } from './auth';
import { useToast } from './toast';
import { reportError } from '../../lib/errorReporter';
import { supabase } from '../../lib/supabase';
import * as db from './db';

// ── Context interfaces (split for targeted re-renders) ──────────────

interface AuthState {
  currentUser: User | null;
  updateCurrentUser: (updates: Partial<User>) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoaded: boolean;
  refreshData: () => Promise<void>;
}

interface BookingState {
  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => Promise<void>;
  cancelBooking: (id: string) => void;
  confirmParticipant: (bookingId: string, participantId: string) => void;
  courts: Court[];
  setCourts: (courts: Court[]) => void;
}

interface EventsState {
  events: ClubEvent[];
  setEvents: (events: ClubEvent[]) => void;
  toggleRsvp: (eventId: string, userName: string) => void;
  createEvent: (eventData: { title: string; type: string; date: string; time: string; location?: string; spotsTotal?: number; price?: string; description?: string }) => Promise<void>;
  updateEvent: (id: string, updates: Record<string, unknown>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  programs: CoachingProgram[];
  setPrograms: (programs: CoachingProgram[]) => void;
  addProgram: (program: CoachingProgram) => void;
  cancelProgram: (programId: string) => void;
  enrollInProgram: (programId: string, memberId: string, memberName: string) => void;
  withdrawFromProgram: (programId: string, memberId: string) => void;
}

interface SocialState {
  partners: Partner[];
  setPartners: (partners: Partner[]) => void;
  addPartner: (partner: Partner) => void;
  removePartner: (partnerId: string) => void;
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  sendMessage: (toId: string, text: string) => Promise<void>;
  markConversationRead: (memberId: string) => void;
  deleteConversation: (memberId: string) => void;
  deleteMessage: (memberId: string, messageId: string) => void;
}

interface NotificationState {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  deleteReadNotifications: () => void;
  announcements: Announcement[];
  setAnnouncements: (announcements: Announcement[]) => void;
  dismissAnnouncement: (id: string) => void;
  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: (prefs: NotificationPreferences) => void;
}

interface FamilyState {
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
  activeProfile: ActiveProfile;
  switchProfile: (profile: ActiveProfile) => void;
  activeDisplayName: string;
  activeAvatar: string;
  activeSkillLevel: string;
}

interface DerivedState {
  weather: WeatherData;
  analytics: AdminAnalytics;
  members: User[];
  setMembers: (members: User[]) => void;
}

// ── Contexts ──────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null);
const BookingContext = createContext<BookingState | null>(null);
const EventsContext = createContext<EventsState | null>(null);
const SocialContext = createContext<SocialState | null>(null);
const NotificationContext = createContext<NotificationState | null>(null);
const FamilyContext = createContext<FamilyState | null>(null);
const DerivedContext = createContext<DerivedState | null>(null);

// ── Focused hooks (components subscribe to only what they need) ──

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AppProvider');
  return ctx;
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookings must be used within AppProvider');
  return ctx;
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within AppProvider');
  return ctx;
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within AppProvider');
  return ctx;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within AppProvider');
  return ctx;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within AppProvider');
  return ctx;
}

export function useDerived() {
  const ctx = useContext(DerivedContext);
  if (!ctx) throw new Error('useDerived must be used within AppProvider');
  return ctx;
}

/** @deprecated Use focused hooks (useAuth, useBookings, etc.) instead. */
export function useApp() {
  return { ...useAuth(), ...useBookings(), ...useEvents(), ...useSocial(), ...useNotifications(), ...useFamily(), ...useDerived() };
}

// localStorage helpers
function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    reportError(err, `localStorage parse: ${key}`);
    return fallback;
  }
}

function safeLoadArray<T>(key: string, fallback: T[]): T[] {
  const loaded = loadJSON(key, fallback);
  return Array.isArray(loaded) ? loaded : fallback;
}

function saveJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    reportError(err, `localStorage quota: ${key}`);
  }
}

/** Safely ensure data is always an array (defensive against corrupted data). */
function safeArray<T>(data: T[]): T[] {
  return Array.isArray(data) ? data : [];
}

/** Merge Supabase events with DEFAULT_EVENTS.
 *  Supabase rows win by ID; any defaults not in Supabase are preserved.
 *  This prevents losing hardcoded events (tournaments, specials) when
 *  Supabase only returns a partial set (e.g. just recurring events). */
function mergeEventsWithDefaults(supabaseEvents: ClubEvent[]): ClubEvent[] {
  const arr = safeArray(supabaseEvents);
  if (arr.length === 0) return DEFAULT_EVENTS;
  const supabaseIds = new Set(arr.map(e => e.id));
  const defaultsNotInSupabase = DEFAULT_EVENTS.filter(e => !supabaseIds.has(e.id));
  return [...arr, ...defaultsNotInSupabase];
}

/**
 * Authenticated API call helper.
 * Routes mutations through Next.js API routes (which use the admin Supabase client)
 * instead of the browser's Supabase client (which is subject to RLS policies).
 * This eliminates an entire class of bugs where missing/incorrect RLS policies
 * cause silent failures (200 OK, 0 rows affected).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiCall<T = any>(path: string, method: string, body?: Record<string, unknown>): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mtc-session-token') : null;
  if (!token) throw new Error('No active session');
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errBody.error || `API ${method} ${path} failed: ${res.status}`);
  }
  // Parse and return JSON body (or empty object for 204)
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [courts, setCourts] = useState<Court[]>(DEFAULT_COURTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>(DEFAULT_EVENTS);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEFAULT_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [weather, setWeather] = useState<WeatherData>({
    tempC: 0, tempF: 32, condition: 'sunny', wind: 0, humidity: 0, description: 'Loading...', lastUpdated: null,
  });
  const [programs, setPrograms] = useState<CoachingProgram[]>(DEFAULT_PROGRAMS);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [activeProfile, setActiveProfile] = useState<ActiveProfile>({ type: 'primary' });
  const { showToast } = useToast();

  // ── Debounce refs (prevent rapid duplicate calls) ──────────
  const pendingRsvps = useRef<Set<string>>(new Set());

  /** Deduplicate notifications: skip if same id OR same type+title within last 30s */
  const addNotification = useCallback((notif: Notification) => {
    setNotifications(prev => {
      // Exact ID match = definite duplicate
      if (notif.id && prev.some(n => n.id === notif.id)) return prev;
      // Same type+title within 30s = likely duplicate from Realtime echo
      const thirtySecsAgo = new Date(Date.now() - 30_000).toISOString();
      const isDupe = prev.some(n =>
        n.title === notif.title && n.type === notif.type && n.timestamp > thirtySecsAgo
      );
      return isDupe ? prev : [notif, ...prev];
    });
  }, []);

  // ── Analytics date key (recalculates when the date changes) ──────────
  const [analyticsDateKey, setAnalyticsDateKey] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => {
    const checkDate = () => {
      const today = new Date().toISOString().slice(0, 10);
      if (today !== analyticsDateKey) setAnalyticsDateKey(today);
    };
    const id = setInterval(checkDate, 60_000); // check every minute
    return () => clearInterval(id);
  }, [analyticsDateKey]);

  // ── Computed analytics (derived from real data) ──────────
  const analytics = useMemo<AdminAnalytics>(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const today = now.toISOString().slice(0, 10);
    const dayOfWeek = now.getDay(); // 0=Sun
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // Membership fee lookup
    const FEES: Record<string, number> = { adult: 120, family: 240, junior: 55 };

    // --- Bookings this month vs last month ---
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const bookingsThisMonth = confirmedBookings.filter(b => {
      const d = new Date(b.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const bookingsLastMonth = confirmedBookings.filter(b => {
      const d = new Date(b.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });
    const bookingsChange = bookingsLastMonth.length > 0
      ? Math.round(((bookingsThisMonth.length - bookingsLastMonth.length) / bookingsLastMonth.length) * 100)
      : bookingsThisMonth.length > 0 ? 100 : 0;

    // --- Court usage ---
    const bookingsToday = confirmedBookings.filter(b => b.date === today).length;
    const bookingsThisWeek = confirmedBookings.filter(b => b.date >= weekStartStr && b.date <= today).length;

    // --- Peak times (top 5 day+time combos) ---
    const dayTimeMap = new Map<string, number>();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const b of confirmedBookings) {
      const d = new Date(b.date);
      const key = `${dayNames[d.getDay()]}|${b.time}`;
      dayTimeMap.set(key, (dayTimeMap.get(key) || 0) + 1);
    }
    const peakTimes = Array.from(dayTimeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => {
        const [day, time] = key.split('|');
        return { day, time, bookings: count };
      });

    // --- Revenue breakdown (membership fees + program fees) ---
    const membershipRevenue = members.reduce((sum, m) => {
      const fee = FEES[(m.membershipType as string) || 'adult'] || FEES.adult;
      return sum + fee;
    }, 0);
    const programRevenue = programs.reduce((sum, p) => sum + (p.fee * (p.enrolledMembers?.length || 0)), 0);
    const totalRevenue = membershipRevenue + programRevenue;
    const revenueBreakdown = [
      { category: 'Memberships', amount: membershipRevenue, percentage: totalRevenue > 0 ? Math.round((membershipRevenue / totalRevenue) * 100) : 0 },
      ...(programRevenue > 0 ? [{ category: 'Programs', amount: programRevenue, percentage: Math.round((programRevenue / totalRevenue) * 100) }] : []),
    ];

    // --- Revenue this month (from members who joined this month + program enrollments) ---
    const newMembersThisMonth = members.filter(m => {
      if (!m.memberSince) return false;
      const d = new Date(m.memberSince);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const revenueThisMonth = newMembersThisMonth.reduce((sum, m) => sum + (FEES[(m.membershipType as string) || 'adult'] || FEES.adult), 0) + programRevenue;
    const revenueLastMonth = 0; // Would need historical data to compute properly
    const revenueChange = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : revenueThisMonth > 0 ? 100 : 0;

    // --- Member activity ---
    const bookingsPerMember = new Map<string, { name: string; count: number }>();
    for (const b of confirmedBookings) {
      const prev = bookingsPerMember.get(b.userId);
      bookingsPerMember.set(b.userId, { name: b.userName, count: (prev?.count || 0) + 1 });
    }
    const mostActive = Array.from(bookingsPerMember.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(m => ({ name: m.name, bookings: m.count }));

    // --- Monthly trends (last 6 months) ---
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends: AdminAnalytics['monthlyTrends'] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(thisYear, thisMonth - i, 1);
      const mo = m.getMonth();
      const yr = m.getFullYear();
      const count = confirmedBookings.filter(b => {
        const d = new Date(b.date);
        return d.getMonth() === mo && d.getFullYear() === yr;
      }).length;
      const newMembers = members.filter(mem => {
        if (!mem.memberSince) return false;
        const d = new Date(mem.memberSince);
        return d.getMonth() === mo && d.getFullYear() === yr;
      });
      const rev = newMembers.reduce((s, mem) => s + (FEES[(mem.membershipType as string) || 'adult'] || FEES.adult), 0);
      monthlyTrends.push({ month: monthNames[mo], bookings: count, revenue: rev });
    }

    return {
      totalBookingsThisMonth: bookingsThisMonth.length,
      bookingsChange,
      revenueThisMonth,
      revenueChange,
      peakTimes,
      courtUsage: { today: bookingsToday, thisWeek: bookingsThisWeek, thisMonth: bookingsThisMonth.length },
      revenueBreakdown,
      memberActivity: {
        mostActive,
        newMembersThisMonth: newMembersThisMonth.length,
        avgBookingsPerMember: members.length > 0 ? Math.round((confirmedBookings.length / members.length) * 10) / 10 : 0,
      },
      monthlyTrends,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, members, programs, analyticsDateKey]);

  // ── Notification preference gating ──────────────────────
  // Maps notification type → preference key. Returns true if the user allows this type.
  const shouldNotify = useCallback((type: Notification['type']): boolean => {
    const prefMap: Record<string, keyof NotificationPreferences> = {
      booking: 'bookings', event: 'events', partner: 'partners',
      message: 'messages', program: 'programs', announcement: 'bookings', // announcements always shown
    };
    const key = prefMap[type];
    return key ? notificationPreferences[key] !== false : true;
  }, [notificationPreferences]);

  // ── Email send with retry ────────────────────────────────
  // Retries up to 2 times on failure, shows warning toast if all attempts fail.
  const fetchWithRetry = useCallback(async (
    url: string,
    options: RequestInit,
    label: string,
    maxRetries = 2,
  ) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) {
          // Check that emails were actually sent (not just a 200 with sent: 0)
          try {
            const body = await res.clone().json();
            if (body.sent > 0) return; // emails actually sent
            // 200 but sent: 0 — SMTP likely not configured
            console.error(`[email] ${label}: API returned ok but sent 0 emails.`, body.message);
          } catch {
            return; // couldn't parse response, assume success
          }
        }
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // backoff
          continue;
        }
      } catch (err) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        reportError(err, `${label} fetch failed after ${maxRetries + 1} attempts`);
      }
    }
    // All retries exhausted — show warning
    showToast(`${label} email couldn't be sent. The booking itself was saved.`, 'error');
  }, [showToast]);

  // Load user from Supabase session on mount (localStorage as instant fallback)
  useEffect(() => {
    // Instant hydration from localStorage cache
    const savedUser = loadJSON<User | null>('mtc-current-user', null);
    if (savedUser) setCurrentUser(savedUser);

    // Then verify against Supabase session and fetch live data
    getCurrentUser().catch((err) => { reportError(err instanceof Error ? err : new Error(String(err)), 'getCurrentUser'); return null; }).then(async (user) => {
      if (user) {
        setCurrentUser(user);
        saveJSON('mtc-current-user', user);

        // Fetch all data from Supabase in parallel (allSettled so one failure doesn't block others)
        try {
          const results = await Promise.allSettled([
            db.fetchMembers(),
            db.fetchBookings(),
            db.fetchEvents(),
            db.fetchCourts(),
            db.fetchPartners(),
            db.fetchConversations(user.id),
            db.fetchAnnouncements(user.id),
            db.fetchNotifications(user.id),
            db.fetchPrograms(),
            db.fetchNotificationPreferences(user.id),
          ]);

          const val = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
            r.status === 'fulfilled' ? r.value : fallback;

          // Overwrite state with Supabase data (source of truth), keep defaults on failure
          setMembers(safeArray(val(results[0], [])));
          setBookings(safeArray(val(results[1], [])));
          setEvents(mergeEventsWithDefaults(val(results[2], [])));
          const courtsData = safeArray(val(results[3], []));
          if (courtsData.length > 0) setCourts(courtsData);
          setPartners(safeArray(val(results[4], [])));
          setConversations(safeArray(val(results[5], [])));
          const anns = safeArray(val(results[6], []));
          if (anns.length > 0) setAnnouncements(anns);
          setNotifications(safeArray(val(results[7], [])));
          const progs = safeArray(val(results[8], []));
          if (progs.length > 0) setPrograms(progs);
          const notifPrefs = val(results[9], null);
          if (notifPrefs) setNotificationPreferences(notifPrefs);

          // Log any failures for debugging
          results.forEach((r, i) => {
            if (r.status === 'rejected') {
              const names = ['members','bookings','events','courts','partners','conversations','announcements','notifications','programs','notifPrefs'];
              reportError(r.reason instanceof Error ? r.reason : new Error(String(r.reason)), `Fetch ${names[i]}`);
            }
          });
        } catch (err) {
          reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase init');
        }

        // ── One-time notifications for existing users (beta notice + opening day) ──
        // Runs once per user — checks localStorage flag to avoid duplicates.
        // New users get these from /auth/callback; this catches users who signed up before these were added.
        const betaNotifKey = `mtc-beta-notice-sent-${user.id}`;
        if (!localStorage.getItem(betaNotifKey) && new Date() < new Date('2026-05-09T00:00:00')) {
          localStorage.setItem(betaNotifKey, 'true');
          const now = new Date().toISOString();
          // Check if they already have these notifications (from auth callback)
          db.fetchNotifications(user.id).then(existing => {
            const ids = safeArray(existing).map((n: Notification) => n.id);
            const inserts: Array<{ id: string; user_id: string; type: string; title: string; body: string; timestamp: string; read: boolean }> = [];
            if (!ids.includes(`opening-day-${user.id}`)) {
              inserts.push({
                id: `opening-day-${user.id}`, user_id: user.id, type: 'event',
                title: 'Opening Day — May 9th!',
                body: 'Mark your calendar! Mono Tennis Club opens for the 2026 season on May 9th. See you on the courts!',
                timestamp: now, read: false,
              });
            }
            if (!ids.includes(`beta-notice-${user.id}`)) {
              inserts.push({
                id: `beta-notice-${user.id}`, user_id: user.id, type: 'info',
                title: 'App Under Construction',
                body: 'Our app and website are still in development. If you find any bugs or have feedback, please email monotennisclub1@gmail.com — we appreciate your help!',
                timestamp: new Date(Date.parse(now) + 1000).toISOString(), read: false,
              });
            }
            if (inserts.length > 0) {
              supabase.from('notifications').insert(inserts).then(() => {
                // Re-fetch to update bell
                db.fetchNotifications(user.id).then(n => setNotifications(safeArray(n))).catch(() => {});
              }, () => {});
            }
          }).catch(() => {});
        }

        // Fetch family members if user has a family membership
        if (user.familyId) {
          db.fetchFamilyMembers(user.familyId).then(fm => setFamilyMembers(safeArray(fm))).catch(err => reportError(err, 'Family'));
        }

        // Restore active profile from localStorage
        const savedProfile = loadJSON<ActiveProfile>('mtc-active-profile', { type: 'primary' });
        setActiveProfile(savedProfile);
      } else if (savedUser) {
        // Supabase session expired — clear cached user
        setCurrentUser(null);
        localStorage.removeItem('mtc-current-user');
      }
      setIsLoaded(true);
    });

    // localStorage data is loaded via useState defaults above.
    // Supabase fetch in getCurrentUser().then() overwrites with live data.
    // No duplicate setState calls here — they caused a race condition where
    // stale localStorage values could overwrite fresh Supabase data.
  }, []);

  // Persist to localStorage on changes
  useEffect(() => { if (isLoaded) saveJSON('mtc-bookings', bookings); }, [bookings, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-conversations', conversations); }, [conversations, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-announcements', announcements); }, [announcements, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-notifications', notifications); }, [notifications, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-programs', programs); }, [programs, isLoaded]);
  const notifPrefTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLoaded) {
      saveJSON('mtc-notification-prefs', notificationPreferences);
      // Debounce Supabase write — user may toggle multiple switches quickly
      if (notifPrefTimerRef.current) clearTimeout(notifPrefTimerRef.current);
      notifPrefTimerRef.current = setTimeout(() => {
        if (currentUser) apiCall('/api/mobile/settings', 'PATCH', { action: 'setNotifPrefs', prefs: notificationPreferences }).catch((err) => reportError(err, 'API'));
      }, 500);
    }
    return () => { if (notifPrefTimerRef.current) clearTimeout(notifPrefTimerRef.current); };
  }, [notificationPreferences, isLoaded, currentUser]);

  // Ref to avoid stale closure in Realtime handlers — only the ID is needed
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Supabase Realtime — live updates from other users
  useEffect(() => {
    if (!isLoaded || !currentUser) return;
    const userId = currentUser.id;

    // Debounce messages Realtime to avoid stomping optimistic sends
    let msgDebounce: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetchConversations = () => {
      if (msgDebounce) clearTimeout(msgDebounce);
      msgDebounce = setTimeout(() => {
        db.fetchConversations(userId).then(c => {
          setConversations(safeArray(c));
        }).catch(err => reportError(err, 'Realtime messages'));
      }, 1500);
    };

    // Fetch events via API route (admin client, bypasses RLS).
    // The browser Supabase client's nested select on event_attendees can silently
    // return empty attendees if RLS blocks the join — the API uses the service key.
    const fetchEventsViaApi = async () => {
      try {
        const events = await apiCall<ClubEvent[]>('/api/mobile/events', 'GET');
        setEvents(mergeEventsWithDefaults(events));
      } catch {
        // Fallback to browser client if API fails (e.g. not logged in yet)
        const e = await db.fetchEvents();
        setEvents(mergeEventsWithDefaults(e));
      }
    };

    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        db.fetchBookings().then(b => setBookings(Array.isArray(b) ? b : [])).catch(err => reportError(err, 'Realtime bookings'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_participants' }, () => {
        db.fetchBookings().then(b => setBookings(Array.isArray(b) ? b : [])).catch(err => reportError(err, 'Realtime booking_participants'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        debouncedFetchConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        db.fetchNotifications(userId).then(n => {
          setNotifications(safeArray(n));
        }).catch(err => reportError(err, 'Realtime notifications'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        db.fetchAnnouncements(userId).then(a => {
          const arr = safeArray(a); if (arr.length > 0) setAnnouncements(arr);
        }).catch(err => reportError(err, 'Realtime announcements'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, () => {
        db.fetchPartners().then(p => {
          setPartners(safeArray(p));
        }).catch(err => reportError(err, 'Realtime partners'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        db.fetchMembers().then(m => setMembers(safeArray(m))).catch(err => reportError(err, 'Realtime members'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, () => {
        db.fetchCourts().then(c => setCourts(safeArray(c))).catch(err => reportError(err, 'Realtime courts'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coaching_programs' }, () => {
        db.fetchPrograms().then(p => { const arr = safeArray(p); if (arr.length > 0) setPrograms(arr); }).catch(err => reportError(err, 'Realtime programs'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'program_enrollments' }, () => {
        db.fetchPrograms().then(p => { const arr = safeArray(p); if (arr.length > 0) setPrograms(arr); }).catch(err => reportError(err, 'Realtime enrollments'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEventsViaApi().catch(err => reportError(err, 'Realtime events'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendees' }, () => {
        fetchEventsViaApi().catch(err => reportError(err, 'Realtime RSVPs'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'court_blocks' }, () => {
        // Court blocks are fetched directly in the booking page — trigger a bookings refetch
        // to cause the booking page to re-render and re-fetch blocks
        db.fetchBookings().then(b => setBookings(Array.isArray(b) ? b : [])).catch(err => reportError(err, 'Realtime court_blocks'));
      })
      .subscribe();

    // Heartbeat fallback: refetch critical data every 2 min if tab visible + online
    // Mirrors Mobile PWA's realtime-sync.js heartbeat pattern
    const HEARTBEAT_MS = 120_000;
    const heartbeat = setInterval(() => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      db.fetchNotifications(userId).then(n => setNotifications(safeArray(n))).catch(() => {});
      db.fetchConversations(userId).then(c => setConversations(safeArray(c))).catch(() => {});
      db.fetchBookings().then(b => setBookings(Array.isArray(b) ? b : [])).catch(() => {});
    }, HEARTBEAT_MS);

    return () => { supabase.removeChannel(channel); clearInterval(heartbeat); if (msgDebounce) clearTimeout(msgDebounce); };
    // Only re-subscribe when user logs in/out — not on every profile update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, currentUser?.id]);

  // Fetch weather (with retry on failure)
  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${CLUB_LOCATION.lat}&longitude=${CLUB_LOCATION.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America/Toronto`
        );
        if (!res.ok) throw new Error(`Weather API ${res.status}`);
        const data = await res.json();
        if (data.current) {
          retryCount = 0; // Reset on success
          const tempC = Math.round(data.current.temperature_2m);
          const tempF = Math.round(tempC * 9 / 5 + 32);
          const windKmh = Math.round(data.current.wind_speed_10m);
          const code = data.current.weather_code;

          let condition: WeatherData['condition'] = 'sunny';
          let description = 'Clear sky';
          if (code === 0) { condition = 'sunny'; description = 'Clear sky'; }
          else if (code <= 3) { condition = 'cloudy'; description = 'Partly cloudy'; }
          else if (code <= 49) { condition = 'cloudy'; description = 'Foggy'; }
          else if (code <= 59) { condition = 'rainy'; description = 'Drizzle'; }
          else if (code <= 69) { condition = 'rainy'; description = 'Rain'; }
          else if (code <= 79) { condition = 'snowy'; description = 'Snow'; }
          else if (code <= 84) { condition = 'rainy'; description = 'Rain showers'; }
          else if (code <= 94) { condition = 'snowy'; description = 'Snow showers'; }
          else if (code >= 95) { condition = 'rainy'; description = 'Thunderstorm'; }

          if (condition === 'sunny' && tempC >= 15 && tempC <= 28 && windKmh < 20) description = 'Perfect tennis weather!';
          else if (condition === 'rainy' || condition === 'snowy') description = 'Consider indoor courts';
          else if (windKmh >= 30) description = 'Very windy — lobs affected';
          else if (tempC < 5) description = 'Bundle up!';
          else if (tempC > 30) description = 'Stay hydrated!';

          setWeather({ tempC, tempF, condition, wind: windKmh, humidity: data.current.relative_humidity_2m, description, lastUpdated: new Date().toLocaleTimeString() });
        }
      } catch (err) {
        retryCount++;
        if (retryCount <= MAX_RETRIES) {
          setTimeout(fetchWeather, retryCount * 5000); // Backoff: 5s, 10s, 15s
          return;
        }
        reportError(err, 'Weather fetch');
        setWeather(prev => ({ ...prev, description: 'Weather unavailable — refresh to retry' }));
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 2 * 60 * 60 * 1000); // Every 2 hours (was 30min)
    return () => clearInterval(interval);
  }, []);

  // Update current user fields (e.g. NTRP rating) in state + localStorage + server
  const updateCurrentUser = useCallback((updates: Partial<User>) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveJSON('mtc-current-user', updated);
      return updated;
    });
    // Persist profile changes to server (non-blocking)
    apiCall('/api/mobile/members', 'PATCH', updates as Record<string, unknown>).catch((err) => {
      reportError(err, 'API');
    });
  }, []);

  // Family — profile switching
  const switchProfile = useCallback((profile: ActiveProfile) => {
    setActiveProfile(profile);
    saveJSON('mtc-active-profile', profile);
    // Sync to Supabase preferences
    if (currentUser?.id) {
      const prefActiveProfile = profile.type === 'primary' ? { type: 'primary' } : { type: 'family_member', memberId: (profile as { type: 'family_member'; member: { id: string } }).member.id };
      const prefs = { ...(currentUser.preferences || {}), activeProfile: prefActiveProfile };
      apiCall('/api/mobile/members', 'PATCH', { preferences: prefs }).catch(() => {});
    }
  }, [currentUser?.id, currentUser?.preferences]);

  // Computed: active display name, avatar, skill level based on activeProfile
  const activeDisplayName = useMemo(() => {
    if (activeProfile.type === 'family_member') return activeProfile.member.name;
    return currentUser?.name || '';
  }, [activeProfile, currentUser?.name]);

  const activeAvatar = useMemo(() => {
    if (activeProfile.type === 'family_member') return activeProfile.member.avatar || 'tennis-male-1';
    return currentUser?.avatar || 'tennis-male-1';
  }, [activeProfile, currentUser?.avatar]);

  const activeSkillLevel = useMemo(() => {
    if (activeProfile.type === 'family_member') return activeProfile.member.skillLevel || 'intermediate';
    return currentUser?.skillLevel || 'intermediate';
  }, [activeProfile, currentUser?.skillLevel]);

  // Auth — PIN-based login via auth.ts (pinLogin handles session internally)
  const login = useCallback(async (email: string, pin: string): Promise<boolean> => {
    const result = await pinLogin(email, pin);
    if (result.error || !result.user) return false;
    setCurrentUser(result.user);
    saveJSON('mtc-current-user', result.user);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
    setFamilyMembers([]);
    setActiveProfile({ type: 'primary' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mtc-current-user');
      localStorage.removeItem('mtc-active-profile');
      // Hard redirect to login — avoids race condition with middleware cookie cleanup
      window.location.href = '/login';
    }
  }, []);

  // Helper: fire-and-forget push notification via API
  const firePush = useCallback((recipientId: string, title: string, body: string, type: string, tag?: string) => {
    apiCall('/api/notify-push', 'POST', {
      recipientId, title, body: body.slice(0, 200), type, tag: tag || `${type}-${Date.now()}`,
    }).catch(() => { /* push is best-effort */ });
  }, []);

  // Actions
  const addBooking = useCallback((booking: Booking): Promise<void> => {
    setBookings(prev => [...prev, booking]);
    // Persist via server-side validated API — rollback booking + its notifications on failure
    return apiCall('/api/mobile/bookings', 'POST', {
      courtId: booking.courtId,
      date: booking.date,
      time: booking.time,
      matchType: booking.matchType || 'singles',
      duration: booking.duration || 2,
      isGuest: !!booking.guestName,
      guestName: booking.guestName,
      participants: booking.participants,
      bookedFor: booking.bookedFor,
      userName: booking.userName,
    }).then((data: { booking?: { id: string } }) => {
      // Update client-side booking ID with server-generated ID so cancel works
      const serverId = data.booking?.id;
      if (serverId && serverId !== booking.id) {
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, id: serverId } : b));
      }
    }).catch((err) => {
      reportError(err, 'API');
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      setNotifications(prev => prev.filter(n => !(n.type === 'booking' && n.body?.includes(booking.date) && n.body?.includes(booking.time))));
      showToast(err.message || 'Failed to save booking. Please try again.', 'error');
      throw err; // Re-throw so caller knows it failed
    });
    // Create notification for booker
    if (booking.type === 'lesson') {
      const notif: Notification = {
        id: generateId('n'),
        type: 'booking',
        title: 'Lesson Booked',
        body: `${booking.courtName} booked for lesson on ${booking.date} at ${booking.time}.`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      if (shouldNotify('booking')) {
        addNotification(notif);
        db.createNotification(booking.userId, notif).catch((err) => reportError(err, 'Supabase'));
      }
    }
    if (booking.type === 'court') {
      const notif: Notification = {
        id: generateId('n'),
        type: 'booking',
        title: 'Booking Confirmed',
        body: `${booking.courtName} booked for ${booking.date} at ${booking.time}.`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      if (shouldNotify('booking')) {
        addNotification(notif);
        db.createNotification(booking.userId, notif).catch((err) => reportError(err, 'Supabase'));
      }

      // Participant notifications (bell, push, email, in-app message) are handled
      // server-side by /api/mobile/bookings POST — no client-side duplication needed
    }
  }, [currentUser]);

  const cancelBooking = useCallback((id: string) => {
    // Optimistic UI: mark booking as cancelled immediately
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
    // Persist via server-side API — cancellation notifications (bell, push, email, message)
    // are handled server-side by /api/mobile/bookings DELETE
    apiCall('/api/mobile/bookings', 'DELETE', { bookingId: id }).catch((err) => {
      reportError(err, 'API');
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b));
      showToast(err.message || 'Failed to cancel booking. Please try again.', 'error');
    });
  }, []);

  // Participant confirmation — marks a participant as confirmed on a booking
  const confirmParticipant = useCallback((bookingId: string, participantId: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        participants: b.participants?.map(p =>
          p.id === participantId ? { ...p, confirmedAt: new Date().toISOString(), confirmedVia: 'dashboard' as const } : p
        ),
      };
    }));
    apiCall('/api/mobile/bookings', 'PATCH', { bookingId, participantId, via: 'dashboard' }).catch((err) => {
      reportError(err, 'API');
      showToast('Failed to confirm participant', 'error');
      // Rollback optimistic update
      setBookings(prev => prev.map(b => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          participants: b.participants?.map(p =>
            p.id === participantId ? { ...p, confirmedAt: undefined, confirmedVia: undefined } : p
          ),
        };
      }));
    });
  }, []);

  // Program CRUD
  const addProgram = useCallback((program: CoachingProgram) => {
    setPrograms(prev => [...prev, program]);
    // Auto-generate blocked bookings for each session (optimistic)
    const newBookings: Booking[] = program.sessions.map((s, i) => ({
      id: `bp-${program.id}-${i}`,
      courtId: program.courtId,
      courtName: program.courtName,
      date: s.date,
      time: s.time,
      userId: program.coachId,
      userName: program.coachName,
      status: 'confirmed' as const,
      type: 'program' as const,
      programId: program.id,
    }));
    setBookings(prev => [...prev, ...newBookings]);
    // Persist via API — server creates program + sessions + court bookings
    apiCall('/api/mobile/programs', 'POST', { action: 'create', program }).catch((err) => {
      reportError(err, 'API');
      setPrograms(prev => prev.filter(p => p.id !== program.id));
      setBookings(prev => prev.filter(b => b.programId !== program.id));
      showToast('Failed to create program. Please try again.', 'error');
    });
  }, []);

  const cancelProgram = useCallback((programId: string) => {
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, status: 'cancelled' as const } : p));
    setBookings(prev => prev.map(b => b.programId === programId ? { ...b, status: 'cancelled' as const } : b));
    // Persist via API — server cancels + notifies enrolled members
    apiCall('/api/mobile/programs', 'DELETE', { id: programId }).catch((err) => {
      reportError(err, 'API');
      setPrograms(prev => prev.map(p => p.id === programId ? { ...p, status: 'active' as const } : p));
      setBookings(prev => prev.map(b => b.programId === programId ? { ...b, status: 'confirmed' as const } : b));
      showToast('Failed to cancel program. Please try again.', 'error');
    });
  }, []);

  const enrollInProgram = useCallback((programId: string, memberId: string, _memberName: string) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;
    // Optimistic: add member to enrolled list
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, enrolledMembers: [...p.enrolledMembers, memberId] } : p));
    // Optimistic notification
    if (shouldNotify('program')) {
      const notif: Notification = {
        id: generateId('n'), type: 'program',
        title: `Enrolled in ${program.title}`,
        body: `${program.sessions.length} sessions starting ${program.sessions[0]?.date}. Fee: $${program.fee}.`,
        timestamp: new Date().toISOString(), read: false,
      };
      addNotification(notif);
    }
    // Persist via API — handles bell+push+email+coach welcome message server-side
    apiCall('/api/mobile/programs', 'POST', { programId, action: 'enroll' }).catch((err) => {
      reportError(err, 'API');
      setPrograms(prev => prev.map(p => p.id === programId ? { ...p, enrolledMembers: p.enrolledMembers.filter(m => m !== memberId) } : p));
      showToast(err.message || 'Failed to enroll. Please try again.', 'error');
    });
  }, [programs]);

  const withdrawFromProgram = useCallback((programId: string, memberId: string) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;
    // Optimistic: remove member from enrolled list
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, enrolledMembers: p.enrolledMembers.filter(m => m !== memberId) } : p));
    showToast(`Withdrawn from ${program.title}`);
    // Persist via API — handles bell+push+coach message server-side
    apiCall('/api/mobile/programs', 'POST', { programId, action: 'withdraw' }).catch((err) => {
      reportError(err, 'API');
      setPrograms(prev => prev.map(p => p.id === programId ? { ...p, enrolledMembers: [...p.enrolledMembers, memberId] } : p));
      showToast(err.message || 'Failed to withdraw. Please try again.', 'error');
    });
  }, [programs]);

  const addPartner = useCallback((partner: Partner) => {
    setPartners(prev => [partner, ...prev]);
    apiCall('/api/mobile/partners', 'POST', {
      matchType: partner.matchType, skillLevel: partner.skillLevel,
      availability: partner.availability, message: partner.message,
    }).catch((err) => {
      reportError(err, 'API');
      setPartners(prev => prev.filter(p => p.id !== partner.id));
      showToast('Failed to post partner request. Please try again.', 'error');
    });
    // Create notification for the partner request poster
    if (currentUser) {
      const notif: Notification = {
        id: generateId('n'),
        type: 'partner',
        title: 'Partner Request Posted',
        body: `Looking for ${partner.matchType === 'any' ? 'any match type' : partner.matchType} on ${partner.date} at ${partner.time}.`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      if (shouldNotify('partner')) {
        addNotification(notif);
        db.createNotification(currentUser.id, notif).catch(err => reportError(err, 'Supabase'));
        firePush(currentUser.id, notif.title, notif.body, 'partner', `partner-post-${partner.id}`);
      }
      // Send confirmation email (fire and forget)
      if (currentUser.email) {
        const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('mtc-session-token') : null;
        if (sessionToken) {
          fetch('/api/notify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
            body: JSON.stringify({
              recipientEmail: currentUser.email, recipientName: currentUser.name,
              recipientUserId: currentUser.id,
              subject: 'Partner Request Posted — Mono Tennis Club',
              heading: 'Partner Request Posted',
              body: `Your partner request is live! Looking for ${partner.matchType === 'any' ? 'any match type' : partner.matchType} on ${partner.date} at ${partner.time}. You'll be notified when someone responds.`,
              ctaText: 'View Requests', ctaUrl: 'https://www.monotennisclub.com/dashboard/partners',
              logType: 'partner_request',
            }),
          }).catch(() => { /* email is best-effort */ });
        }
      }
    }
  }, [currentUser]);

  const removePartner = useCallback((partnerId: string) => {
    const removed = partners.find(p => p.id === partnerId);
    setPartners(prev => prev.filter(p => p.id !== partnerId));
    // API DELETE handles matched-user notification + push + bell (admin client, bypasses RLS)
    apiCall('/api/mobile/partners', 'DELETE', { partnerId }).catch((err) => {
      reportError(err, 'API');
      if (removed) setPartners(prev => [...prev, removed]);
      showToast('Failed to remove partner request.', 'error');
    });
  }, [partners, currentUser]);

  const toggleRsvp = useCallback((eventId: string, userName: string) => {
    // Debounce: prevent rapid double-clicks on the same event
    if (pendingRsvps.current.has(eventId)) return;
    pendingRsvps.current.add(eventId);

    // Snapshot for rollback
    setEvents(prev => {
      const snapshot = prev;
      const updated = prev.map(e => {
        if (e.id !== eventId) return e;
        const attending = e.attendees.includes(userName);
        return {
          ...e,
          attendees: attending ? e.attendees.filter(a => a !== userName) : [...e.attendees, userName],
          ...(e.spotsTaken != null ? { spotsTaken: attending ? e.spotsTaken - 1 : e.spotsTaken + 1 } : {}),
        };
      });
      // Persist via API route (admin client, bypasses RLS).
      // Do NOT refetch after success — the optimistic update is correct and
      // refetching via browser client can lose attendees if RLS blocks event_attendees.
      // Notifications are created server-side by the API route (single source of truth).
      apiCall('/api/mobile/events', 'POST', { eventId })
        .catch((err) => {
          reportError(err, 'API');
          setEvents(snapshot);
          showToast('Failed to update RSVP. Please try again.', 'error');
        })
        .finally(() => {
          pendingRsvps.current.delete(eventId);
        });
      return updated;
    });
  }, [currentUser]);

  // Admin event CRUD
  const createEvent = useCallback(async (eventData: { title: string; type: string; date: string; time: string; location?: string; spotsTotal?: number; price?: string; description?: string }) => {
    await apiCall('/api/mobile/events', 'PUT', eventData);
    const e = await db.fetchEvents();
    setEvents(mergeEventsWithDefaults(e));
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Record<string, unknown>) => {
    await apiCall('/api/mobile/events', 'PATCH', { id, ...updates });
    const e = await db.fetchEvents();
    setEvents(mergeEventsWithDefaults(e));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await apiCall('/api/mobile/events', 'DELETE', { id });
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const sendMessage = useCallback((toId: string, text: string): Promise<void> => {
    if (!currentUser) return Promise.resolve();
    const toName = members.find(m => m.id === toId)?.name || '';
    const msg = {
      id: generateId('msg'),
      from: currentUser.name,
      fromId: currentUser.id,
      to: toName,
      toId,
      text,
      timestamp: new Date().toISOString(),
      read: true,
    };
    const msgId = msg.id;
    setConversations(prev => {
      const existing = prev.find(c => c.memberId === toId);
      if (existing) {
        return prev.map(c => c.memberId === toId ? {
          ...c, messages: [...c.messages, msg], lastMessage: text, lastTimestamp: msg.timestamp, unread: 0,
        } : c);
      }
      const member = members.find(m => m.id === toId);
      return [...prev, {
        memberId: toId, memberName: member?.name || '', lastMessage: text, lastTimestamp: msg.timestamp, unread: 0, messages: [msg],
      }];
    });
    // Persist via API route (admin client — bypasses RLS, also handles push + bell notification)
    return apiCall('/api/mobile/conversations', 'POST', { toId, text }).then(() => {}).catch((err) => {
      reportError(err, 'API');
      setConversations(prev => prev.map(c => {
        if (c.memberId !== toId) return c;
        const filtered = c.messages.filter(m => m.id !== msgId);
        const last = filtered[filtered.length - 1];
        return { ...c, messages: filtered, lastMessage: last?.text || '', lastTimestamp: last?.timestamp || c.lastTimestamp };
      }));
      showToast('Failed to send message. Please try again.', 'error');
      throw err; // Re-throw so caller knows it failed
    });
  }, [currentUser, members]);

  const markConversationRead = useCallback((memberId: string) => {
    let convId: number | undefined;
    setConversations(prev => {
      const conv = prev.find(c => c.memberId === memberId);
      convId = conv?.id;
      return prev.map(c => {
        if (c.memberId === memberId && c.unread > 0) {
          return { ...c, unread: 0, messages: c.messages.map(m => m.toId === currentUser?.id ? { ...m, read: true } : m) };
        }
        return c;
      });
    });
    // Persist read status via API
    if (currentUser && convId) {
      apiCall('/api/mobile/conversations', 'PATCH', { conversationId: convId }).catch((e) => reportError(e, 'API'));
    }
  }, [currentUser]);

  const deleteConversation = useCallback((memberId: string) => {
    if (!currentUser) return;
    // Capture removed inside updater to avoid stale closure
    let removed: Conversation | undefined;
    setConversations(prev => {
      removed = prev.find(c => c.memberId === memberId);
      return prev.filter(c => c.memberId !== memberId);
    });

    // Check after state update — removed was captured in updater
    setTimeout(() => {
      if (!removed?.id) {
        showToast('Failed to delete conversation', 'error');
        if (removed) setConversations(prev => [...prev, removed!]);
        return;
      }

      // Delete via API route (uses admin client, bypasses RLS)
      apiCall('/api/mobile/conversations', 'DELETE', { conversationId: removed.id }).catch((e: unknown) => {
        // Rollback: re-add conversation
        if (removed) setConversations(prev => [...prev, removed!]);
        reportError(e, 'API');
        showToast('Failed to delete conversation', 'error');
      });
    }, 0);
  }, [currentUser]);

  const deleteMessage = useCallback((memberId: string, messageId: string) => {
    if (!currentUser) return;
    // Capture snapshot INSIDE the updater to avoid stale closure
    let snapshot: Conversation | undefined;
    setConversations(prev => {
      snapshot = prev.find(c => c.memberId === memberId);
      return prev.map(c => {
        if (c.memberId !== memberId) return c;
        const filtered = c.messages.filter(m => m.id !== messageId);
        const last = filtered[filtered.length - 1];
        return { ...c, messages: filtered, lastMessage: last?.text || '', lastTimestamp: last?.timestamp || c.lastTimestamp };
      });
    });

    // Delete via API route (uses admin client, bypasses RLS)
    apiCall('/api/mobile/conversations', 'DELETE', { messageId }).catch((e: unknown) => {
      // Rollback: restore original conversation
      if (snapshot) {
        setConversations(prev => prev.map(c => c.memberId === memberId ? snapshot! : c));
      }
      reportError(e, 'API');
      showToast('Failed to delete message', 'error');
    });
  }, [currentUser]);

  const dismissAnnouncement = useCallback((id: string) => {
    if (!currentUser) return;
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, dismissedBy: [...a.dismissedBy, currentUser.id] } : a));
    // Persist via API (admin client, bypasses RLS)
    apiCall('/api/mobile/announcements', 'PATCH', { announcementId: id, dismiss: true }).catch((err) => {
      reportError(err, 'API');
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, dismissedBy: a.dismissedBy.filter(uid => uid !== currentUser!.id) } : a));
      showToast('Failed to dismiss announcement.', 'error');
    });
  }, [currentUser]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    // Persist via API (admin client, bypasses RLS)
    apiCall('/api/mobile/notifications', 'PATCH', { id }).catch((err) => reportError(err, 'API'));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Persist via API (admin client, bypasses RLS)
    if (currentUser) apiCall('/api/mobile/notifications', 'PATCH', { markAll: true }).catch((err) => reportError(err, 'API'));
  }, [currentUser]);

  const deleteReadNotifications = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
    // Persist via API (admin client, bypasses RLS)
    apiCall('/api/mobile/notifications', 'DELETE', {}).catch((err) => reportError(err, 'API'));
  }, []);

  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const results = await Promise.allSettled([
        db.fetchMembers(), db.fetchBookings(), db.fetchEvents(), db.fetchCourts(), db.fetchPartners(),
        db.fetchConversations(currentUser.id), db.fetchAnnouncements(currentUser.id),
        db.fetchNotifications(currentUser.id), db.fetchPrograms(),
        db.fetchNotificationPreferences(currentUser.id),
      ]);
      // Helper: extract value from settled result, or return fallback
      const val = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
        r.status === 'fulfilled' ? r.value : fallback;
      const [m, b, ev, ct, p, c, a, n, pr, np] = results;

      setMembers(safeArray(val(m, [])));
      setBookings(safeArray(val(b, [])));
      setEvents(mergeEventsWithDefaults(val(ev, [])));
      const courts_ = val(ct, []);
      if (courts_.length > 0) setCourts(courts_);
      setPartners(safeArray(val(p, [])));
      setConversations(safeArray(val(c, [])));
      const ann_ = safeArray(val(a, []));
      if (ann_.length > 0) setAnnouncements(ann_);
      setNotifications(safeArray(val(n, [])));
      const prog_ = safeArray(val(pr, []));
      if (prog_.length > 0) setPrograms(prog_);
      const np_ = val(np, null);
      if (np_) setNotificationPreferences(np_);

      // Log any failed fetches (but don't block UI)
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const labels = ['members','bookings','events','courts','partners','conversations','announcements','notifications','programs','notifPrefs'];
          console.error(`[refreshData] Failed to fetch ${labels[i]}:`, r.reason);
        }
      });
    } catch (err) {
      reportError(err, 'Refresh');
    }
  }, [currentUser]);

  // ── Split context values (each useMemo triggers re-renders only for its consumers) ──

  const authValue = useMemo<AuthState>(() => ({
    currentUser, updateCurrentUser, login, logout, isLoaded, refreshData,
  }), [currentUser, updateCurrentUser, login, logout, isLoaded, refreshData]);

  const bookingValue = useMemo<BookingState>(() => ({
    bookings, setBookings, addBooking, cancelBooking, confirmParticipant, courts, setCourts,
  }), [bookings, addBooking, cancelBooking, confirmParticipant, courts]);

  const eventsValue = useMemo<EventsState>(() => ({
    events, setEvents, toggleRsvp, createEvent, updateEvent, deleteEvent,
    programs, setPrograms, addProgram, cancelProgram, enrollInProgram, withdrawFromProgram,
  }), [events, toggleRsvp, createEvent, updateEvent, deleteEvent, programs, addProgram, cancelProgram, enrollInProgram, withdrawFromProgram]);

  const socialValue = useMemo<SocialState>(() => ({
    partners, setPartners, addPartner, removePartner,
    conversations, setConversations, sendMessage, markConversationRead, deleteConversation, deleteMessage,
  }), [partners, addPartner, removePartner, conversations, sendMessage, markConversationRead, deleteConversation, deleteMessage]);

  const notificationValue = useMemo<NotificationState>(() => ({
    notifications, setNotifications, markNotificationRead, clearNotifications, deleteReadNotifications,
    announcements, setAnnouncements, dismissAnnouncement,
    notificationPreferences, setNotificationPreferences,
  }), [notifications, markNotificationRead, clearNotifications, deleteReadNotifications, announcements, dismissAnnouncement, notificationPreferences]);

  const familyValue = useMemo<FamilyState>(() => ({
    familyMembers, setFamilyMembers, activeProfile, switchProfile, activeDisplayName, activeAvatar, activeSkillLevel,
  }), [familyMembers, activeProfile, switchProfile, activeDisplayName, activeAvatar, activeSkillLevel]);

  const derivedValue = useMemo<DerivedState>(() => ({
    weather, analytics, members, setMembers,
  }), [weather, analytics, members]);

  return (
    <AuthContext.Provider value={authValue}>
      <BookingContext.Provider value={bookingValue}>
        <EventsContext.Provider value={eventsValue}>
          <SocialContext.Provider value={socialValue}>
            <NotificationContext.Provider value={notificationValue}>
              <FamilyContext.Provider value={familyValue}>
                <DerivedContext.Provider value={derivedValue}>
                  {children}
                </DerivedContext.Provider>
              </FamilyContext.Provider>
            </NotificationContext.Provider>
          </SocialContext.Provider>
        </EventsContext.Provider>
      </BookingContext.Provider>
    </AuthContext.Provider>
  );
}
