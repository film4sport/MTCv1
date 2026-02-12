'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Court, Booking, ClubEvent, Partner, Conversation, Announcement, Notification, WeatherData, MemberPayment, AdminAnalytics } from './types';
import { CLUB_LOCATION } from './types';
import { DEFAULT_MEMBERS, DEFAULT_COURTS, DEFAULT_BOOKINGS, DEFAULT_EVENTS, DEFAULT_PARTNERS, DEFAULT_CONVERSATIONS, DEFAULT_ANNOUNCEMENTS, DEFAULT_NOTIFICATIONS, DEFAULT_PAYMENTS, DEFAULT_ANALYTICS } from './data';

interface AppState {
  // Auth
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
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
  announcements: Announcement[];
  setAnnouncements: (announcements: Announcement[]) => void;
  dismissAnnouncement: (id: string) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  weather: WeatherData;
  payments: MemberPayment[];
  analytics: AdminAnalytics;

  // UI
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  isLoaded: boolean;
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
  const [payments] = useState<MemberPayment[]>(DEFAULT_PAYMENTS);
  const [analytics] = useState<AdminAnalytics>(DEFAULT_ANALYTICS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = loadJSON<User | null>('mtc-current-user', null);
    if (savedUser) setCurrentUser(savedUser);
    setBookings(loadJSON('mtc-bookings', DEFAULT_BOOKINGS));
    setConversations(loadJSON('mtc-conversations', DEFAULT_CONVERSATIONS));
    setAnnouncements(loadJSON('mtc-announcements', DEFAULT_ANNOUNCEMENTS));
    setNotifications(loadJSON('mtc-notifications', DEFAULT_NOTIFICATIONS));
    setIsLoaded(true);
  }, []);

  // Persist to localStorage on changes
  useEffect(() => { if (isLoaded) saveJSON('mtc-bookings', bookings); }, [bookings, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-conversations', conversations); }, [conversations, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-announcements', announcements); }, [announcements, isLoaded]);
  useEffect(() => { if (isLoaded) saveJSON('mtc-notifications', notifications); }, [notifications, isLoaded]);

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

  // Auth
  const login = useCallback((email: string, password: string): boolean => {
    const creds: Record<string, { password: string; role: User['role']; name: string }> = {
      'member@mtc.ca': { password: 'member123', role: 'member', name: 'Alex Thompson' },
      'coach@mtc.ca': { password: 'coach123', role: 'coach', name: 'Mark Taylor' },
      'admin@mtc.ca': { password: 'admin123', role: 'admin', name: 'Admin' },
    };
    const entry = creds[email];
    if (entry && entry.password === password) {
      const user: User = { id: email.split('@')[0], name: entry.name, email, role: entry.role, memberSince: '2025-01' };
      setCurrentUser(user);
      saveJSON('mtc-current-user', user);
      return true;
    }
    // Allow any email/password as member (demo mode)
    const user: User = { id: 'member', name: email.split('@')[0], email, role: 'member', memberSince: '2025-01' };
    setCurrentUser(user);
    saveJSON('mtc-current-user', user);
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mtc-current-user');
    }
  }, []);

  // Actions
  const addBooking = useCallback((booking: Booking) => {
    setBookings(prev => [...prev, booking]);
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
  }, []);

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
      id: `msg-${Date.now()}`,
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
          ...c, messages: [...c.messages, msg], lastMessage: text, lastTimestamp: msg.timestamp,
        } : c);
      }
      const member = members.find(m => m.id === toId);
      return [...prev, {
        memberId: toId, memberName: member?.name || '', lastMessage: text, lastTimestamp: msg.timestamp, unread: 0, messages: [msg],
      }];
    });
  }, [currentUser, members]);

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

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, members, courts, setCourts, bookings, setBookings, addBooking, cancelBooking,
      events, setEvents, toggleRsvp, partners, setPartners, conversations, setConversations, sendMessage,
      announcements, setAnnouncements, dismissAnnouncement, notifications, setNotifications, markNotificationRead,
      clearNotifications, weather, payments, analytics, sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, isLoaded,
    }}>
      {children}
    </AppContext.Provider>
  );
}
