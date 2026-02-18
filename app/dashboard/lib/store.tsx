'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Court, Booking, ClubEvent, Partner, Conversation, Announcement, Notification, WeatherData, MemberPayment, AdminAnalytics, CoachingProgram, NotificationPreferences } from './types';
import { CLUB_LOCATION, DEFAULT_NOTIFICATION_PREFS } from './types';
import { DEFAULT_MEMBERS, DEFAULT_COURTS, DEFAULT_BOOKINGS, DEFAULT_EVENTS, DEFAULT_PARTNERS, DEFAULT_CONVERSATIONS, DEFAULT_ANNOUNCEMENTS, DEFAULT_NOTIFICATIONS, DEFAULT_PAYMENTS, DEFAULT_ANALYTICS, DEFAULT_PROGRAMS } from './data';
import { generateId } from './utils';
import { signIn, signOut, getCurrentUser } from './auth';

interface AppState {
  // Auth
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Data
  members: User[];
  courts: Court[];
  setCourts: (courts: Court[]) => void;
  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  cancelBooking: (id: string) => void;
  events: ClubEvent[];
  setEvents: (events: ClubEvent[]) => void;
  toggleRsvp: (eventId: string, userName: string) => void;
  partners: Partner[];
  setPartners: (partners: Partner[]) => void;
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  sendMessage: (toId: string, text: string) => void;
  markConversationRead: (memberId: string) => void;
  announcements: Announcement[];
  setAnnouncements: (announcements: Announcement[]) => void;
  dismissAnnouncement: (id: string) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  weather: WeatherData;
  payments: MemberPayment[];
  setPayments: (payments: MemberPayment[]) => void;
  analytics: AdminAnalytics;
  programs: CoachingProgram[];
  setPrograms: (programs: CoachingProgram[]) => void;
  addProgram: (program: CoachingProgram) => void;
  cancelProgram: (programId: string) => void;
  enrollInProgram: (programId: string, memberId: string, memberName: string) => void;
  withdrawFromProgram: (programId: string, memberId: string) => void;

  // Notification preferences
  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: (prefs: NotificationPreferences) => void;

  // UI
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  isLoaded: boolean;

  // Toasts
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info'; exiting?: boolean }[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// localStorage helpers
function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore quota errors */ }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members] = useState<User[]>(DEFAULT_MEMBERS);
  const [courts, setCourts] = useState<Court[]>(DEFAULT_COURTS);
  const [bookings, setBookings] = useState<Booking[]>(DEFAULT_BOOKINGS);
  const [events, setEvents] = useState<ClubEvent[]>(DEFAULT_EVENTS);
  const [partners, setPartners] = useState<Partner[]>(DEFAULT_PARTNERS);
  const [conversations, setConversations] = useState<Conversation[]>(DEFAULT_CONVERSATIONS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEFAULT_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [weather, setWeather] = useState<WeatherData>({
    tempC: 0, tempF: 32, condition: 'sunny', wind: 0, humidity: 0, description: 'Loading...', lastUpdated: null,
  });
  const [payments, setPayments] = useState<MemberPayment[]>(DEFAULT_PAYMENTS);
  const [analytics] = useState<AdminAnalytics>(DEFAULT_ANALYTICS);
  const [programs, setPrograms] = useState<CoachingProgram[]>(DEFAULT_PROGRAMS);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info'; exiting?: boolean }[]>([]);

  // Load user from Supabase session on mount (localStorage as instant fallback)
  useEffect(() => {
    // Instant hydration from localStorage cache
    const savedUser = loadJSON<User | null>('mtc-current-user', null);
    if (savedUser) setCurrentUser(savedUser);

    // Then verify against Supabase session
    getCurrentUser().then(user => {
      if (user) {
        setCurrentUser(user);
        saveJSON('mtc-current-user', user);
      } else if (savedUser) {
        // Supabase session expired — clear cached user
        setCurrentUser(null);
        localStorage.removeItem('mtc-current-user');
      }
    });

    // Load other data from localStorage (will be migrated to Supabase in db.ts)
    setBookings(loadJSON('mtc-bookings', DEFAULT_BOOKINGS));
    setConversations(loadJSON('mtc-conversations', DEFAULT_CONVERSATIONS));
    setAnnouncements(loadJSON('mtc-announcements', DEFAULT_ANNOUNCEMENTS));
    setNotifications(loadJSON('mtc-notifications', DEFAULT_NOTIFICATIONS));
    setPrograms(loadJSON('mtc-programs', DEFAULT_PROGRAMS));
    setPayments(loadJSON('mtc-payments', DEFAULT_PAYMENTS));
    setNotificationPreferences(loadJSON('mtc-notification-prefs', DEFAULT_NOTIFICATION_PREFS));
    setIsLoaded(true);
  }, []);

  // Persist to localStorage on changes
  useEffect(() => { if (isLoaded) saveJSON('mtc-bookings', bookings); }, [bookings, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-conversations', conversations); }, [conversations, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-announcements', announcements); }, [announcements, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-notifications', notifications); }, [notifications, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-programs', programs); }, [programs, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-payments', payments); }, [payments, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-notification-prefs', notificationPreferences); }, [notificationPreferences, isLoaded]);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${CLUB_LOCATION.lat}&longitude=${CLUB_LOCATION.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America/Toronto`
        );
        const data = await res.json();
        if (data.current) {
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
      } catch {
        setWeather(prev => ({ ...prev, description: 'Weather unavailable' }));
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Auth — uses Supabase signIn from auth.ts
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const user = await signIn(email, password);
    if (!user) return false;
    setCurrentUser(user);
    saveJSON('mtc-current-user', user);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mtc-current-user');
    }
  }, []);

  // Actions
  const addBooking = useCallback((booking: Booking) => {
    setBookings(prev => [...prev, booking]);
    // Create notification for booker
    if (booking.type === 'court') {
      const notif: Notification = {
        id: generateId('n'),
        type: 'booking',
        title: 'Booking Confirmed',
        body: `${booking.courtName} booked for ${booking.date} at ${booking.time}.`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications(prev => [notif, ...prev]);

      // Notify each participant with a notification + message
      if (booking.participants && booking.participants.length > 0) {
        const participantNotifs: Notification[] = booking.participants.map((p, i) => ({
          id: generateId('n'),
          type: 'booking' as const,
          title: 'Added to Booking',
          body: `${booking.userName} added you to a booking: ${booking.courtName} on ${booking.date} at ${booking.time}.`,
          timestamp: new Date().toISOString(),
          read: false,
        }));
        setNotifications(prev => [...participantNotifs, ...prev]);

        // Send message to each participant with calendar marker
        booking.participants.forEach((participant, i) => {
          const msg = {
            id: generateId('msg'),
            from: booking.userName,
            fromId: booking.userId,
            to: participant.name,
            toId: participant.id,
            text: `You've been added to a court booking!\n${booking.courtName} — ${new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${booking.time}.\n[booking:${booking.courtName}:${booking.date}:${booking.time}]`,
            timestamp: new Date().toISOString(),
            read: false,
          };
          setConversations(prev => {
            const existing = prev.find(c => c.memberId === booking.userId);
            if (existing) {
              return prev.map(c => c.memberId === booking.userId ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastTimestamp: msg.timestamp, unread: c.unread + 1 } : c);
            }
            return [...prev, { memberId: booking.userId, memberName: booking.userName, lastMessage: msg.text, lastTimestamp: msg.timestamp, unread: 1, messages: [msg] }];
          });
        });
      }
    }
  }, []);

  const cancelBooking = useCallback((id: string) => {
    const booking = bookings.find(b => b.id === id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));

    // Notify participants when a booking is cancelled
    if (booking && booking.participants && booking.participants.length > 0) {
      const cancelNotifs: Notification[] = booking.participants.map((p, i) => ({
        id: generateId('n'),
        type: 'booking' as const,
        title: 'Booking Cancelled',
        body: `${booking.userName} cancelled the booking: ${booking.courtName} on ${booking.date} at ${booking.time}.`,
        timestamp: new Date().toISOString(),
        read: false,
      }));
      setNotifications(prev => [...cancelNotifs, ...prev]);

      // Send cancellation message to each participant
      booking.participants.forEach((participant, i) => {
        const msg = {
          id: generateId('msg'),
          from: booking.userName,
          fromId: booking.userId,
          to: participant.name,
          toId: participant.id,
          text: `A court booking you were part of has been cancelled.\n${booking.courtName} — ${new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${booking.time}.`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setConversations(prev => {
          const existing = prev.find(c => c.memberId === booking.userId);
          if (existing) {
            return prev.map(c => c.memberId === booking.userId ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastTimestamp: msg.timestamp, unread: c.unread + 1 } : c);
          }
          return [...prev, { memberId: booking.userId, memberName: booking.userName, lastMessage: msg.text, lastTimestamp: msg.timestamp, unread: 1, messages: [msg] }];
        });
      });
    }
  }, [bookings]);

  // Program CRUD
  const addProgram = useCallback((program: CoachingProgram) => {
    setPrograms(prev => [...prev, program]);
    // Auto-generate blocked bookings for each session
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
  }, []);

  const cancelProgram = useCallback((programId: string) => {
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, status: 'cancelled' as const } : p));
    setBookings(prev => prev.map(b => b.programId === programId ? { ...b, status: 'cancelled' as const } : b));
  }, []);

  const enrollInProgram = useCallback((programId: string, memberId: string, memberName: string) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;
    // Add member to enrolled list
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, enrolledMembers: [...p.enrolledMembers, memberId] } : p));
    // Charge fee
    setPayments(prev => {
      const existing = prev.find(p => p.memberId === memberId);
      const entry = { id: generateId('pay'), date: new Date().toISOString().split('T')[0], description: `Program: ${program.title}`, amount: program.fee, type: 'charge' as const };
      if (existing) {
        return prev.map(p => p.memberId === memberId ? { ...p, balance: p.balance + program.fee, history: [...p.history, entry] } : p);
      }
      return [...prev, { memberId, memberName, balance: program.fee, history: [entry] }];
    });
    // Create notification
    const notif: Notification = {
      id: generateId('n'),
      type: 'event',
      title: `Enrolled in ${program.title}`,
      body: `${program.sessions.length} sessions starting ${program.sessions[0]?.date}. Fee: $${program.fee}.`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
    // Send message from coach
    const coachMsg = {
      id: generateId('msg'),
      from: program.coachName,
      fromId: program.coachId,
      to: memberName,
      toId: memberId,
      text: `Welcome to ${program.title}! Your enrollment is confirmed. ${program.sessions.length} sessions starting ${new Date(program.sessions[0]?.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. See you on the court!`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setConversations(prev => {
      const existing = prev.find(c => c.memberId === program.coachId);
      if (existing) {
        return prev.map(c => c.memberId === program.coachId ? { ...c, messages: [...c.messages, coachMsg], lastMessage: coachMsg.text, lastTimestamp: coachMsg.timestamp, unread: c.unread + 1 } : c);
      }
      return [...prev, { memberId: program.coachId, memberName: program.coachName, lastMessage: coachMsg.text, lastTimestamp: coachMsg.timestamp, unread: 1, messages: [coachMsg] }];
    });
  }, [programs]);

  const withdrawFromProgram = useCallback((programId: string, memberId: string) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, enrolledMembers: p.enrolledMembers.filter(m => m !== memberId) } : p));
    // Credit refund
    setPayments(prev => {
      const existing = prev.find(p => p.memberId === memberId);
      if (existing) {
        const entry = { id: generateId('pay'), date: new Date().toISOString().split('T')[0], description: `Refund: ${program.title}`, amount: -program.fee, type: 'payment' as const };
        return prev.map(p => p.memberId === memberId ? { ...p, balance: p.balance - program.fee, history: [...p.history, entry] } : p);
      }
      return prev;
    });
  }, [programs]);

  const toggleRsvp = useCallback((eventId: string, userName: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      const attending = e.attendees.includes(userName);
      return {
        ...e,
        attendees: attending ? e.attendees.filter(a => a !== userName) : [...e.attendees, userName],
        ...(e.spotsTaken != null ? { spotsTaken: attending ? e.spotsTaken - 1 : e.spotsTaken + 1 } : {}),
      };
    }));
  }, []);

  const sendMessage = useCallback((toId: string, text: string) => {
    if (!currentUser) return;
    const msg = {
      id: generateId('msg'),
      from: currentUser.name,
      fromId: currentUser.id,
      to: members.find(m => m.id === toId)?.name || '',
      toId,
      text,
      timestamp: new Date().toISOString(),
      read: true,
    };
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
  }, [currentUser, members]);

  const markConversationRead = useCallback((memberId: string) => {
    setConversations(prev => prev.map(c => c.memberId === memberId ? { ...c, unread: 0 } : c));
  }, []);

  const dismissAnnouncement = useCallback((id: string) => {
    if (!currentUser) return;
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, dismissedBy: [...a.dismissedBy, currentUser.email] } : a));
  }, [currentUser]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId('toast');
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 200);
    }, 2500);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, members, courts, setCourts, bookings, setBookings, addBooking, cancelBooking,
      events, setEvents, toggleRsvp, partners, setPartners, conversations, setConversations, sendMessage, markConversationRead,
      announcements, setAnnouncements, dismissAnnouncement, notifications, setNotifications, markNotificationRead,
      clearNotifications, weather, payments, setPayments, analytics,
      programs, setPrograms, addProgram, cancelProgram, enrollInProgram, withdrawFromProgram,
      notificationPreferences, setNotificationPreferences,
      sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, isLoaded,
      toasts, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}
