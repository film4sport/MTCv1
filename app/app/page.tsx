'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Calendar, Clock, MapPin, Users, Trophy, Bell, Settings, 
  ChevronRight, Check, X, Home, LogOut, Plus, DollarSign,
  Lightbulb, Filter, Search, Menu, User, CreditCard, Target,
  MessageCircle, Mail, Send, ShoppingBag, CalendarDays, BarChart3
} from 'lucide-react'

// Tennis Confetti Component
const TennisConfetti = ({ active, onComplete }: { active: boolean, onComplete: () => void }) => {
  const [particles, setParticles] = useState<Array<{
    id: number
    emoji: string
    x: number
    delay: number
    duration: number
    rotate: number
  }>>([])

  useEffect(() => {
    if (active) {
      const emojis = ['🎾', '🎾', '🎾', '🏸', '⭐', '⭐', '✨', '🌟']
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        rotate: Math.random() * 720 - 360
      }))
      setParticles(newParticles)
      
      const timer = setTimeout(() => {
        setParticles([])
        onComplete()
      }, 4000)
      
      return () => clearTimeout(timer)
    }
  }, [active, onComplete])

  if (!active || particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute text-2xl animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--rotate': `${p.rotate}deg`
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  )
}

// This is a complete working prototype!
// In production, you'll connect this to Supabase for real data

export default function MonoTennisApp() {
  // Initialize with defaults - load from localStorage after mount to avoid hydration errors
  const [currentScreen, setCurrentScreen] = useState('login')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedCourt, setSelectedCourt] = useState<any>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [clubEtransferEmail, setClubEtransferEmail] = useState('payments@monotennis.com')
  const [savedPhone, setSavedPhone] = useState('+1 (555) 123-4567')
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Tennis confetti celebration
  const [showConfetti, setShowConfetti] = useState(false)
  const [reschedulingBooking, setReschedulingBooking] = useState<any>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [baseNotificationsCleared, setBaseNotificationsCleared] = useState(false)
  const [joinedPartner, setJoinedPartner] = useState<any>(null)
  const [partnerNotifications, setPartnerNotifications] = useState<any[]>([])
  const [sentRequest, setSentRequest] = useState<any>(null)
  const [postedRequest, setPostedRequest] = useState<any>(null)
  const [showUserSwitcher, setShowUserSwitcher] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null)
  
  // ===== NEW FEATURES =====
  // Club Location (admin configurable) - Default: Toronto area
  const [clubLocation, setClubLocation] = useState({
    lat: 43.65,
    lng: -79.38,
    name: 'Toronto, ON'
  })
  
  // Member's personal location (overrides club location for their weather)
  const [memberLocation, setMemberLocation] = useState<{lat: number, lng: number, name: string} | null>(null)
  
  // Use member location if set, otherwise club location
  const activeLocation = memberLocation || clubLocation
  
  // Weather - fetched from Open-Meteo API (free, no key needed)
  const [weather, setWeather] = useState({
    temp: 72,
    tempC: 22,
    condition: 'sunny', // sunny, cloudy, rainy, windy, snowy
    wind: 5,
    humidity: 45,
    description: 'Loading weather...',
    lastUpdated: null as string | null
  })
  const [weatherLoading, setWeatherLoading] = useState(true)
  
  // Fetch weather on mount and when location changes
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${activeLocation.lat}&longitude=${activeLocation.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America/Toronto`
        )
        const data = await response.json()
        
        if (data.current) {
          const tempC = Math.round(data.current.temperature_2m)
          const tempF = Math.round(tempC * 9/5 + 32)
          const windKmh = Math.round(data.current.wind_speed_10m)
          const weatherCode = data.current.weather_code
          
          // Convert weather code to condition
          let condition = 'sunny'
          let description = 'Clear skies'
          
          if (weatherCode === 0) { condition = 'sunny'; description = 'Clear sky' }
          else if (weatherCode <= 3) { condition = 'cloudy'; description = 'Partly cloudy' }
          else if (weatherCode <= 49) { condition = 'cloudy'; description = 'Foggy' }
          else if (weatherCode <= 59) { condition = 'rainy'; description = 'Drizzle' }
          else if (weatherCode <= 69) { condition = 'rainy'; description = 'Rain' }
          else if (weatherCode <= 79) { condition = 'snowy'; description = 'Snow' }
          else if (weatherCode <= 84) { condition = 'rainy'; description = 'Rain showers' }
          else if (weatherCode <= 94) { condition = 'snowy'; description = 'Snow showers' }
          else if (weatherCode >= 95) { condition = 'rainy'; description = 'Thunderstorm' }
          
          // Tennis-specific description
          if (condition === 'sunny' && tempC >= 15 && tempC <= 28 && windKmh < 20) {
            description = 'Perfect tennis weather!'
          } else if (condition === 'rainy' || condition === 'snowy') {
            description = 'Consider indoor courts'
          } else if (windKmh >= 30) {
            description = 'Very windy - lobs may be affected'
          } else if (tempC < 5) {
            description = 'Bundle up!'
          } else if (tempC > 30) {
            description = 'Stay hydrated!'
          }
          
          setWeather({
            temp: tempF,
            tempC: tempC,
            condition,
            wind: windKmh,
            humidity: data.current.relative_humidity_2m,
            description,
            lastUpdated: new Date().toLocaleTimeString()
          })
        }
      } catch (error) {
        console.error('Weather fetch error:', error)
        setWeather(prev => ({...prev, description: 'Weather unavailable'}))
      } finally {
        setWeatherLoading(false)
      }
    }
    
    fetchWeather()
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [activeLocation.lat, activeLocation.lng])
  
  // Club Announcements (admin only can create)
  const [announcements, setAnnouncements] = useState<Array<{id: number, text: string, type: string, date: string, dismissedBy: string[]}>>([
    { id: 1, text: 'Courts 3-4 resurfacing completed! Now open for booking.', type: 'info', date: '2025-01-15', dismissedBy: [] },
  ])
  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(true)
  
  // Admin welcome message for chat (shown to all members)
  const [adminWelcomeMessage, setAdminWelcomeMessage] = useState('Welcome to Mono Tennis Club! Let us know if you have any questions.')
  
  // Guest Booking
  const [isGuestBooking, setIsGuestBooking] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestFee] = useState(5)
  
  // Recurring Bookings
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringWeeks, setRecurringWeeks] = useState(4)
  
  // Player Stats
  const [playerStats, setPlayerStats] = useState({
    matchesPlayed: 24,
    wins: 16,
    losses: 8,
    currentStreak: 3,
    streakType: 'win', // 'win' or 'loss'
    skillRating: 3.5, // NTRP rating
    hoursPlayed: 36
  })
  
  // Waitlist
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [waitlistSlot, setWaitlistSlot] = useState<any>(null)
  
  // Live Court Status - base data (will be modified by maintenanceCourts)
  const [baseLiveCourtStatus] = useState<any[]>([
    { courtId: 1, status: 'in-use', endsAt: '3:00 PM', currentUser: 'Mike C.' },
    { courtId: 2, status: 'available', endsAt: null, currentUser: null },
    { courtId: 3, status: 'reserved', startsIn: 30, reservedBy: 'Sarah K.' },
    { courtId: 4, status: 'available', endsAt: null, currentUser: null },
  ])
  
  // Ball Machine
  const [ballMachineBookings, setBallMachineBookings] = useState<any[]>([])
  const [showBallMachineModal, setShowBallMachineModal] = useState(false)
  
  // Pro Shop / Equipment
  const [proShopItems, setProShopItems] = useState<any[]>([
    { id: 1, name: 'Tennis Balls (Can of 3)', price: 8, stock: 24, category: 'balls' },
    { id: 2, name: 'Overgrip Pack (3)', price: 12, stock: 15, category: 'accessories' },
    { id: 3, name: 'Demo Racket - Wilson', price: 0, stock: 3, category: 'demo', perDay: true },
    { id: 4, name: 'Demo Racket - Babolat', price: 0, stock: 2, category: 'demo', perDay: true },
    { id: 5, name: 'Vibration Dampener', price: 5, stock: 20, category: 'accessories' },
  ])
  const [cart, setCart] = useState<any[]>([])
  const [showProShopModal, setShowProShopModal] = useState(false)
  const [proShopOrders, setProShopOrders] = useState<any[]>([
    // Sample order
    { id: 1, user: 'Mike Chen', items: [{name: 'Tennis Balls (Can of 3)', qty: 2, price: 8}], total: 16, timestamp: '2025-01-16T14:30:00', status: 'pending' }
  ])
  // Pro Shop Admin
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showEditItemModal, setShowEditItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [newItem, setNewItem] = useState({ name: '', price: 0, stock: 0, category: 'accessories' })
  
  // Carpool for Away Matches
  const [carpools, setCarpools] = useState<any[]>([
    { id: 1, eventId: 3, driver: 'Mike Chen', seats: 3, taken: 1, passengers: ['Sarah K.'], departureTime: '1:00 PM', location: 'Club Parking Lot' },
  ])
  
  // Anonymous Ratings (delayed, aggregated)
  const [memberRatings, setMemberRatings] = useState<any>({
    // Stored anonymously - only aggregates shown
  })
  // Anonymous ratings - shown 1 week after match (optional for users)
  const [pendingRatings, setPendingRatings] = useState<any[]>([])
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [currentRating, setCurrentRating] = useState<any>(null)
  
  // Add to Home Screen
  const [showAddToHomeScreen, setShowAddToHomeScreen] = useState(true)
  const [addToHomeSwipeX, setAddToHomeSwipeX] = useState(0)
  const [addToHomeStartX, setAddToHomeStartX] = useState<number | null>(null)
  
  // Announcement swipe tracking (by announcement id)
  const [announcementSwipeX, setAnnouncementSwipeX] = useState<{[key: number]: number}>({})
  const [announcementStartX, setAnnouncementStartX] = useState<number | null>(null)
  const [swipingAnnouncementId, setSwipingAnnouncementId] = useState<number | null>(null)
  
  // Maintenance Mode (per court)
  const [maintenanceCourts, setMaintenanceCourts] = useState<number[]>([])
  
  // Computed live court status - applies maintenance mode from admin panel
  const liveCourtStatus = useMemo(() => {
    return baseLiveCourtStatus.map(court => {
      if (maintenanceCourts.includes(court.courtId)) {
        return { ...court, status: 'maintenance', reason: 'Under maintenance' }
      }
      return court
    })
  }, [baseLiveCourtStatus, maintenanceCourts])
  
  // Admin Analytics
  const [analyticsData] = useState({
    totalBookingsThisMonth: 156,
    bookingsChange: 12, // percentage
    revenueThisMonth: 780,
    revenueChange: 8,
    mostActiveMembers: [
      { name: 'Mike Chen', bookings: 12 },
      { name: 'Sarah Mitchell', bookings: 10 },
      { name: 'David Park', bookings: 8 },
    ],
    peakTimes: [
      { day: 'Saturday', time: '10:00 AM', bookings: 24 },
      { day: 'Sunday', time: '9:00 AM', bookings: 22 },
      { day: 'Wednesday', time: '6:00 PM', bookings: 18 },
    ],
    courtUtilization: [
      { court: 'Court 1', utilization: 78 },
      { court: 'Court 2', utilization: 82 },
      { court: 'Court 3', utilization: 45 },
      { court: 'Court 4', utilization: 61 },
    ]
  })
  
  // Browser Dark Mode Detection
  const [browserDarkModeDetected, setBrowserDarkModeDetected] = useState(false)
  const [darkModeWarningDismissed, setDarkModeWarningDismissed] = useState(false)
  
  // User Dark Mode Preference
  const [darkMode, setDarkMode] = useState(false)
  // ===== END NEW FEATURES =====
  
  // ===== PERSISTENT UI STATES (moved from local components to prevent reset) =====
  // Admin Panel
  const [adminTab, setAdminTab] = useState('dashboard')
  
  // Club Schedule
  const [scheduleViewMode, setScheduleViewMode] = useState('list') // 'list' or 'calendar'
  const [userRsvpStatus, setUserRsvpStatus] = useState<string | null>(null)
  const [foodInstructions, setFoodInstructions] = useState('• Appetizers or snacks\n• Beverages (non-alcoholic)\n• Desserts welcome!')
  const [teamMembers, setTeamMembers] = useState<any[]>([
    { name: 'John Smith', status: 'coming' },
    { name: 'Sarah K.', status: 'coming' },
    { name: 'Mike R.', status: 'not-coming' },
    { name: 'Lisa T.', status: 'coming' },
    { name: 'David W.', status: 'coming' },
    { name: 'Emma B.', status: 'coming' },
  ])
  
  // My Bookings
  const [bookingTab, setBookingTab] = useState('upcoming')
  
  // Partners / Find Partner
  const [partnerFilter, setPartnerFilter] = useState('All')
  
  // Settings - Privacy
  const [profileVisibility, setProfileVisibility] = useState('Public')
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  
  // Tournaments
  const [tournaments, setTournaments] = useState<any[]>([
    { 
      id: 1, 
      name: 'Spring Singles Championship', 
      type: 'Singles',
      dates: 'March 15-17, 2026',
      startDate: '2026-03-15',
      entryFee: 45,
      maxParticipants: 32,
      status: 'open', // 'open', 'closed', 'in-progress', 'completed'
      participants: [
        { id: 1, name: 'Alex Johnson', seed: 1, paid: true },
        { id: 2, name: 'Mike Chen', seed: 2, paid: true },
        { id: 3, name: 'Sarah Mitchell', seed: 3, paid: true },
        { id: 4, name: 'David Park', seed: 4, paid: true },
        { id: 5, name: 'Emma Wilson', seed: 5, paid: true },
        { id: 6, name: 'James Wilson', seed: 6, paid: true },
        { id: 7, name: 'Lisa Thompson', seed: 7, paid: false },
        { id: 8, name: 'Jennifer Lee', seed: 8, paid: true },
        { id: 9, name: 'Tom Brady', seed: null, paid: true },
        { id: 10, name: 'Chris Evans', seed: null, paid: true },
        { id: 11, name: 'Ryan Reynolds', seed: null, paid: true },
        { id: 12, name: 'Blake Lively', seed: null, paid: true },
        { id: 13, name: 'Emma Stone', seed: null, paid: false },
        { id: 14, name: 'Andrew Garfield', seed: null, paid: true },
        { id: 15, name: 'Zendaya Coleman', seed: null, paid: true },
        { id: 16, name: 'Tom Holland', seed: null, paid: true },
        { id: 17, name: 'Chris Hemsworth', seed: null, paid: true },
        { id: 18, name: 'Scarlett Johansson', seed: null, paid: true },
        { id: 19, name: 'Robert Downey', seed: null, paid: true },
        { id: 20, name: 'Chris Pratt', seed: null, paid: true },
        { id: 21, name: 'Dave Bautista', seed: null, paid: false },
        { id: 22, name: 'Karen Gillan', seed: null, paid: true },
        { id: 23, name: 'Pom Klementieff', seed: null, paid: true },
        { id: 24, name: 'Bradley Cooper', seed: null, paid: true },
      ],
      draw: null,
      winner: null
    },
    {
      id: 2,
      name: 'Winter Doubles Cup',
      type: 'Doubles',
      dates: 'Dec 10-12, 2025',
      startDate: '2025-12-10',
      entryFee: 60,
      maxParticipants: 16,
      status: 'completed',
      participants: [],
      draw: null,
      winner: 'Mike Chen & Sarah K.'
    }
  ])
  // ===== END PERSISTENT UI STATES =====
  
  // In-app messaging system
  const [messages, setMessages] = useState<any[]>([
    { id: 1, from: 'Sarah Mitchell', fromEmail: 'sarah.m@email.com', to: 'alex@monotennis.com', text: 'Hey! Want to play doubles this weekend?', timestamp: '2025-01-16T10:30:00', read: false },
    { id: 2, from: 'Admin', fromEmail: 'admin@monotennis.com', to: 'alex@monotennis.com', text: 'Welcome to Mono Tennis Club! Let us know if you have any questions.', timestamp: '2025-01-15T09:00:00', read: true },
  ])
  const [openConversation, setOpenConversation] = useState<string | null>(null)
  
  // Sync admin welcome message with chat - runs once on mount to apply saved message
  useEffect(() => {
    if (adminWelcomeMessage) {
      setMessages(prev => prev.map(m => 
        m.fromEmail === 'admin@monotennis.com' && m.from === 'Admin'
          ? {...m, text: adminWelcomeMessage}
          : m
      ))
    }
  }, []) // Only run on mount
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    eventNotifications: true,
    paymentNotifications: true,
    partnerNotifications: true,
    messageNotifications: true,
    adminAnnouncements: true
  })
  
  // Get unread message count for current user
  const unreadMessageCount = messages.filter(m => 
    m.to === currentUser?.email && !m.read
  ).length
  
  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Mock data - Replace with Supabase queries
  const [courts, setCourts] = useState<any[]>([
    { id: 1, name: 'Court 1', type: 'Hard Court', hasLights: true, available: true, rate: 5, isNew: false },
    { id: 2, name: 'Court 2', type: 'Hard Court', hasLights: true, available: true, rate: 5, isNew: false },
    { id: 3, name: 'Court 3', type: 'Hard Court', hasLights: false, available: false, rate: 5, isNew: true },
    { id: 4, name: 'Court 4', type: 'Hard Court', hasLights: false, available: true, rate: 5, isNew: true },
  ])
  
  // Club members (moved to parent level for persistence)
  const [clubMembers, setClubMembers] = useState<any[]>([
    { id: 1, name: 'Alex Johnson', email: 'alex@monotennis.com', status: 'Active', bookings: 12, joined: 'Jan 2024' },
    { id: 2, name: 'Sarah Mitchell', email: 'sarah.m@email.com', status: 'Active', bookings: 8, joined: 'Mar 2024' },
    { id: 3, name: 'Mike Chen', email: 'mike.chen@email.com', status: 'Active', bookings: 15, joined: 'Dec 2023' },
    { id: 4, name: 'Emma Wilson', email: 'emma.w@email.com', status: 'Inactive', bookings: 3, joined: 'Jun 2024' },
    { id: 5, name: 'David Park', email: 'david.p@email.com', status: 'Active', bookings: 21, joined: 'Sep 2023' },
    { id: 6, name: 'Lisa Thompson', email: 'lisa.t@email.com', status: 'Active', bookings: 7, joined: 'Nov 2024' },
    { id: 7, name: 'James Wilson', email: 'james.w@email.com', status: 'Active', bookings: 14, joined: 'Oct 2023' },
    { id: 8, name: 'Jennifer Lee', email: 'jen.lee@email.com', status: 'Inactive', bookings: 2, joined: 'Aug 2024' },
  ])

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
    '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ]

  const [myBookings, setMyBookings] = useState<any[]>([
    { id: 1, court: 'Court 2', date: 'Today', time: '4:00 PM - 5:00 PM', status: 'Confirmed', matchType: 'singles', paid: false, type: 'court' },
    { id: 2, court: 'Court 1', date: 'Tomorrow', time: '10:00 AM - 11:00 AM', status: 'Confirmed', matchType: 'doubles', paid: false, type: 'court' },
  ])

  const [partnerRequests, setPartnerRequests] = useState<any[]>([
    { id: 1, name: 'Sarah K.', skill: 'Intermediate', date: 'Tomorrow', time: '10am', avatar: 'SK' },
    { id: 2, name: 'Mike R.', skill: 'Advanced', date: 'Saturday', time: '2pm', avatar: 'MR' },
    { id: 3, name: 'Alex T.', skill: 'Beginner', date: 'Sunday', time: '9am', avatar: 'AT' },
  ])

  const [clubEvents, setClubEvents] = useState<any[]>([
    { id: 3, type: 'match', title: 'Inter Club A Match', opponent: 'vs Belfountain TC', date: 'Sat, Jan 18', time: '2:00 PM', icon: '⚔️' },
    { id: 4, type: 'match', title: 'Inter Club B Match', opponent: 'vs Caledon TC', date: 'Sun, Jan 19', time: '10:00 AM', icon: '⚔️' },
    { id: 5, type: 'match', title: 'Inter County Women\'s A', opponent: 'vs Orangeville TC', date: 'Sat, Jan 25', time: '1:00 PM', icon: '⚔️' },
    { id: 6, type: 'social', title: 'Wimbledon Social', date: 'Sat, Jan 18', time: '6:00 PM', details: 'Dress code: All white', icon: '🎉🇬🇧' },
    { id: 7, type: 'social', title: 'Freedom 55', date: 'Thu, Jan 23', time: '10:00 AM', icon: '🎉', details: 'Club social for 55+' },
    { id: 8, type: 'match', title: 'Mixed Doubles Match', opponent: 'vs Palgrave TC', date: 'Fri, Jan 24', time: '7:00 PM', icon: '⚔️' },
    { id: 9, type: 'social', title: 'French Open Social', date: 'Sat, Feb 1', time: '5:00 PM', details: 'Clay court theme', icon: '🎉🇫🇷' },
    { id: 10, type: 'social', title: 'US Open Social', date: 'Sat, Feb 8', time: '5:00 PM', details: 'Hard court theme', icon: '🎉🇺🇸' },
  ])

  // Load from localStorage on client-side mount (avoids hydration errors)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser')
      const savedScreen = localStorage.getItem('currentScreen')
      const savedEmail = localStorage.getItem('clubEtransferEmail')
      const savedBookings = localStorage.getItem('myBookings')
      const savedEvents = localStorage.getItem('clubEvents')
      const savedNotifications = localStorage.getItem('partnerNotifications')
      const savedAddToHome = localStorage.getItem('showAddToHomeScreen')
      const savedAnnouncements = localStorage.getItem('announcements')
      const rememberMe = localStorage.getItem('rememberMe')
      const savedDarkMode = localStorage.getItem('darkMode')
      const savedWelcomeMessage = localStorage.getItem('adminWelcomeMessage')
      const savedMemberLocation = localStorage.getItem('memberLocation')
      
      // Only auto-login if "Remember Me" was checked
      if (savedUser && rememberMe === 'true') {
        setCurrentUser(JSON.parse(savedUser))
        if (savedScreen) setCurrentScreen(savedScreen)
      }
      if (savedEmail) setClubEtransferEmail(savedEmail)
      if (savedBookings) setMyBookings(JSON.parse(savedBookings))
      // Note: Not loading savedEvents to ensure social icons are always correct
      if (savedNotifications) setPartnerNotifications(JSON.parse(savedNotifications))
      if (savedAddToHome !== null) setShowAddToHomeScreen(savedAddToHome === 'true')
      if (savedAnnouncements) setAnnouncements(JSON.parse(savedAnnouncements))
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true')
      if (savedWelcomeMessage) setAdminWelcomeMessage(savedWelcomeMessage)
      if (savedMemberLocation) setMemberLocation(JSON.parse(savedMemberLocation))
      
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rememberMe = localStorage.getItem('rememberMe')
      if (currentUser && rememberMe === 'true') {
        localStorage.setItem('currentUser', JSON.stringify(currentUser))
        localStorage.setItem('currentScreen', currentScreen)
      } else if (!currentUser) {
        localStorage.removeItem('currentUser')
        localStorage.setItem('currentScreen', 'login')
      }
    }
  }, [currentUser, currentScreen])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('myBookings', JSON.stringify(myBookings))
    }
  }, [myBookings])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clubEtransferEmail', clubEtransferEmail)
    }
  }, [clubEtransferEmail])

  // Clear old clubEvents localStorage to ensure correct social icons (one-time migration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clubEvents')
    }
  }, []) // Empty dependency - runs once on mount

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('partnerNotifications', JSON.stringify(partnerNotifications))
    }
  }, [partnerNotifications])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showAddToHomeScreen', String(showAddToHomeScreen))
    }
  }, [showAddToHomeScreen])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('announcements', JSON.stringify(announcements))
    }
  }, [announcements])

  // Save dark mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(darkMode))
    }
  }, [darkMode])

  // Save admin welcome message
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminWelcomeMessage', adminWelcomeMessage)
    }
  }, [adminWelcomeMessage])

  // Save member location preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (memberLocation) {
        localStorage.setItem('memberLocation', JSON.stringify(memberLocation))
      } else {
        localStorage.removeItem('memberLocation')
      }
    }
  }, [memberLocation])

  // Detect browser dark mode and warn user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if browser prefers dark mode
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      // Check if user has dismissed the warning before
      const dismissed = localStorage.getItem('darkModeWarningDismissed')
      if (dismissed === 'true') {
        setDarkModeWarningDismissed(true)
      }
      
      // Set initial state
      if (darkModeMediaQuery.matches) {
        setBrowserDarkModeDetected(true)
      }
      
      // Listen for changes
      const handleChange = (e: MediaQueryListEvent) => {
        setBrowserDarkModeDetected(e.matches)
      }
      
      darkModeMediaQuery.addEventListener('change', handleChange)
      return () => darkModeMediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // Auth handlers
  const handleLogin = (email: string, password: string) => {
    // Check for admin credentials
    if (email === 'admin@monotennis.com' && password === 'admin123') {
      setCurrentUser({ name: 'Admin User', email, isAdmin: true, isCoach: false })
      setCurrentScreen('home')
    }
    // Check for coach credentials
    else if (email === 'coach@monotennis.com' && password === 'coach123') {
      setCurrentUser({ name: 'John Smith', email, isAdmin: false, isCoach: true })
      setCurrentScreen('home')
    }
    else if (email === 'coach2@monotennis.com' && password === 'coach123') {
      setCurrentUser({ name: 'Sarah Johnson', email, isAdmin: false, isCoach: true })
      setCurrentScreen('home')
    }
    else {
      // Regular member login
      setCurrentUser({ name: 'Alex Johnson', email, isAdmin: false, isCoach: false })
      setCurrentScreen('home')
    }
  }

  const handleSignup = (name: string, email: string, password: string) => {
    // In production: Use Supabase auth
    setCurrentUser({ name, email, isAdmin: false })
    setCurrentScreen('home')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentScreen('login')
    // Clear remember me so user sees login screen next time
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rememberMe')
      localStorage.removeItem('currentUser')
    }
  }

  const handleBooking = () => {
    if (reschedulingBooking) {
      // Update existing booking
      const updatedBookings = myBookings.map(b =>
        b.id === reschedulingBooking.id 
          ? { ...b, time: selectedTime || '', court: selectedCourt?.name || '' }
          : b
      )
      setMyBookings(updatedBookings)
      setReschedulingBooking(null)
    } else {
      // Create new booking
      const newBooking = {
        id: Date.now(),
        court: selectedCourt?.name || '',
        date: 'Wed, Jan 15',
        time: selectedTime || '',
        status: 'Confirmed',
        matchType: 'singles',
        paid: true,
        type: 'court'
      }
      setMyBookings([...myBookings, newBooking])
    }
    
    setShowConfirmation(true)
    setTimeout(() => {
      setShowConfirmation(false)
      setCurrentScreen('home')
      setSelectedCourt(null)
      setSelectedTime(null)
    }, 2500)
  }

  // Login Screen
  const LoginScreen = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)

    const handleLoginWithRemember = () => {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }
      handleLogin(email, password)
    }

    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Vibrant Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-mono-green-600 via-mono-green-500 to-emerald-400" />
        
        {/* Animated gradient mesh overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        </div>
        
        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-block bg-white/20 backdrop-blur-lg border-2 border-white/40 p-8 rounded-[2rem] shadow-2xl mb-4">
              <img src="/mono-logo.png" alt="Mono Tennis Club" className="h-24 w-auto drop-shadow-xl" />
            </div>
            
            <p className="text-white/90 text-lg font-medium drop-shadow">Your courts await</p>
            <p className="text-white/70 text-sm mt-2 drop-shadow">Members only - sign in to continue</p>
          </div>

          {/* Login Form - Glass Morphism */}
          <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all mb-4"
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all mb-4"
            />
            
            {/* Remember Me Checkbox */}
            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-white/30 bg-white/20 checked:bg-white checked:border-white accent-mono-green-600"
              />
              <span className="text-white/90 text-sm">Remember me</span>
            </label>
            
            <button
              onClick={handleLoginWithRemember}
              className="w-full bg-white text-mono-green-700 font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all mb-4"
            >
              Sign In
            </button>

            <div className="text-center">
              <button
                onClick={() => setCurrentScreen('signup')}
                className="text-white font-semibold hover:text-white/80 transition-colors"
              >
                Don't have an account? <span className="underline">Sign up</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Signup Screen
  const SignupScreen = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')

    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Vibrant Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-mono-green-600 via-mono-green-500 to-emerald-400" />
        
        {/* Animated gradient mesh overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <button
            onClick={() => setCurrentScreen('login')}
            className="mb-4 text-white font-semibold hover:text-white/80 flex items-center gap-2 drop-shadow-lg"
          >
            ← Back to login
          </button>

          <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Join Mono Tennis</h2>
            <p className="text-white/90 mb-6">Members only - create your account</p>
            
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all mb-4"
            />
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all mb-4"
            />

            <input
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all mb-4"
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all mb-6"
            />
            
            <button
              onClick={() => handleSignup(name, email, password)}
              className="w-full bg-white text-mono-green-700 font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Home Screen
  const HomeScreen = () => {
    const hour = new Date().getHours()
    const isEvening = hour >= 18 || hour < 4 // Match getTimeOfDay() logic
    const headerGradient = darkMode 
      ? 'bg-gradient-to-r from-orange-500 to-red-500'
      : (isEvening 
        ? 'bg-gradient-to-r from-purple-700/80 to-indigo-600/80'
        : 'bg-gradient-to-r from-yellow-500/80 to-orange-500/80')
    
    return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Background - conditional based on dark mode */}
      {darkMode ? (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      ) : (
        <>
          {/* Tennis Court Background - VERTICAL with doubles lines and service lines */}
          <div 
            className="absolute inset-0"
            style={{
              background: '#4a7c59', // Tennis court green
              backgroundImage: `
                linear-gradient(90deg, transparent 0%, transparent 15%, white 15%, white 15.5%, transparent 15.5%, transparent 84.5%, white 84.5%, white 85%, transparent 85%, transparent 100%),
                linear-gradient(to bottom, transparent 0%, transparent 30%, white 30%, white 30.3%, transparent 30.3%, transparent 69.7%, white 69.7%, white 70%, transparent 70%, transparent 100%),
                linear-gradient(to bottom, transparent 0%, transparent 49.5%, rgba(0,0,0,0.3) 49.5%, rgba(0,0,0,0.3) 50.5%, transparent 50.5%, transparent 100%)
              `,
              backgroundSize: '100% 100%',
              backgroundPosition: '0 0',
              backgroundRepeat: 'no-repeat'
            }}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-transparent to-purple-900/40" />
        </>
      )}

      <div className="relative z-10">
        {/* Header with Stats Connected */}
        <div className={`${headerGradient} ${darkMode ? '' : 'backdrop-blur-lg'} text-white p-6 ${darkMode ? '' : 'rounded-b-3xl'} shadow-2xl ${darkMode ? '' : 'border-b-2 border-white/20'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`${darkMode ? 'text-white/80' : 'text-purple-100'} text-sm mb-1 flex items-center gap-2`}>
                <span className="text-xl">👋</span> Good {getTimeOfDay()}!
              </p>
              <h1 className="text-2xl font-bold drop-shadow-lg">{currentUser?.name}</h1>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowNotifications(true)}
                className={`p-2 ${darkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-white/20 border-white/30'} backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors border relative`}
              >
                <Bell className="w-6 h-6" />
                {(partnerNotifications.length + unreadMessageCount + (baseNotificationsCleared ? 0 : 2)) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                    {partnerNotifications.length + unreadMessageCount + (baseNotificationsCleared ? 0 : 2)}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 ${darkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-white/20 border-white/30'} backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors border`}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Quick Stats - Connected to Header */}
          <div className={`${darkMode ? 'bg-slate-800/50 border-slate-700' : isEvening ? 'bg-gradient-to-br from-purple-500/90 to-indigo-500/90 border-purple-300/50' : 'bg-gradient-to-br from-yellow-400/90 to-amber-500/90 border-yellow-300/50'} backdrop-blur-md rounded-2xl p-4 border shadow-lg`}>
            <p className="text-sm text-white mb-3 font-semibold flex items-center gap-2">
              <span className="text-base">🏆</span> Your Stats
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white/20 border-white/30'} backdrop-blur-sm rounded-xl p-3 border`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">⏱️</span>
                  <p className="text-2xl font-bold drop-shadow text-white">{playerStats.hoursPlayed}</p>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-white/90'}`}>Hours Played</p>
              </div>
              <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white/20 border-white/30'} backdrop-blur-sm rounded-xl p-3 border`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">👥</span>
                  <p className="text-2xl font-bold drop-shadow text-white">{playerStats.matchesPlayed}</p>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-white/90'}`}>Matches</p>
              </div>
              <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white/20 border-white/30'} backdrop-blur-sm rounded-xl p-3 border`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🎯</span>
                  <p className="text-2xl font-bold drop-shadow text-white">{Math.round((playerStats.wins / playerStats.matchesPlayed) * 100)}%</p>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-white/90'}`}>Win Rate</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add to Home Screen Prompt - Swipeable */}
        {showAddToHomeScreen && (
          <div 
            className="mx-4 mt-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 shadow-lg relative overflow-hidden transition-transform duration-200 touch-pan-y"
            ref={(el) => {
              if (el) {
                let startX = 0
                let currentX = 0
                el.ontouchstart = (e) => {
                  startX = e.touches[0].clientX
                  currentX = 0
                  el.style.transition = 'none'
                }
                el.ontouchmove = (e) => {
                  currentX = e.touches[0].clientX - startX
                  el.style.transform = `translateX(${currentX}px)`
                  el.style.opacity = String(Math.max(0, 1 - Math.abs(currentX) / 150))
                }
                el.ontouchend = () => {
                  el.style.transition = 'transform 0.2s, opacity 0.2s'
                  if (Math.abs(currentX) > 80) {
                    el.style.transform = `translateX(${currentX > 0 ? 300 : -300}px)`
                    el.style.opacity = '0'
                    setTimeout(() => setShowAddToHomeScreen(false), 200)
                  } else {
                    el.style.transform = 'translateX(0)'
                    el.style.opacity = '1'
                  }
                }
              }
            }}
          >
            <button 
              onClick={() => setShowAddToHomeScreen(false)}
              className="absolute top-2 right-2 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <span className="text-2xl">📲</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Add to Home Screen</p>
                <p className="text-white/80 text-xs">Quick access like a real app!</p>
              </div>
              <button 
                onClick={() => {
                  showToast('Open browser menu → "Add to Home Screen"', 'info')
                  setShowAddToHomeScreen(false)
                }}
                className="bg-white text-blue-600 px-3 py-2 rounded-lg text-sm font-semibold"
              >
                How?
              </button>
            </div>
          </div>
        )}
        
        {/* Club Announcement Banner (admin created) - Swipeable */}
        {announcements.length > 0 && showAnnouncementBanner && (
          <div className="mx-4 mt-4">
            {announcements.filter(a => !a.dismissedBy?.includes(currentUser?.email || '')).slice(0, 1).map(announcement => (
              <div 
                key={announcement.id}
                className={`rounded-xl p-4 shadow-lg relative overflow-hidden transition-transform duration-200 touch-pan-y ${
                  announcement.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  announcement.type === 'urgent' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                  'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                ref={(el) => {
                  if (el) {
                    let startX = 0
                    let currentX = 0
                    el.ontouchstart = (e) => {
                      startX = e.touches[0].clientX
                      currentX = 0
                      el.style.transition = 'none'
                    }
                    el.ontouchmove = (e) => {
                      currentX = e.touches[0].clientX - startX
                      el.style.transform = `translateX(${currentX}px)`
                      el.style.opacity = String(Math.max(0, 1 - Math.abs(currentX) / 150))
                    }
                    el.ontouchend = () => {
                      el.style.transition = 'transform 0.2s, opacity 0.2s'
                      if (Math.abs(currentX) > 80) {
                        el.style.transform = `translateX(${currentX > 0 ? 300 : -300}px)`
                        el.style.opacity = '0'
                        setTimeout(() => {
                          setAnnouncements(prev => prev.map(a => 
                            a.id === announcement.id 
                              ? {...a, dismissedBy: [...(a.dismissedBy || []), currentUser?.email || '']}
                              : a
                          ))
                        }, 200)
                      } else {
                        el.style.transform = 'translateX(0)'
                        el.style.opacity = '1'
                      }
                    }
                  }
                }}
              >
                <button 
                  onClick={() => {
                    setAnnouncements(announcements.map(a => 
                      a.id === announcement.id 
                        ? {...a, dismissedBy: [...(a.dismissedBy || []), currentUser?.email || '']}
                        : a
                    ))
                  }}
                  className="absolute top-2 right-2 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-start gap-3 pr-6">
                  <span className="text-xl">
                    {announcement.type === 'warning' ? '⚠️' : announcement.type === 'urgent' ? '🚨' : '📢'}
                  </span>
                  <div>
                    <p className="text-white font-medium">{announcement.text}</p>
                    <p className="text-white/60 text-xs mt-1">Posted {announcement.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Weather Widget */}
        <div className={`mx-4 mt-4 ${darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/95 border-white/50'} backdrop-blur-xl rounded-xl p-4 shadow-lg border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">
                {weatherLoading ? '⏳' :
                 weather.condition === 'sunny' ? '☀️' : 
                 weather.condition === 'cloudy' ? '☁️' : 
                 weather.condition === 'rainy' ? '🌧️' : 
                 weather.condition === 'snowy' ? '❄️' : '💨'}
              </div>
              <div>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {weather.tempC}°C <span className={`text-lg ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>/ {weather.temp}°F</span>
                </p>
                <p className={`text-sm font-medium ${
                  weather.condition === 'sunny' ? (darkMode ? 'text-green-400' : 'text-green-600') :
                  weather.condition === 'rainy' || weather.condition === 'snowy' ? (darkMode ? 'text-orange-400' : 'text-orange-600') :
                  (darkMode ? 'text-slate-400' : 'text-gray-600')
                }`}>
                  {weather.description}
                </p>
              </div>
            </div>
            <div className={`text-right text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <p>💨 {weather.wind} km/h</p>
              <p>💧 {weather.humidity}%</p>
              <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'} mt-1`}>{activeLocation.name}</p>
            </div>
          </div>
        </div>
        
        {/* Live Court Status */}
        <div className={`mx-4 mt-4 ${darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/95 border-white/50'} backdrop-blur-xl rounded-xl p-4 shadow-lg border`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Court Status
            </h3>
            <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Updated now</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {liveCourtStatus.map((court, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border ${
                  darkMode ? (
                    court.status === 'available' ? 'bg-green-900/30 border-green-700' :
                    court.status === 'in-use' ? 'bg-red-900/30 border-red-700' :
                    court.status === 'reserved' ? 'bg-yellow-900/30 border-yellow-700' :
                    'bg-slate-700/50 border-slate-600'
                  ) : (
                    court.status === 'available' ? 'bg-green-50 border-green-200' :
                    court.status === 'in-use' ? 'bg-red-50 border-red-200' :
                    court.status === 'reserved' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-100 border-gray-200'
                  )
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Court {court.courtId}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    court.status === 'available' ? 'bg-green-500' :
                    court.status === 'in-use' ? 'bg-red-500' :
                    court.status === 'reserved' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}></span>
                </div>
                <p className={`text-xs mt-1 ${
                  darkMode ? (
                    court.status === 'available' ? 'text-green-400' :
                    court.status === 'in-use' ? 'text-red-400' :
                    court.status === 'reserved' ? 'text-yellow-400' :
                    'text-slate-400'
                  ) : (
                    court.status === 'available' ? 'text-green-600' :
                    court.status === 'in-use' ? 'text-red-600' :
                    court.status === 'reserved' ? 'text-yellow-600' :
                    'text-gray-500'
                  )
                }`}>
                  {court.status === 'available' ? '🟢 Available now' :
                   court.status === 'in-use' ? `🔴 Until ${court.endsAt}` :
                   court.status === 'reserved' ? `🟡 In ${court.startsIn} min` :
                   `🔧 ${court.reason}`}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Menu Dropdown */}
        {showMenu && (
          <>
            {/* Backdrop to close menu when tapping outside */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            <div className={`fixed top-20 right-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white/95 border-white/50'} backdrop-blur-xl rounded-2xl shadow-2xl p-4 z-50 min-w-[200px] animate-slide-up border`}>
              <button 
                onClick={() => { setCurrentScreen('profile'); setShowMenu(false) }}
                className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-purple-100 text-gray-800'} rounded-xl flex items-center gap-3 transition-colors`}
              >
                <User className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span>Profile</span>
              </button>
              <button 
                onClick={() => { setCurrentScreen('settings'); setShowMenu(false) }}
                className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-purple-100 text-gray-800'} rounded-xl flex items-center gap-3 transition-colors`}
              >
                <Settings className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span>Settings</span>
              </button>
              {currentUser?.isAdmin && (
                <button 
                  onClick={() => { setCurrentScreen('admin'); setShowMenu(false) }}
                  className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-slate-700 text-orange-400' : 'hover:bg-purple-100 text-purple-600'} rounded-xl flex items-center gap-3 transition-colors`}
                >
                  <Trophy className="w-5 h-5" />
                  <span>Admin Panel</span>
                </button>
              )}
              <hr className={`my-2 ${darkMode ? 'border-slate-700' : ''}`} />
              {/* Quick Dark Mode Toggle */}
              <button 
                onClick={() => { setDarkMode(!darkMode); }}
                className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-purple-100 text-gray-800'} rounded-xl flex items-center gap-3 transition-colors`}
              >
                <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button 
                onClick={() => { setCurrentScreen('leagues'); setShowMenu(false) }}
                className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-red-50 text-gray-800'} rounded-xl flex items-center gap-3 transition-colors`}
              >
                <span className="text-lg">⚔️</span>
                <span>Matches</span>
              </button>
              <button 
                onClick={() => { setShowProShopModal(true); setShowMenu(false) }}
                className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-green-50 text-gray-800'} rounded-xl flex items-center gap-3 transition-colors`}
              >
                <span className="text-lg">🛒</span>
                <span>Pro Shop</span>
              </button>
              <button 
                onClick={() => { setShowBallMachineModal(true); setShowMenu(false) }}
                className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-yellow-50 text-gray-800'} rounded-xl flex items-center gap-3 transition-colors`}
              >
                <span className="text-lg">🎾</span>
                <span>Ball Machine</span>
              </button>
              {/* Tennis Programs - Link to ClubSpark */}
              <button 
                onClick={() => { window.open('https://clubspark.ca/monotennisclub/Coaching', '_blank'); setShowMenu(false) }}
                className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-blue-50 text-blue-600'} rounded-xl flex items-center gap-3 transition-colors`}
              >
                <span className="text-lg">🎓</span>
                <div>
                  <span className="block">Tennis Programs</span>
                  <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Lessons on ClubSpark →</span>
                </div>
              </button>
              <hr className={`my-2 ${darkMode ? 'border-slate-700' : ''}`} />
              <button 
                onClick={handleLogout}
                className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'} rounded-xl flex items-center gap-3 transition-colors`}
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </>
        )}

        {/* Quick Actions with Colorful Icons */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => window.open('https://clubspark.ca/monotennisclub/Booking', '_blank')}
              className="bg-gradient-to-br from-blue-400/40 to-cyan-400/30 backdrop-blur-lg border border-white/40 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              <div className="bg-blue-500/50 backdrop-blur-sm p-3 rounded-xl w-fit mb-3 border border-white/30">
                <Calendar className="w-8 h-8 drop-shadow" />
              </div>
              <p className="font-bold text-lg drop-shadow">Book Court</p>
              <p className="text-xs text-white/90 mt-1 flex items-center gap-1">
                <span className="text-green-300">●</span> via ClubSpark
              </p>
            </button>

            <button
              onClick={() => setCurrentScreen('clubSchedule')}
              className="bg-gradient-to-br from-orange-400/40 to-red-400/30 backdrop-blur-lg border border-white/40 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              <div className="bg-orange-500/50 backdrop-blur-sm p-3 rounded-xl w-fit mb-3 border border-white/30">
                <Clock className="w-8 h-8 drop-shadow" />
              </div>
              <p className="font-bold text-lg drop-shadow">Club Schedule</p>
              <p className="text-xs text-white/90 mt-1 flex items-center gap-1">
                Matches & Socials
              </p>
            </button>

            <button
              onClick={() => setCurrentScreen('partners')}
              className="bg-gradient-to-br from-emerald-400/40 to-green-500/30 backdrop-blur-lg border border-white/40 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              <div className="bg-emerald-500/50 backdrop-blur-sm p-3 rounded-xl w-fit mb-3 border border-white/30">
                <Users className="w-8 h-8 drop-shadow" />
              </div>
              <p className="font-bold text-lg drop-shadow">Find Partner</p>
              <p className="text-xs text-white/90 mt-1 flex items-center gap-1">
                <span className="bg-white/30 px-2 py-0.5 rounded-full font-semibold">{partnerRequests.length}</span> looking
              </p>
            </button>

            <button 
              onClick={() => setCurrentScreen('tournaments')}
              className="bg-gradient-to-br from-amber-400/40 to-yellow-400/30 backdrop-blur-lg border border-white/40 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              <div className="bg-amber-500/50 backdrop-blur-sm p-3 rounded-xl w-fit mb-3 border border-white/30">
                <Trophy className="w-8 h-8 drop-shadow" />
              </div>
              <p className="font-bold text-lg drop-shadow">Tournaments</p>
              <p className="text-xs text-white/90 mt-1 flex items-center gap-1">
                <span className="text-yellow-300">🏆</span> Register now
              </p>
            </button>
          </div>

          {/* Club Schedule */}
          <button
            onClick={() => setCurrentScreen('clubSchedule')}
            className="w-full bg-white/25 backdrop-blur-xl border border-white/40 rounded-2xl p-5 mb-6 animate-slide-up shadow-xl hover:bg-white/30 transition-all text-left"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white drop-shadow flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Club Schedule
              </h3>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-white/80 text-sm mt-2">View matches & social events</p>
          </button>

          {/* Partner Requests Preview */}
          <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white drop-shadow flex items-center gap-2">
                <Users className="w-5 h-5" /> Looking for Partners
              </h3>
              <button 
                onClick={() => setCurrentScreen('partners')}
                className="text-white text-sm font-semibold bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors"
              >
                See All →
              </button>
            </div>
            <div className="space-y-3">
              {partnerRequests.slice(0, 2).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-purple-700 font-bold border-2 border-white/40 shadow-lg">
                      {request.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white drop-shadow">{request.name}</p>
                      <p className="text-xs text-white/90 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {request.date} • {request.time} • {request.skill}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newBooking = {
                        id: Date.now(),
                        type: 'partner',
                        partner: request.name,
                        skill: request.skill,
                        date: request.date,
                        time: request.time,
                        status: 'Confirmed'
                      }
                      setMyBookings([...myBookings, newBooking])
                      
                      // Send notification to the partner
                      const notification = {
                        id: Date.now(),
                        type: 'partner_joined',
                        from: currentUser?.name || 'A member',
                        partnerName: request.name,
                        date: request.date,
                        time: request.time,
                        timestamp: new Date().toISOString()
                      }
                      setPartnerNotifications([...partnerNotifications, notification])
                      
                      // Show success modal and confetti
                      setJoinedPartner(request)
                      setShowConfetti(true)
                      setTimeout(() => setJoinedPartner(null), 4000)
                    }}
                    className="bg-white text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md sm:w-full shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <Bell className="w-6 h-6 text-mono-green-500" />
                Notifications
              </h3>
              <button onClick={() => setShowNotifications(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Unread message notifications */}
              {messages.filter(m => m.to === currentUser?.email && !m.read).map((msg, idx) => (
                <div 
                  key={`msg-${msg.id}`} 
                  className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => {
                    setShowNotifications(false)
                    setCurrentScreen('messages')
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white flex-shrink-0 font-bold">
                      {msg.from.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">New Message from {msg.from}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.text}</p>
                      <p className="text-xs text-blue-500 mt-2 font-medium">Tap to view →</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Partner join notifications */}
              {partnerNotifications.map((notif, idx) => (
                notif.type === 'pro_shop_order' && currentUser?.isAdmin ? (
                  <div key={idx} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        🛒
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">New Pro Shop Order!</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-semibold">{notif.from}</span> ordered {notif.items} item{notif.items > 1 ? 's' : ''} • <span className="font-bold text-green-600">${notif.total}</span>
                        </p>
                        <p className="text-xs text-orange-500 mt-2 font-medium">Ready for pickup at front desk</p>
                      </div>
                    </div>
                  </div>
                ) : notif.type === 'payment' ? (
                  <div key={idx} className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        💵
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Payment Received!</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-semibold">{notif.from}</span> paid {notif.amount} for {notif.booking}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Just now</p>
                      </div>
                    </div>
                  </div>
                ) : notif.type === 'event_created' ? (
                  <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        {notif.eventType === 'lesson' ? '🎓' : notif.eventType === 'match' ? '⚔️' : '🎾'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">New Event: {notif.title}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notif.date} at {notif.time}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Just now</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        🤝
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">New Partner Request!</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-semibold">{notif.from}</span> wants to join you for {notif.date} at {notif.time}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Just now</p>
                      </div>
                    </div>
                  </div>
                )
              ))}
              
              {/* Sample notifications - only show if not cleared */}
              {!baseNotificationsCleared && (
                <>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        🎓
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Lesson Confirmed</p>
                        <p className="text-sm text-gray-600 mt-1">Your booking for Advanced Singles Clinic with John Smith is confirmed for Mon, Jan 20 at 6:00 PM</p>
                        <p className="text-xs text-gray-400 mt-2">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Court Booking Confirmed</p>
                        <p className="text-sm text-gray-600 mt-1">Court 2 reserved for Wed, Jan 15 at 4:00 PM. Payment received.</p>
                        <p className="text-xs text-gray-400 mt-2">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-lg opacity-60">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        📅
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-700">Reminder: Match Tomorrow</p>
                        <p className="text-sm text-gray-600 mt-1">Inter Club A Match vs Belfountain TC at 2:00 PM</p>
                        <p className="text-xs text-gray-400 mt-2">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Empty state when all notifications cleared */}
              {partnerNotifications.length === 0 && baseNotificationsCleared && unreadMessageCount === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">All caught up!</p>
                  <p className="text-gray-400 text-sm">No new notifications</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button 
                onClick={() => {
                  setPartnerNotifications([])
                  setBaseNotificationsCleared(true)
                  // Mark all messages as read
                  setMessages(prev => prev.map(m => ({...m, read: true})))
                  setShowNotifications(false)
                }}
                className="w-full text-center text-sm text-mono-green-600 font-semibold hover:text-mono-green-700"
              >
                Mark all as read
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Join Partner Success Modal */}
      {joinedPartner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform animate-scale-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">You're In! 🎾</h3>
              <p className="text-gray-600 mb-4">
                Successfully joined <span className="font-bold text-purple-600">{joinedPartner.name}</span>
              </p>
              
              <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4 mb-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">{joinedPartner.date}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">{joinedPartner.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">{joinedPartner.skill} Level</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">📬 Notification sent!</span> {joinedPartner.name} has been notified of your join request.
                </p>
              </div>
              
              <button
                onClick={() => setJoinedPartner(null)}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    )
  }

  // Court Booking Screen
  const BookingScreen = () => {
    const [selectedDate, setSelectedDate] = useState(2) // Default to Wed (index 2)
    const dates = ['Mon 13', 'Tue 14', 'Wed 15', 'Thu 16', 'Fri 17', 'Sat 18', 'Sun 19']
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
      availableOnly: false,
      litCourts: false,
      newCourts: false
    })
    
    // Apply filters to courts
    const filteredCourts = courts.filter(court => {
      if (filters.availableOnly && !court.available) return false
      if (filters.litCourts && !court.hasLights) return false
      if (filters.newCourts && !court.isNew) return false
      return true
    })
    
    return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Clay court gradient - warm orange-brown */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-600 to-orange-600" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-orange-600/30 backdrop-blur-xl border-b border-white/20 shadow-lg p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentScreen('home')} 
              className="text-white font-bold hover:text-white/80 flex items-center gap-2"
            >
              ← Back
            </button>
            <h2 className="font-bold text-xl text-white drop-shadow flex items-center gap-2">
              <span className="text-2xl">🎾</span> Book a Court
            </h2>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white/15 backdrop-blur-xl border-b border-white/20 p-4 mb-4 shadow-lg">
          <p className="text-sm text-white font-semibold mb-3 drop-shadow flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Select Date
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {dates.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDate(idx)}
                className={`min-w-[75px] py-3 px-4 rounded-xl font-semibold transition-all shadow-lg ${
                  idx === selectedDate
                    ? 'bg-white text-red-700 scale-105 border-2 border-orange-300'
                    : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
                }`}
              >
                <div className="text-xs mb-1">{day.split(' ')[0]}</div>
                <div className="text-xl font-bold">{day.split(' ')[1]}</div>
              </button>
            ))}
          </div>
          {/* Tennis ball felt colored slider */}
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300" 
              style={{
                width: `${((selectedDate + 1) / dates.length) * 100}%`,
                background: 'linear-gradient(to right, #E4FF00, #CFFF00)'
              }}
            ></div>
          </div>
        </div>

        {/* Available Courts */}
        <div className="px-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-white drop-shadow flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Available Courts
              </h3>
              <p className="text-white/80 text-xs mt-1">{dates[selectedDate]}</p>
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="text-white text-sm font-medium flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 hover:bg-white/25 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filters.availableOnly || filters.litCourts || filters.newCourts) && (
                <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
          
          {/* Filter Popup */}
          {showFilters && (
            <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-xl p-4 mb-4 shadow-xl animate-slide-up">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-white">Filters</h4>
                <button 
                  onClick={() => setFilters({ availableOnly: false, litCourts: false, newCourts: false })}
                  className="text-xs text-white/80 underline hover:text-white"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white text-sm">Available Only</span>
                  <div 
                    onClick={() => setFilters({...filters, availableOnly: !filters.availableOnly})}
                    className={`w-12 h-6 rounded-full transition-colors ${filters.availableOnly ? 'bg-green-500' : 'bg-white/30'} relative`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${filters.availableOnly ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Lit Courts Only
                  </span>
                  <div 
                    onClick={() => setFilters({...filters, litCourts: !filters.litCourts})}
                    className={`w-12 h-6 rounded-full transition-colors ${filters.litCourts ? 'bg-amber-500' : 'bg-white/30'} relative`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${filters.litCourts ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white text-sm">New Courts Only</span>
                  <div 
                    onClick={() => setFilters({...filters, newCourts: !filters.newCourts})}
                    className={`w-12 h-6 rounded-full transition-colors ${filters.newCourts ? 'bg-blue-500' : 'bg-white/30'} relative`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${filters.newCourts ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </label>
              </div>
            </div>
          )}
          
          <div className="grid gap-4">
            {filteredCourts.map((court) => (
              <button
                key={court.id}
                onClick={() => {
                  if (court.available) {
                    setSelectedCourt(court)
                    setCurrentScreen('timeslot')
                  }
                }}
                disabled={!court.available}
                className={`bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden transition-all text-left shadow-xl ${
                  court.available ? 'hover:scale-[1.02] hover:bg-white/25' : 'opacity-50'
                }`}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-white drop-shadow">{court.name}</h4>
                    </div>
                    <div className="text-5xl drop-shadow">🎾</div>
                  </div>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {court.isNew && (
                      <span className="text-xs bg-blue-400/90 backdrop-blur-sm text-white px-3 py-1 rounded-full font-semibold flex items-center gap-1 border border-white/20 shadow">
                        ✨ New
                      </span>
                    )}
                    {court.hasLights && (
                      <span className="text-xs bg-amber-400/90 backdrop-blur-sm text-white px-3 py-1 rounded-full font-semibold flex items-center gap-1 border border-white/20 shadow">
                        <Lightbulb className="w-3 h-3" />
                        Lit Court
                      </span>
                    )}
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold shadow border border-white/20 ${
                        court.available
                          ? 'bg-emerald-400/90 text-white'
                          : 'bg-red-400/90 text-white'
                      }`}
                    >
                      {court.available ? '🟢 Available' : '🔴 Booked'}
                    </span>
                  </div>
                  {court.available && (
                    <div className="bg-white text-red-700 py-3 px-4 rounded-lg text-sm font-bold text-center shadow-lg flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Select Time Slot →
                    </div>
                  )}
                </div>
              </button>
            ))}
            
            {filteredCourts.length === 0 && (
              <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl p-8 text-center">
                <p className="text-white text-lg font-semibold mb-2">No courts match your filters</p>
                <p className="text-white/80 text-sm mb-4">Try adjusting your filter settings</p>
                <button 
                  onClick={() => setFilters({ availableOnly: false, litCourts: false, newCourts: false })}
                  className="bg-white/25 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/35 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    )
  }

  // Time Slot Selection Screen
  const TimeSlotScreen = () => {
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
    
    // Generate different availability based on court/date (simulated)
    const getAvailability = (slot) => {
      const seed = selectedCourt?.id || 1
      const hash = slot.split(':')[0].charCodeAt(0) + seed
      return hash % 3 !== 0 // About 66% availability
    }
    
    return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-300" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-lg p-4 sticky top-0 z-10">
          <button 
            onClick={() => {
              setCurrentScreen(reschedulingBooking ? 'bookings' : 'book')
              setReschedulingBooking(null)
            }} 
            className="text-white font-bold mb-3 hover:text-white/80"
          >
            ← Back {reschedulingBooking ? 'to Bookings' : 'to Courts'}
          </button>
          <div className="flex items-center gap-3">
            <div className="text-4xl drop-shadow">🎾</div>
            <div>
              <h2 className="font-bold text-xl text-white drop-shadow">
                {reschedulingBooking ? 'Reschedule: ' : ''}{selectedCourt?.name}
              </h2>
              {selectedCourt?.hasLights && (
                <p className="text-sm text-white/90">
                  • Lit Court
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="px-4 py-6">
          <h3 className="font-bold text-white drop-shadow mb-4">Select Time (1 hour)</h3>
          <div className="grid grid-cols-3 gap-3">
            {timeSlots.map((slot, idx) => {
              const isAvailable = getAvailability(slot)
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedTime(slot)
                      setCurrentScreen('confirm')
                    }
                  }}
                  disabled={!isAvailable}
                  className={`py-4 rounded-xl font-bold transition-all shadow-lg ${
                    isAvailable
                      ? 'bg-white/90 backdrop-blur-sm text-gray-800 hover:shadow-xl hover:scale-105 border border-white/50'
                      : 'bg-white/20 backdrop-blur-sm text-white/60 cursor-not-allowed border border-white/30'
                  }`}
                >
                  {slot}
                  {!isAvailable && <div className="text-xs text-red-300 mt-1">Booked</div>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
    )
  }

  // Booking Confirmation Screen
  const ConfirmScreen = () => {
    const [matchType, setMatchType] = useState('singles')
    
    return (
    <div className="min-h-screen pb-20 flex flex-col relative overflow-hidden">
      {/* Gradient Background - Keep same as time selection */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-300" />
      
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-lg p-4">
          <button 
            onClick={() => setCurrentScreen('timeslot')} 
            className="text-white font-bold hover:text-white/80"
          >
            ← Back
          </button>
        </div>

        {/* Booking Details */}
        <div className="flex-1 px-4 py-6">
          <h2 className="font-bold text-3xl text-white mb-6 drop-shadow-lg">
            {reschedulingBooking ? 'Update Booking' : 'Confirm Booking'}
          </h2>
          
          <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-2xl p-6 mb-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 drop-shadow">🎾</div>
              <h3 className="font-bold text-2xl text-white drop-shadow">{selectedCourt?.name}</h3>
            </div>

            <div className="space-y-4 border-t border-white/30 pt-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/30 backdrop-blur-sm p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Date</p>
                  <p className="font-bold text-white drop-shadow">Wednesday, Jan 15, 2026</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/30 backdrop-blur-sm p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Time</p>
                  <p className="font-bold text-white drop-shadow">{selectedTime} (1 hour)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/30 backdrop-blur-sm p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Location</p>
                  <p className="font-bold text-white drop-shadow">Mono Tennis Club</p>
                </div>
              </div>
            </div>
          </div>

          {/* Singles/Doubles Selection */}
          <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-xl p-4 mb-6 shadow-lg">
            <p className="text-sm text-white font-semibold mb-3">Match Type</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMatchType('singles')}
                className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  matchType === 'singles'
                    ? 'bg-white text-purple-700 shadow-lg scale-105'
                    : 'bg-white/20 text-white border border-white/30'
                }`}
              >
                <Users className="w-4 h-4" />
                Singles
              </button>
              <button
                onClick={() => setMatchType('doubles')}
                className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  matchType === 'doubles'
                    ? 'bg-white text-purple-700 shadow-lg scale-105'
                    : 'bg-white/20 text-white border border-white/30'
                }`}
              >
                <div className="flex items-center -space-x-1.5">
                  <User className="w-3 h-3" />
                  <User className="w-3 h-3" />
                  <User className="w-3 h-3" />
                  <User className="w-3 h-3" />
                </div>
                Doubles
              </button>
            </div>
          </div>
          
          {/* Guest Booking Option */}
          <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-xl p-4 mb-4 shadow-lg">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="bg-white/30 backdrop-blur-sm p-2 rounded-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Booking for a guest</p>
                  <p className="text-xs text-white/70">+${guestFee} guest fee applies</p>
                </div>
              </div>
              <button
                onClick={() => setIsGuestBooking(!isGuestBooking)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isGuestBooking ? 'bg-green-500' : 'bg-white/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isGuestBooking ? 'right-1' : 'left-1'}`}></div>
              </button>
            </label>
            {isGuestBooking && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Guest's name"
                  className="w-full p-3 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>
          
          {/* Recurring Booking Option */}
          <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-xl p-4 mb-6 shadow-lg">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="bg-white/30 backdrop-blur-sm p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Make this recurring</p>
                  <p className="text-xs text-white/70">Book same slot weekly</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-green-500' : 'bg-white/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'right-1' : 'left-1'}`}></div>
              </button>
            </label>
            {isRecurring && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-sm text-white mb-2">Repeat for:</p>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map(weeks => (
                    <button
                      key={weeks}
                      onClick={() => setRecurringWeeks(weeks)}
                      className={`py-2 rounded-lg font-semibold text-sm transition-all ${
                        recurringWeeks === weeks
                          ? 'bg-white text-purple-700'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {weeks} weeks
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-xl p-4 flex justify-between items-center shadow-lg">
            <div>
              <p className="text-sm text-white/80">Total Amount</p>
              <p className="text-4xl font-bold text-white drop-shadow">
                ${(selectedCourt?.rate || 0) + (isGuestBooking ? guestFee : 0)}
                {isRecurring && <span className="text-lg"> × {recurringWeeks}</span>}
              </p>
              <p className="text-xs text-white/90">
                {isGuestBooking && `Includes $${guestFee} guest fee • `}
                {isRecurring ? `$${((selectedCourt?.rate || 0) + (isGuestBooking ? guestFee : 0)) * recurringWeeks} total` : 'Member rate'}
              </p>
            </div>
            <div className="bg-white/30 backdrop-blur-sm p-3 rounded-xl">
              <CreditCard className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
        
        {/* E-Transfer Payment Info - Only show for new bookings */}
        {!reschedulingBooking && (
          <div className="px-4 mb-4">
            <div className="bg-blue-500/30 backdrop-blur-xl border-2 border-blue-300/50 rounded-xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="bg-green-500/70 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">Send E-Transfer To:</h4>
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg mb-2">
                    <p className="text-blue-700 font-bold text-lg">{clubEtransferEmail}</p>
                  </div>
                  <p className="text-white/90 text-xs">
                    • Amount: ${selectedCourt?.rate}.00
                    <br />
                    • Message: Include your name and court booking
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <div className="p-4 bg-white/20 backdrop-blur-xl border-t border-white/30 shadow-lg">
          <button
            onClick={handleBooking}
            className="w-full bg-white text-red-600 font-bold py-4 px-6 rounded-2xl text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-95 transition-all"
          >
            {reschedulingBooking ? 'Update Booking' : 'Pay & Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
    )
  }

  // Profile Screen
  const ProfileScreen = () => {
    const [isEditing, setIsEditing] = useState(false)
    const [editedPhone, setEditedPhone] = useState(savedPhone)
    const [editedName, setEditedName] = useState(currentUser?.name || '')
    const isAdmin = currentUser?.isAdmin || false
    const isCoach = currentUser?.isCoach || false
    
    return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="relative z-10">
        <div className="bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-lg p-4 sticky top-0 z-10">
          <button 
            onClick={() => setCurrentScreen('home')} 
            className="text-white font-bold mb-3 hover:text-white/80"
          >
            ← Back to Home
          </button>
          <h2 className="font-bold text-2xl text-white drop-shadow">My Profile</h2>
        </div>

        <div className="px-4 py-6 space-y-4">
          {/* Profile Header */}
          <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-xl text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-mono-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
              {currentUser?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 className="text-2xl font-bold text-white drop-shadow mb-1">{currentUser?.name}</h3>
            <p className="text-white/80">{currentUser?.email}</p>
            <div className="mt-4 flex justify-center gap-3">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-semibold">
                Member since 2024
              </span>
              {isCoach && (
                <span className="bg-blue-500 px-4 py-2 rounded-full text-white text-sm font-bold flex items-center gap-2">
                  🎾 Coach
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white drop-shadow">47</p>
              <p className="text-xs text-white/80 mt-1">Total Bookings</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white drop-shadow">32</p>
              <p className="text-xs text-white/80 mt-1">Matches Won</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white drop-shadow">4.2</p>
              <p className="text-xs text-white/80 mt-1">Skill Rating</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
            <h4 className="font-bold text-white mb-3">Account Information</h4>
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Name</span>
                    <input 
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-white/20 text-white px-3 py-1 rounded-lg border border-white/30 text-sm"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Phone</span>
                    <input 
                      type="tel"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      className="bg-white/20 text-white px-3 py-1 rounded-lg border border-white/30 text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Membership</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isAdmin ? 'bg-red-500 text-white' : 
                      isCoach ? 'bg-blue-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {isAdmin ? '👑 Admin' : isCoach ? '🎾 Coach' : 'Regular'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Name</span>
                    <span className="text-white font-semibold">{currentUser?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Phone</span>
                    <span className="text-white font-semibold">{savedPhone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Membership</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isAdmin ? 'bg-red-500 text-white' : 
                      isCoach ? 'bg-blue-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {isAdmin ? '👑 Admin' : isCoach ? '🎾 Coach' : 'Regular'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setEditedPhone(savedPhone)
                  setEditedName(currentUser?.name || '')
                  setIsEditing(false)
                }}
                className="flex-1 bg-white/25 backdrop-blur-sm text-white py-3 rounded-xl font-semibold hover:bg-white/35 transition-colors border border-white/30"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setSavedPhone(editedPhone)
                  setCurrentUser({...currentUser, name: editedName})
                  setIsEditing(false)
                }}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full bg-white/25 backdrop-blur-sm text-white py-3 rounded-xl font-semibold hover:bg-white/35 transition-colors border border-white/30"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
    )
  }

  // Settings Screen
  const SettingsScreen = () => {
    const [showProfileVisibility, setShowProfileVisibility] = useState(false)
    // profileVisibility is now at parent level
    const [showBlockList, setShowBlockList] = useState(false)
    // blockedUsers is now at parent level
    const [showBlockUserInput, setShowBlockUserInput] = useState(false)
    const [blockUsername, setBlockUsername] = useState('')
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    
    return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500">
      <div className="relative z-10">
        <div className="bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-lg p-4 sticky top-0 z-10">
          <button 
            onClick={() => setCurrentScreen('home')} 
            className="text-white font-bold mb-3 hover:text-white/80"
          >
            ← Back to Home
          </button>
          <h2 className="font-bold text-2xl text-white drop-shadow">Settings</h2>
        </div>

        <div className="px-4 py-6 space-y-4">
          {/* Appearance */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              🎨 Appearance
            </h4>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-white font-medium">Dark Mode</span>
                <p className="text-white/60 text-xs">Switch to dark theme</p>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-orange-500' : 'bg-gray-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>

          {/* Weather Location */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              🌤️ Weather Location
            </h4>
            <p className="text-white/70 text-sm mb-3">Set your location for personalized weather on your dashboard.</p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">Use Custom Location</span>
                  <p className="text-white/60 text-xs">Override club's default location</p>
                </div>
                <button 
                  onClick={() => {
                    if (memberLocation) {
                      setMemberLocation(null)
                      showToast('Using club default location')
                    } else {
                      setMemberLocation({...clubLocation})
                      showToast('Custom location enabled')
                    }
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors ${memberLocation ? 'bg-green-500' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${memberLocation ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              {memberLocation && (
                <>
                  <div>
                    <label className="text-white/80 text-sm block mb-1">Location Name</label>
                    <input
                      type="text"
                      value={memberLocation.name}
                      onChange={(e) => setMemberLocation({...memberLocation, name: e.target.value})}
                      placeholder="e.g., My City, ON"
                      className="w-full p-3 rounded-lg text-gray-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/80 text-sm block mb-1">Latitude</label>
                      <input
                        type="number"
                        step="0.01"
                        value={memberLocation.lat}
                        onChange={(e) => setMemberLocation({...memberLocation, lat: parseFloat(e.target.value) || 0})}
                        className="w-full p-3 rounded-lg text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="text-white/80 text-sm block mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.01"
                        value={memberLocation.lng}
                        onChange={(e) => setMemberLocation({...memberLocation, lng: parseFloat(e.target.value) || 0})}
                        className="w-full p-3 rounded-lg text-gray-800"
                      />
                    </div>
                  </div>
                  
                  {/* Quick Select Ontario Cities */}
                  <div>
                    <p className="text-white/80 text-sm mb-2">Quick Select:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Toronto, ON', lat: 43.65, lng: -79.38 },
                        { name: 'Ottawa, ON', lat: 45.42, lng: -75.69 },
                        { name: 'Mississauga, ON', lat: 43.59, lng: -79.64 },
                        { name: 'Hamilton, ON', lat: 43.26, lng: -79.87 },
                        { name: 'London, ON', lat: 42.98, lng: -81.25 },
                        { name: 'Orangeville, ON', lat: 43.92, lng: -80.09 },
                        { name: 'Mono, ON', lat: 44.02, lng: -80.07 },
                      ].map(loc => (
                        <button
                          key={loc.name}
                          onClick={() => {
                            setMemberLocation(loc)
                            showToast(`Location set to ${loc.name}`)
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            memberLocation.name === loc.name 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {loc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <p className="text-white/50 text-xs">
                Currently showing weather for: {activeLocation.name}
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">Event Notifications</span>
                  <p className="text-white/60 text-xs">New matches & socials</p>
                </div>
                <button 
                  onClick={() => setNotificationPrefs({...notificationPrefs, eventNotifications: !notificationPrefs.eventNotifications})}
                  className={`w-12 h-6 rounded-full relative transition-colors ${notificationPrefs.eventNotifications ? 'bg-green-500' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationPrefs.eventNotifications ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">Payment Notifications</span>
                  <p className="text-white/60 text-xs">Payment confirmations & receipts</p>
                </div>
                <button 
                  onClick={() => setNotificationPrefs({...notificationPrefs, paymentNotifications: !notificationPrefs.paymentNotifications})}
                  className={`w-12 h-6 rounded-full relative transition-colors ${notificationPrefs.paymentNotifications ? 'bg-green-500' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationPrefs.paymentNotifications ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">Partner Requests</span>
                  <p className="text-white/60 text-xs">When someone wants to play</p>
                </div>
                <button 
                  onClick={() => setNotificationPrefs({...notificationPrefs, partnerNotifications: !notificationPrefs.partnerNotifications})}
                  className={`w-12 h-6 rounded-full relative transition-colors ${notificationPrefs.partnerNotifications ? 'bg-green-500' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationPrefs.partnerNotifications ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">Messages</span>
                  <p className="text-white/60 text-xs">Direct messages from members</p>
                </div>
                <button 
                  onClick={() => setNotificationPrefs({...notificationPrefs, messageNotifications: !notificationPrefs.messageNotifications})}
                  className={`w-12 h-6 rounded-full relative transition-colors ${notificationPrefs.messageNotifications ? 'bg-green-500' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationPrefs.messageNotifications ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">Admin Announcements</span>
                  <p className="text-white/60 text-xs">Important club announcements</p>
                </div>
                <button 
                  onClick={() => setNotificationPrefs({...notificationPrefs, adminAnnouncements: !notificationPrefs.adminAnnouncements})}
                  className={`w-12 h-6 rounded-full relative transition-colors ${notificationPrefs.adminAnnouncements ? 'bg-green-500' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationPrefs.adminAnnouncements ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
          
          {/* Skill Level */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              🎾 Skill Level (NTRP)
            </h4>
            <p className="text-white/60 text-xs mb-4">Used for matching with similar skill players</p>
            <div className="grid grid-cols-4 gap-2">
              {[2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0].map(level => (
                <button
                  key={level}
                  onClick={() => setPlayerStats({...playerStats, skillRating: level})}
                  className={`py-2 rounded-lg font-semibold text-sm transition-all ${
                    playerStats.skillRating === level
                      ? 'bg-green-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-white/50 text-xs mt-2 text-center">
              {playerStats.skillRating <= 3.0 ? 'Beginner' : 
               playerStats.skillRating <= 3.5 ? 'Intermediate' :
               playerStats.skillRating <= 4.5 ? 'Advanced' : 'Expert'}
            </p>
          </div>

          {/* Privacy */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
            <h4 className="font-bold text-white mb-4">Privacy</h4>
            <div className="space-y-3">
              <button 
                onClick={() => setShowProfileVisibility(true)}
                className="w-full text-left text-white py-2 flex justify-between items-center hover:bg-white/10 px-3 rounded-lg transition-colors"
              >
                <span>Profile Visibility</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowBlockList(true)}
                className="w-full text-left text-white py-2 flex justify-between items-center hover:bg-white/10 px-3 rounded-lg transition-colors"
              >
                <span>Block List</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* About */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
            <h4 className="font-bold text-white mb-4">About</h4>
            <div className="text-center py-4">
              <p className="text-white/90 text-sm mb-2">Version 1.0.0</p>
              <p className="text-white font-semibold mb-4">made with love ❤️</p>
              
              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full mt-2 bg-red-500/80 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Visibility Modal */}
      {showProfileVisibility && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-xl text-gray-800 mb-4">Profile Visibility</h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setProfileVisibility('Public')}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  profileVisibility === 'Public' 
                    ? 'border-mono-green-500 bg-mono-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">Public</div>
                <div className="text-sm text-gray-600">Everyone can see your profile</div>
              </button>
              <button
                onClick={() => setProfileVisibility('Members Only')}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  profileVisibility === 'Members Only' 
                    ? 'border-mono-green-500 bg-mono-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">Members Only</div>
                <div className="text-sm text-gray-600">Only club members can see</div>
              </button>
              <button
                onClick={() => setProfileVisibility('Private')}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  profileVisibility === 'Private' 
                    ? 'border-mono-green-500 bg-mono-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">Private</div>
                <div className="text-sm text-gray-600">Hidden from everyone</div>
              </button>
            </div>
            <button
              onClick={() => setShowProfileVisibility(false)}
              className="w-full bg-mono-green-500 text-white py-3 rounded-xl font-semibold hover:bg-mono-green-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
      
      {/* Block List Modal */}
      {showBlockList && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-gray-800">Blocked Users</h3>
              <button onClick={() => setShowBlockList(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            {/* Add user to block list */}
            <div className="mb-4">
              <button
                onClick={() => setShowBlockUserInput(true)}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">🚫</span>
                Block a User
              </button>
            </div>
            
            {blockedUsers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 mb-2 font-semibold">No blocked users</p>
                <p className="text-sm text-gray-400">Click "Block a User" above to add someone</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {blockedUsers.map((user, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">
                        {user.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800">{user}</span>
                    </div>
                    <button
                      onClick={() => {
                        setBlockedUsers(blockedUsers.filter((_, i) => i !== idx))
                        showToast(`${user} has been unblocked`)
                      }}
                      className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Block User Input Modal */}
      {showBlockUserInput && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚫</span>
              </div>
              <h3 className="font-bold text-xl text-gray-800">Block a User</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Enter the username of the member you'd like to block. They won't be able to see your profile or send you requests.
            </p>
            
            <input
              type="text"
              value={blockUsername}
              onChange={(e) => setBlockUsername(e.target.value)}
              placeholder="Enter username..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none mb-4"
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockUserInput(false)
                  setBlockUsername('')
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (blockUsername.trim()) {
                    setBlockedUsers([...blockedUsers, blockUsername.trim()])
                    setShowBlockUserInput(false)
                    setBlockUsername('')
                  }
                }}
                disabled={!blockUsername.trim()}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                  blockUsername.trim()
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">Log Out?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to log out of your account?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setCurrentUser(null)
                    setCurrentScreen('login')
                    setMyBookings([
                      { id: 1, court: 'Court 2', date: 'Today', time: '4:00 PM - 5:00 PM', status: 'Confirmed', matchType: 'singles', paid: false, type: 'court' },
                      { id: 2, court: 'Court 1', date: 'Tomorrow', time: '10:00 AM - 11:00 AM', status: 'Confirmed', matchType: 'doubles', paid: false, type: 'court' },
                    ])
                    setShowLogoutModal(false)
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    )
  }

  // Admin Panel Screen
  const AdminScreen = () => {
    const [isEditingEmail, setIsEditingEmail] = useState(false)
    const [tempEmail, setTempEmail] = useState(clubEtransferEmail)
    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [showMemberProfile, setShowMemberProfile] = useState(false)
    const [showMessageModal, setShowMessageModal] = useState(false)
    const [messageText, setMessageText] = useState('')
    const [showAddMemberModal, setShowAddMemberModal] = useState(false)
    const [newMemberName, setNewMemberName] = useState('')
    const [newMemberEmail, setNewMemberEmail] = useState('')
    const [memberSearch, setMemberSearch] = useState('')
    
    // Tournament modals
    const [showCreateTournament, setShowCreateTournament] = useState(false)
    const [showParticipants, setShowParticipants] = useState<any>(null)
    const [showTournamentResults, setShowTournamentResults] = useState<any>(null)
    const [newTournament, setNewTournament] = useState({
      name: '',
      type: 'Singles',
      startDate: '',
      endDate: '',
      entryFee: 45,
      maxParticipants: 32
    })
    
    // Use parent-level clubMembers state for persistence
    const filteredMembers = clubMembers.filter(m => 
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
    )
    
    // New Event Form
    const [showNewEventForm, setShowNewEventForm] = useState(false)
    const [newEvent, setNewEvent] = useState({
      type: 'match',
      title: '',
      opponent: '',
      date: '',
      time: '',
      details: ''
    })
    
    const handleCreateEvent = () => {
      // Determine the icon based on event type and title
      let eventIcon = '⚔️' // default for matches
      if (newEvent.type === 'social') {
        if (newEvent.title.includes('Wimbledon')) {
          eventIcon = '🎉🇬🇧'
        } else if (newEvent.title.includes('French Open')) {
          eventIcon = '🎉🇫🇷'
        } else if (newEvent.title.includes('US Open')) {
          eventIcon = '🎉🇺🇸'
        } else {
          eventIcon = '🎉'
        }
      }
      
      const event = {
        id: Date.now(),
        type: newEvent.type,
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        icon: eventIcon,
        ...(newEvent.type === 'match' && { opponent: newEvent.opponent }),
        ...(newEvent.type === 'social' && { details: newEvent.details })
      }
      
      // Add event to club schedule at the beginning so it shows first
      setClubEvents([event, ...clubEvents])
      
      // Send notification to members
      const notification = {
        id: Date.now(),
        type: 'event_created',
        eventType: newEvent.type,
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        from: 'Admin',
        timestamp: new Date().toISOString()
      }
      setPartnerNotifications([...partnerNotifications, notification])
      
      // Reset form
      setShowNewEventForm(false)
      setNewEvent({
        type: 'match',
        title: '',
        opponent: '',
        date: '',
        time: '',
        details: ''
      })
      
      // Show confirmation
      showToast(`✓ ${newEvent.type === 'match' ? 'Match' : 'Social event'} created! Members have been notified.`)
    }
    
    return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative z-10">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 shadow-lg">
          <button 
            onClick={() => setCurrentScreen('home')} 
            className="text-white/80 font-medium mb-2 hover:text-white flex items-center gap-1"
          >
            ← Back
          </button>
          <h2 className="font-bold text-2xl text-white flex items-center gap-2">
            🎾 Club Dashboard
          </h2>
          <p className="text-white/70 text-sm">Welcome back, {currentUser?.name}</p>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="px-4 py-4 grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Today's Bookings</p>
                <p className="text-2xl font-bold text-white">{myBookings.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Active Members</p>
                <p className="text-2xl font-bold text-white">{clubMembers.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-400">{proShopOrders.filter(o => o.status === 'pending').length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/30 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Revenue Today</p>
                <p className="text-2xl font-bold text-green-400">${proShopOrders.filter(o => o.status === 'completed').reduce((a, o) => a + o.total, 0)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Grid - When no section selected */}
        {adminTab === 'dashboard' && (
          <div className="px-4 pb-4">
            <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAdminTab('bookings')}
                className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform"
              >
                <Calendar className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Bookings</p>
                <p className="text-white/70 text-xs">Manage reservations</p>
              </button>
              <button
                onClick={() => setAdminTab('courts')}
                className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform"
              >
                <MapPin className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Courts</p>
                <p className="text-white/70 text-xs">Court management</p>
              </button>
              <button
                onClick={() => setAdminTab('members')}
                className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform"
              >
                <Users className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Members</p>
                <p className="text-white/70 text-xs">{clubMembers.length} registered</p>
              </button>
              <button
                onClick={() => setAdminTab('tournaments')}
                className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform"
              >
                <Trophy className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Tournaments</p>
                <p className="text-white/70 text-xs">Manage events</p>
              </button>
              <button
                onClick={() => setAdminTab('payments')}
                className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform"
              >
                <DollarSign className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Payments</p>
                <p className="text-white/70 text-xs">e-Transfer setup</p>
              </button>
              <button
                onClick={() => setAdminTab('events')}
                className="bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform"
              >
                <CalendarDays className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Events</p>
                <p className="text-white/70 text-xs">Matches & Socials</p>
              </button>
              <button
                onClick={() => setAdminTab('proshop')}
                className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform relative"
              >
                <ShoppingBag className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Pro Shop</p>
                <p className="text-white/70 text-xs">Inventory & orders</p>
                {proShopOrders.filter(o => o.status === 'pending').length > 0 && (
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                    {proShopOrders.filter(o => o.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAdminTab('announce')}
                className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform"
              >
                <Bell className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Announce</p>
                <p className="text-white/70 text-xs">Send notifications</p>
              </button>
              <button
                onClick={() => setAdminTab('analytics')}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform col-span-2"
              >
                <BarChart3 className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Analytics & Reports</p>
                <p className="text-white/70 text-xs">View club statistics and insights</p>
              </button>
              <button
                onClick={() => setAdminTab('clubsettings')}
                className="bg-gradient-to-br from-slate-600 to-slate-700 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform col-span-2"
              >
                <Settings className="w-6 h-6 text-white mb-2" />
                <p className="text-white font-semibold">Club Settings</p>
                <p className="text-white/70 text-xs">Weather location, preferences & more</p>
              </button>
            </div>
          </div>
        )}
        
        {/* Section Content - with back button */}
        {adminTab !== 'dashboard' && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setAdminTab('dashboard')}
              className="text-orange-400 font-medium mb-4 flex items-center gap-1 hover:text-orange-300"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        <div className="px-4 py-2">
          {adminTab === 'bookings' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-white text-lg">📅 All Bookings</h4>
                <span className="text-white/70 text-sm">{myBookings.length} total</span>
              </div>
              
              {myBookings.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-white font-semibold text-lg mb-2">No bookings yet</p>
                  <p className="text-white/60 text-sm">Court reservations will appear here</p>
                </div>
              ) : (
                myBookings.map((booking, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-white">
                          {booking.court} - {booking.time.split(' - ')[0]}
                        </h4>
                        <p className="text-white/80 text-sm">
                          {currentUser?.name} • {booking.matchType || 'Court'}
                        </p>
                        <p className="text-white/60 text-xs mt-1">{booking.date}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.paid 
                          ? 'bg-green-400/90 text-white' 
                          : 'bg-yellow-400/90 text-gray-800'
                      }`}>
                        {booking.paid ? '✓ Paid' : 'Payment Pending'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => {
                          const updatedBookings = myBookings.map(b =>
                            b.id === booking.id ? { ...b, paid: true } : b
                          )
                          setMyBookings(updatedBookings)
                        }}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          booking.paid 
                            ? 'bg-white/15 text-white/50 cursor-not-allowed'
                            : 'bg-green-500/80 text-white hover:bg-green-600/80'
                        }`}
                        disabled={booking.paid}
                      >
                        {booking.paid ? 'Paid ✓' : 'Mark Paid'}
                      </button>
                      <button 
                        onClick={() => {
                          setMyBookings(myBookings.filter(b => b.id !== booking.id))
                        }}
                        className="flex-1 py-2 bg-red-500/80 text-white rounded-lg text-sm font-semibold hover:bg-red-600/80 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {adminTab === 'courts' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white text-lg mb-3">🎾 Court Management</h4>
              {courts.map(court => (
                <div key={court.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-white">{court.name}</h4>
                      <p className="text-white/70 text-sm">{court.type}</p>
                      <div className="flex gap-2 mt-2">
                        {court.hasLights && (
                          <span className="text-xs bg-amber-400/90 text-white px-2 py-1 rounded-full">🔦 Lit</span>
                        )}
                        {court.isNew && (
                          <span className="text-xs bg-blue-400/90 text-white px-2 py-1 rounded-full">✨ New</span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${court.available ? 'bg-green-400/90 text-white' : 'bg-red-400/90 text-white'}`}>
                          {court.available ? '✓ Available' : '✗ Unavailable'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const updatedCourts = courts.map(c => 
                          c.id === court.id ? {...c, available: !c.available} : c
                        )
                        setCourts(updatedCourts)
                        showToast(`${court.name} marked as ${!court.available ? 'available' : 'unavailable'}`)
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        court.available 
                          ? 'bg-red-500/80 text-white hover:bg-red-600/80' 
                          : 'bg-green-500/80 text-white hover:bg-green-600/80'
                      }`}
                    >
                      {court.available ? 'Close Court' : 'Open Court'}
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-center">
                <p className="text-white/70 text-sm">💡 Closing a court will prevent new bookings</p>
              </div>
            </div>
          )}

          {adminTab === 'members' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white text-lg mb-3">👥 Member Management</h4>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-bold text-white">Club Members</h4>
                    <p className="text-white/70 text-sm">{clubMembers.length} total • {clubMembers.filter(m => m.status === 'Active').length} active</p>
                  </div>
                  <button 
                    onClick={() => setShowAddMemberModal(true)}
                    className="bg-green-500/80 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-600/80 transition-colors"
                  >
                    + Add Member
                  </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members by name or email..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  {memberSearch && (
                    <button 
                      onClick={() => setMemberSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {memberSearch && (
                  <p className="text-white/70 text-sm mt-2">
                    Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              
              {/* Member List */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-white font-semibold text-lg mb-2">No members found</p>
                    <p className="text-white/60 text-sm">No results for "{memberSearch}"</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div key={member.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h5 className="font-semibold text-white">{member.name}</h5>
                            <p className="text-white/60 text-xs">{member.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <button
                            onClick={() => {
                              const newStatus = member.status === 'Active' ? 'Inactive' : 'Active'
                              setClubMembers(clubMembers.map(m => m.id === member.id ? {...m, status: newStatus} : m))
                              showToast(`${member.name} marked as ${newStatus}`)
                            }}
                            className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 ${
                              member.status === 'Active' ? 'bg-green-400/90 text-white' : 'bg-gray-400/90 text-white'
                            }`}
                          >
                            {member.status}
                          </button>
                          <p className="text-white/60 text-xs mt-1">{member.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => {
                            setSelectedMember(member)
                            setShowMemberProfile(true)
                          }}
                          className="flex-1 py-2 bg-white/20 text-white rounded-lg text-xs font-semibold hover:bg-white/30 transition-colors"
                        >
                          View Profile
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedMember(member)
                            setShowMessageModal(true)
                          }}
                          className="flex-1 py-2 bg-blue-500/80 text-white rounded-lg text-xs font-semibold hover:bg-blue-600/80 transition-colors"
                        >
                          Message
                        </button>
                        <button 
                          onClick={() => {
                            setClubMembers(clubMembers.filter(m => m.id !== member.id))
                            showToast(`${member.name} has been removed`)
                          }}
                          className="py-2 px-3 bg-red-500/80 text-white rounded-lg text-xs font-semibold hover:bg-red-600/80 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          )}

          {adminTab === 'tournaments' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-white">Club Tournaments</h4>
                <button 
                  onClick={() => setShowCreateTournament(true)}
                  className="bg-green-500/80 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-600/80 transition-colors"
                >
                  + Create Tournament
                </button>
              </div>
              
              {/* Tournament List */}
              {tournaments.map((tournament) => (
                <div 
                  key={tournament.id}
                  className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 ${
                    tournament.status === 'completed' ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-white">
                        {tournament.type === 'Singles' ? '🏆' : '🎾'} {tournament.name}
                      </h4>
                      <p className="text-white/70 text-sm">{tournament.dates}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tournament.status === 'open' ? 'bg-green-400/90 text-white' :
                      tournament.status === 'closed' ? 'bg-yellow-400/90 text-white' :
                      tournament.status === 'in-progress' ? 'bg-blue-400/90 text-white' :
                      'bg-gray-400/90 text-white'
                    }`}>
                      {tournament.status === 'open' ? 'Registration Open' :
                       tournament.status === 'closed' ? 'Registration Closed' :
                       tournament.status === 'in-progress' ? 'In Progress' :
                       'Completed'}
                    </span>
                  </div>
                  
                  {tournament.status !== 'completed' ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-white/15 p-2 rounded-lg text-center">
                          <p className="text-xl font-bold text-white">{tournament.participants.length}</p>
                          <p className="text-xs text-white/60">Registered</p>
                        </div>
                        <div className="bg-white/15 p-2 rounded-lg text-center">
                          <p className="text-xl font-bold text-white">{tournament.maxParticipants}</p>
                          <p className="text-xs text-white/60">Max</p>
                        </div>
                        <div className="bg-white/15 p-2 rounded-lg text-center">
                          <p className="text-xl font-bold text-white">${tournament.entryFee}</p>
                          <p className="text-xs text-white/60">Entry Fee</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowParticipants(tournament)}
                          className="flex-1 py-2 bg-white/25 text-white rounded-lg text-sm font-semibold hover:bg-white/35 transition-colors"
                        >
                          View Participants
                        </button>
                        <button 
                          onClick={() => {
                            const newStatus = tournament.status === 'open' ? 'closed' : 'open'
                            setTournaments(tournaments.map(t => 
                              t.id === tournament.id ? {...t, status: newStatus} : t
                            ))
                            showToast(`Registration ${newStatus === 'closed' ? 'closed' : 'opened'}`)
                          }}
                          className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                            tournament.status === 'open' 
                              ? 'bg-red-500/80 text-white hover:bg-red-600/80'
                              : 'bg-green-500/80 text-white hover:bg-green-600/80'
                          }`}
                        >
                          {tournament.status === 'open' ? 'Close' : 'Open'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-white/70 text-sm mb-2">Winner: {tournament.winner}</p>
                      <button 
                        onClick={() => setShowTournamentResults(tournament)}
                        className="w-full py-2 bg-white/15 text-white/70 rounded-lg text-sm font-semibold hover:bg-white/25 transition-colors"
                      >
                        View Results
                      </button>
                    </>
                  )}
                </div>
              ))}
              
              {tournaments.length === 0 && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-white font-semibold text-lg mb-2">No tournaments yet</p>
                  <p className="text-white/60 text-sm">Create your first tournament to get started!</p>
                </div>
              )}
            </div>
          )}
          
          {adminTab === 'payments' && (
            <div className="space-y-4">
              {/* E-Transfer Email Management */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-white" />
                  <h4 className="font-bold text-white text-lg">E-Transfer Payment Settings</h4>
                </div>
                
                <p className="text-white/90 text-sm mb-4">
                  This is the email address members will use to send e-transfers for court bookings.
                </p>
                
                <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <label className="text-white font-semibold text-sm mb-2 block">
                    E-Transfer Email Address
                  </label>
                  
                  {isEditingEmail ? (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg text-gray-800 font-semibold text-lg"
                        placeholder="payments@monotennis.com"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setTempEmail(clubEtransferEmail)
                            setIsEditingEmail(false)
                          }}
                          className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setClubEtransferEmail(tempEmail)
                            setIsEditingEmail(false)
                            // In production, save to backend here
                          }}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="bg-white/90 px-4 py-3 rounded-lg flex-1">
                        <p className="text-blue-700 font-bold text-lg">{clubEtransferEmail}</p>
                      </div>
                      <button
                        onClick={() => {
                          setTempEmail(clubEtransferEmail)
                          setIsEditingEmail(true)
                        }}
                        className="ml-3 px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-500/20 border border-blue-300/30 rounded-lg p-3">
                  <p className="text-white text-xs">
                    ℹ️ <strong>Note:</strong> This email will be shown to members on the booking confirmation screen. 
                    Make sure it's set up to auto-deposit e-transfers.
                  </p>
                </div>
              </div>
              
              {/* Payment Stats */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
                <h4 className="font-bold text-white mb-4">Payment Overview (This Month)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/20 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-white">
                      ${myBookings.filter(b => b.paid).reduce((sum) => sum + 5, 0)}
                    </p>
                    <p className="text-xs text-white/80 mt-1">Total Revenue</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-white">{myBookings.filter(b => b.paid).length}</p>
                    <p className="text-xs text-white/80 mt-1">Paid Bookings</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {adminTab === 'events' && (
            <div className="space-y-4">
              {/* Create New Event Button */}
              <button
                onClick={() => setShowNewEventForm(!showNewEventForm)}
                className="w-full py-3 bg-white text-orange-600 rounded-xl font-bold text-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {showNewEventForm ? 'Cancel' : 'Create New Event'}
              </button>
              
              {/* New Event Form */}
              {showNewEventForm && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
                  <h3 className="font-bold text-white text-lg mb-4">Add New Event</h3>
                  
                  {/* Event Type */}
                  <div className="mb-4">
                    <label className="text-white font-semibold text-sm mb-2 block">Event Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setNewEvent({...newEvent, type: 'match', title: ''})}
                        className={`py-2 rounded-lg font-semibold transition-all ${
                          newEvent.type === 'match' ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
                        }`}
                      >
                        ⚔️ Match
                      </button>
                      <button
                        onClick={() => setNewEvent({...newEvent, type: 'social', title: ''})}
                        className={`py-2 rounded-lg font-semibold transition-all ${
                          newEvent.type === 'social' ? 'bg-orange-500 text-white' : 'bg-white/20 text-white'
                        }`}
                      >
                        🎾 Social
                      </button>
                    </div>
                  </div>
                  
                  {/* Title - Dropdown based on type */}
                  <div className="mb-4">
                    <label className="text-white font-semibold text-sm mb-2 block">Event Title</label>
                    <select
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg text-gray-800 font-semibold"
                    >
                      <option value="">Select Title</option>
                      {newEvent.type === 'match' && (
                        <>
                          <option value="Inter Club A Match">Inter Club A Match</option>
                          <option value="Inter Club B Match">Inter Club B Match</option>
                          <option value="Inter County Men's A">Inter County Men's A</option>
                          <option value="Inter County Women's A">Inter County Women's A</option>
                          <option value="Mixed Doubles Match">Mixed Doubles Match</option>
                          <option value="Junior Team Match">Junior Team Match</option>
                          <option value="Senior Team Match">Senior Team Match</option>
                        </>
                      )}
                      {newEvent.type === 'social' && (
                        <>
                          <option value="Wimbledon Social">Wimbledon Social</option>
                          <option value="French Open Social">French Open Social</option>
                          <option value="US Open Social">US Open Social</option>
                          <option value="Australian Open Social">Australian Open Social</option>
                          <option value="Freedom 55">Freedom 55</option>
                          <option value="New Member Welcome">New Member Welcome</option>
                          <option value="End of Season Party">End of Season Party</option>
                          <option value="Club BBQ">Club BBQ</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Conditional Fields */}
                  {newEvent.type === 'match' && (
                    <div className="mb-4">
                      <label className="text-white font-semibold text-sm mb-2 block">Opponent Club</label>
                      <select
                        value={newEvent.opponent}
                        onChange={(e) => setNewEvent({...newEvent, opponent: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg text-gray-800 font-semibold"
                      >
                        <option value="">Select Opponent</option>
                        <option value="vs Belfountain TC">Belfountain Tennis Club</option>
                        <option value="vs Caledon TC">Caledon Tennis Club</option>
                        <option value="vs Orangeville TC">Orangeville Tennis Club</option>
                        <option value="vs Palgrave TC">Palgrave Tennis Club</option>
                        <option value="vs Bolton TC">Bolton Tennis Club</option>
                        <option value="vs Brampton TC">Brampton Tennis Club</option>
                      </select>
                    </div>
                  )}
                  
                  {newEvent.type === 'social' && (
                    <div className="mb-4">
                      <label className="text-white font-semibold text-sm mb-2 block">Details / Dress Code</label>
                      <select
                        value={newEvent.details}
                        onChange={(e) => setNewEvent({...newEvent, details: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg text-gray-800 font-semibold"
                      >
                        <option value="">Select Details (Optional)</option>
                        <option value="Dress code: All white">Dress code: All white (Wimbledon)</option>
                        <option value="Clay court theme">Clay court theme (French Open)</option>
                        <option value="Hard court theme">Hard court theme (US Open)</option>
                        <option value="Bring a dish to share">Bring a dish to share</option>
                        <option value="Club social for 55+">Club social for 55+</option>
                        <option value="Family friendly event">Family friendly event</option>
                        <option value="Members & guests welcome">Members & guests welcome</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Date - Dropdown */}
                  <div className="mb-4">
                    <label className="text-white font-semibold text-sm mb-2 block">Date</label>
                    <select
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg text-gray-800 font-semibold"
                    >
                      <option value="">Select Date</option>
                      <option value="Mon, Jan 20">Monday, Jan 20</option>
                      <option value="Tue, Jan 21">Tuesday, Jan 21</option>
                      <option value="Wed, Jan 22">Wednesday, Jan 22</option>
                      <option value="Thu, Jan 23">Thursday, Jan 23</option>
                      <option value="Fri, Jan 24">Friday, Jan 24</option>
                      <option value="Sat, Jan 25">Saturday, Jan 25</option>
                      <option value="Sun, Jan 26">Sunday, Jan 26</option>
                      <option value="Mon, Jan 27">Monday, Jan 27</option>
                      <option value="Tue, Jan 28">Tuesday, Jan 28</option>
                      <option value="Wed, Jan 29">Wednesday, Jan 29</option>
                      <option value="Thu, Jan 30">Thursday, Jan 30</option>
                      <option value="Fri, Jan 31">Friday, Jan 31</option>
                      <option value="Sat, Feb 1">Saturday, Feb 1</option>
                      <option value="Sun, Feb 2">Sunday, Feb 2</option>
                    </select>
                  </div>
                  
                  {/* Time - Dropdown */}
                  <div className="mb-4">
                    <label className="text-white font-semibold text-sm mb-2 block">Time</label>
                    <select
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg text-gray-800 font-semibold"
                    >
                      <option value="">Select Time</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="1:00 PM">1:00 PM</option>
                      <option value="2:00 PM">2:00 PM</option>
                      <option value="3:00 PM">3:00 PM</option>
                      <option value="4:00 PM">4:00 PM</option>
                      <option value="5:00 PM">5:00 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
                      <option value="7:00 PM">7:00 PM</option>
                      <option value="8:00 PM">8:00 PM</option>
                    </select>
                  </div>
                  
                  {/* Submit Button */}
                  <button
                    onClick={handleCreateEvent}
                    disabled={!newEvent.title || !newEvent.date || !newEvent.time}
                    className={`w-full py-3 rounded-xl font-bold transition-colors ${
                      !newEvent.title || !newEvent.date || !newEvent.time
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    ✓ Create Event
                  </button>
                </div>
              )}
              
              {/* Existing Events List */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
                <h3 className="font-bold text-white text-lg mb-4">All Events ({clubEvents.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {clubEvents.map((event) => (
                    <div key={event.id} className="bg-white/20 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-bold">{event.icon} {event.title}</p>
                          <p className="text-white/80 text-sm">{event.date} at {event.time}</p>
                          {event.coach && <p className="text-white/70 text-xs">Coach: {event.coach}</p>}
                          {event.opponent && <p className="text-white/70 text-xs">{event.opponent}</p>}
                        </div>
                        <button
                          onClick={() => {
                            setClubEvents(clubEvents.filter(e => e.id !== event.id))
                            showToast(`${event.title} has been deleted`)
                          }}
                          className="text-red-300 hover:text-red-100 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Analytics Tab */}
          {adminTab === 'analytics' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-lg">📊 Club Analytics</h4>
              
              {/* Overview Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4">
                  <p className="text-white/80 text-sm">Bookings This Month</p>
                  <p className="text-3xl font-bold text-white">{analyticsData.totalBookingsThisMonth}</p>
                  <p className="text-green-200 text-xs">↑ {analyticsData.bookingsChange}% from last month</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4">
                  <p className="text-white/80 text-sm">Revenue</p>
                  <p className="text-3xl font-bold text-white">${analyticsData.revenueThisMonth}</p>
                  <p className="text-blue-200 text-xs">↑ {analyticsData.revenueChange}% from last month</p>
                </div>
              </div>
              
              {/* Court Utilization */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">Court Utilization</h5>
                {analyticsData.courtUtilization.map((court, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="flex justify-between text-white text-sm mb-1">
                      <span>{court.court}</span>
                      <span>{court.utilization}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          court.utilization > 75 ? 'bg-green-500' :
                          court.utilization > 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${court.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Most Active Members */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">🏆 Most Active Members</h5>
                {analyticsData.mostActiveMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-500 text-white' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        'bg-orange-400 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-white">{member.name}</span>
                    </div>
                    <span className="text-white/70 text-sm">{member.bookings} bookings</span>
                  </div>
                ))}
              </div>
              
              {/* Peak Times */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">⏰ Peak Times</h5>
                {analyticsData.peakTimes.map((peak, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <span className="text-white">{peak.day} at {peak.time}</span>
                    <span className="text-white/70 text-sm">{peak.bookings} bookings</span>
                  </div>
                ))}
              </div>
              
              {/* Export Button */}
              <button
                onClick={() => {
                  const csvContent = `Member,Email,Status,Joined\n${clubMembers.map(m => `${m.name},${m.email},${m.status},${m.joined}`).join('\n')}`
                  const blob = new Blob([csvContent], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'mono-tennis-members.csv'
                  a.click()
                  showToast('Member list exported!')
                }}
                className="w-full py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                📥 Export Member List (CSV)
              </button>
            </div>
          )}
          
          {/* Announcements Tab */}
          {adminTab === 'announce' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-lg">📢 Club Announcements</h4>
              <p className="text-white/70 text-sm">Create announcements that all members will see on their home screen.</p>
              
              {/* Create Announcement Form */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">New Announcement</h5>
                <textarea
                  id="announcementText"
                  placeholder="Type your announcement here..."
                  className="w-full p-3 rounded-lg text-gray-800 h-24 resize-none focus:ring-2 focus:ring-orange-500 focus:outline-none"
                ></textarea>
                <div className="flex gap-2 mt-3">
                  <select id="announcementType" className="flex-1 p-2 rounded-lg text-gray-800">
                    <option value="info">ℹ️ Info</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                  <button
                    onClick={() => {
                      const textEl = document.getElementById('announcementText') as HTMLTextAreaElement
                      const typeEl = document.getElementById('announcementType') as HTMLSelectElement
                      if (textEl.value.trim()) {
                        const newAnnouncement = {
                          id: Date.now(),
                          text: textEl.value.trim(),
                          type: typeEl.value,
                          date: new Date().toISOString().split('T')[0],
                          dismissedBy: [] as string[]
                        }
                        setAnnouncements([newAnnouncement, ...announcements])
                        textEl.value = ''
                        showToast('Announcement posted!')
                      }
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
              
              {/* Active Announcements */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">Active Announcements</h5>
                {announcements.length === 0 ? (
                  <p className="text-white/60 text-center py-4">No announcements</p>
                ) : (
                  <div className="space-y-2">
                    {announcements.map(announcement => (
                      <div key={announcement.id} className="bg-white/20 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="text-lg mr-2">
                              {announcement.type === 'warning' ? '⚠️' : announcement.type === 'urgent' ? '🚨' : 'ℹ️'}
                            </span>
                            <span className="text-white">{announcement.text}</span>
                            <p className="text-white/50 text-xs mt-1">Posted {announcement.date}</p>
                          </div>
                          <button
                            onClick={() => setAnnouncements(announcements.filter(a => a.id !== announcement.id))}
                            className="text-red-300 hover:text-red-100 ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Welcome Message for Chat */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">💬 Chat Welcome Message</h5>
                <p className="text-white/70 text-sm mb-3">This message appears in every member's chat from Admin.</p>
                <textarea
                  value={adminWelcomeMessage}
                  onChange={(e) => setAdminWelcomeMessage(e.target.value)}
                  placeholder="Type your welcome message..."
                  className="w-full p-3 rounded-lg text-gray-800 h-24 resize-none focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    // Update the admin message in messages array
                    setMessages(prev => prev.map(m => 
                      m.fromEmail === 'admin@monotennis.com' && m.from === 'Admin'
                        ? {...m, text: adminWelcomeMessage}
                        : m
                    ))
                    showToast('Welcome message updated!')
                  }}
                  className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                  Save Welcome Message
                </button>
              </div>
              
              {/* Maintenance Mode */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">🔧 Court Maintenance</h5>
                <p className="text-white/70 text-sm mb-3">Mark courts as under maintenance. Affected bookings will be notified.</p>
                <div className="space-y-2">
                  {courts.map(court => (
                    <div key={court.id} className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
                      <span className="text-white font-medium">{court.name}</span>
                      <button
                        onClick={() => {
                          if (maintenanceCourts.includes(court.id)) {
                            setMaintenanceCourts(maintenanceCourts.filter(c => c !== court.id))
                            showToast(`${court.name} is now open`)
                          } else {
                            setMaintenanceCourts([...maintenanceCourts, court.id])
                            showToast(`${court.name} marked for maintenance`)
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                          maintenanceCourts.includes(court.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {maintenanceCourts.includes(court.id) ? '🔧 In Maintenance' : 'Mark Maintenance'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Pro Shop Orders Tab */}
          {adminTab === 'proshop' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-lg">🛒 Pro Shop Management</h4>
              
              {/* Pending Orders */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                  Pending Orders ({proShopOrders.filter(o => o.status === 'pending').length})
                </h5>
                {proShopOrders.filter(o => o.status === 'pending').length === 0 ? (
                  <p className="text-white/60 text-center py-4">No pending orders</p>
                ) : (
                  <div className="space-y-2">
                    {proShopOrders.filter(o => o.status === 'pending').map(order => (
                      <div key={order.id} className="bg-white/20 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-semibold">{order.user}</p>
                            <p className="text-white/60 text-xs">
                              {new Date(order.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-lg font-bold text-green-400">${order.total}</span>
                        </div>
                        <div className="text-white/70 text-sm mb-2">
                          {order.items.map((item, i) => (
                            <span key={i}>{item.qty}x {item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Reduce stock for completed items
                              order.items.forEach(orderItem => {
                                setProShopItems(prev => prev.map(item => 
                                  item.name === orderItem.name 
                                    ? {...item, stock: Math.max(0, item.stock - orderItem.qty)}
                                    : item
                                ))
                              })
                              setProShopOrders(proShopOrders.map(o => 
                                o.id === order.id ? {...o, status: 'completed'} : o
                              ))
                              showToast(`Order completed - stock updated`)
                            }}
                            className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600"
                          >
                            ✓ Complete
                          </button>
                          <button
                            onClick={() => {
                              setProShopOrders(proShopOrders.filter(o => o.id !== order.id))
                              showToast(`Order cancelled`)
                            }}
                            className="py-2 px-3 bg-red-500/50 text-white rounded-lg text-sm font-semibold hover:bg-red-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Completed Orders */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">Completed Today ({proShopOrders.filter(o => o.status === 'completed').length})</h5>
                {proShopOrders.filter(o => o.status === 'completed').length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-white/60">No completed orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proShopOrders.filter(o => o.status === 'completed').map(order => (
                      <div key={order.id} className="bg-white/10 p-3 rounded-lg opacity-70">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">{order.user}</p>
                            <p className="text-white/50 text-xs">
                              {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                            </p>
                          </div>
                          <span className="text-white/70">${order.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Inventory Management - Full CRUD */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-bold text-white">📦 Inventory Management</h5>
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-600 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {proShopItems.map(item => (
                    <div key={item.id} className="bg-white/10 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-white/50 text-xs">
                            {item.price === 0 ? 'Free (demo)' : `$${item.price}`}
                            {item.category && ` • ${item.category}`}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.stock > 10 ? 'bg-green-500/30 text-green-300' :
                          item.stock > 5 ? 'bg-yellow-500/30 text-yellow-300' :
                          'bg-red-500/30 text-red-300'
                        }`}>
                          {item.stock} in stock
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {/* Quick Stock Adjust */}
                        <div className="flex items-center bg-white/10 rounded-lg">
                          <button
                            onClick={() => setProShopItems(prev => prev.map(i => 
                              i.id === item.id ? {...i, stock: Math.max(0, i.stock - 1)} : i
                            ))}
                            className="px-2 py-1 text-white hover:bg-white/20 rounded-l-lg"
                          >
                            -
                          </button>
                          <span className="px-2 text-white text-sm">{item.stock}</span>
                          <button
                            onClick={() => setProShopItems(prev => prev.map(i => 
                              i.id === item.id ? {...i, stock: i.stock + 1} : i
                            ))}
                            className="px-2 py-1 text-white hover:bg-white/20 rounded-r-lg"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setEditingItem(item)
                            setShowEditItemModal(true)
                          }}
                          className="px-3 py-1 bg-blue-500/50 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${item.name}"?`)) {
                              setProShopItems(prev => prev.filter(i => i.id !== item.id))
                              showToast('Item deleted')
                            }
                          }}
                          className="px-3 py-1 bg-red-500/50 text-white rounded-lg text-xs font-semibold hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Sales Summary */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">💰 Sales Summary</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">
                      ${proShopOrders.filter(o => o.status === 'completed').reduce((a, o) => a + o.total, 0)}
                    </p>
                    <p className="text-white/60 text-xs">Today's Sales</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">
                      {proShopOrders.filter(o => o.status === 'completed').length}
                    </p>
                    <p className="text-white/60 text-xs">Orders Completed</p>
                  </div>
                </div>
              </div>
              
              {/* Low Stock Alerts */}
              {proShopItems.filter(i => i.stock <= 5).length > 0 && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-4">
                  <h5 className="font-bold text-red-300 mb-2">⚠️ Low Stock Alert</h5>
                  <div className="space-y-1">
                    {proShopItems.filter(i => i.stock <= 5).map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-white">{item.name}</span>
                        <span className="text-red-300 font-semibold">{item.stock} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Club Settings Tab */}
          {adminTab === 'clubsettings' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-lg">⚙️ Club Settings</h4>
              
              {/* Weather Location */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">🌤️ Weather Location</h5>
                <p className="text-white/70 text-sm mb-3">Set your club's location for accurate weather data on the home screen.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-white/80 text-sm block mb-1">Location Name</label>
                    <input
                      type="text"
                      value={clubLocation.name}
                      onChange={(e) => setClubLocation({...clubLocation, name: e.target.value})}
                      placeholder="e.g., Mono, ON"
                      className="w-full p-3 rounded-lg text-gray-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/80 text-sm block mb-1">Latitude</label>
                      <input
                        type="number"
                        step="0.01"
                        value={clubLocation.lat}
                        onChange={(e) => setClubLocation({...clubLocation, lat: parseFloat(e.target.value)})}
                        className="w-full p-3 rounded-lg text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="text-white/80 text-sm block mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.01"
                        value={clubLocation.lng}
                        onChange={(e) => setClubLocation({...clubLocation, lng: parseFloat(e.target.value)})}
                        className="w-full p-3 rounded-lg text-gray-800"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-500/30 p-3 rounded-lg">
                    <p className="text-white text-sm">
                      💡 <strong>How to find your coordinates:</strong>
                    </p>
                    <ol className="text-white/80 text-sm mt-2 space-y-1 list-decimal list-inside">
                      <li>Go to Google Maps</li>
                      <li>Search your club's address</li>
                      <li>Right-click on the pin</li>
                      <li>Click the coordinates to copy them</li>
                    </ol>
                  </div>
                  
                  {/* Quick Select Ontario Cities */}
                  <div>
                    <p className="text-white/80 text-sm mb-2">Quick Select (Ontario):</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Toronto, ON', lat: 43.65, lng: -79.38 },
                        { name: 'Ottawa, ON', lat: 45.42, lng: -75.69 },
                        { name: 'Mississauga, ON', lat: 43.59, lng: -79.64 },
                        { name: 'Hamilton, ON', lat: 43.26, lng: -79.87 },
                        { name: 'London, ON', lat: 42.98, lng: -81.25 },
                        { name: 'Markham, ON', lat: 43.86, lng: -79.34 },
                        { name: 'Orangeville, ON', lat: 43.92, lng: -80.09 },
                        { name: 'Mono, ON', lat: 44.02, lng: -80.07 },
                      ].map(loc => (
                        <button
                          key={loc.name}
                          onClick={() => {
                            setClubLocation(loc)
                            showToast(`Location set to ${loc.name}`)
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            clubLocation.name === loc.name 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {loc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Club Info */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">🏠 Club Information</h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/80 text-sm block mb-1">Club Name</label>
                    <input
                      type="text"
                      defaultValue="Mono Tennis Club"
                      className="w-full p-3 rounded-lg text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-white/80 text-sm block mb-1">E-Transfer Email</label>
                    <input
                      type="email"
                      value={clubEtransferEmail}
                      onChange={(e) => setClubEtransferEmail(e.target.value)}
                      placeholder="payments@yourclub.com"
                      className="w-full p-3 rounded-lg text-gray-800"
                    />
                  </div>
                </div>
              </div>
              
              {/* Current Weather Preview */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <h5 className="font-bold text-white mb-3">📍 Weather Preview</h5>
                <div className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">
                      {weather.condition === 'sunny' ? '☀️' : 
                       weather.condition === 'cloudy' ? '☁️' : 
                       weather.condition === 'rainy' ? '🌧️' : 
                       weather.condition === 'snowy' ? '❄️' : '💨'}
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-white">{weather.tempC}°C</p>
                      <p className="text-white/70 text-sm">{weather.description}</p>
                    </div>
                  </div>
                  <div className="text-right text-white/70 text-sm">
                    <p>💨 {weather.wind} km/h</p>
                    <p>💧 {weather.humidity}%</p>
                    <p className="text-white/50 text-xs mt-1">{clubLocation.name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showMemberProfile && selectedMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {selectedMember.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">{selectedMember.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedMember.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedMember.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowMemberProfile(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-semibold text-gray-800">{selectedMember.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="font-semibold text-gray-800">{selectedMember.joined}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Bookings</p>
                  <p className="font-semibold text-gray-800">{selectedMember.bookings}</p>
                </div>
              </div>
              
              {/* Privacy note */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  🔒 Contact via in-app messaging for member privacy
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowMemberProfile(false)
                  setShowMessageModal(true)
                }}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Send Message
              </button>
              <button
                onClick={() => setShowMemberProfile(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Message Member Modal */}
      {showMessageModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl text-gray-800">Send Message</h3>
                <p className="text-sm text-gray-500">to {selectedMember.name}</p>
              </div>
              <button onClick={() => {
                setShowMessageModal(false)
                setMessageText('')
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-blue-700 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Messages are private and only visible to you and the recipient
              </p>
            </div>
            
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mb-4 h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageText('')
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (messageText.trim()) {
                    // Add message to the messaging system
                    const newMessage = {
                      id: Date.now(),
                      from: currentUser?.name || 'Admin',
                      fromEmail: currentUser?.email || 'admin@monotennis.com',
                      to: selectedMember.email,
                      toName: selectedMember.name,
                      text: messageText,
                      timestamp: new Date().toISOString(),
                      read: false
                    }
                    setMessages(prev => [newMessage, ...prev])
                    showToast(`Message sent to ${selectedMember.name}`)
                    setShowMessageModal(false)
                    setMessageText('')
                    setSelectedMember(null)
                  }
                }}
                disabled={!messageText.trim()}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                  messageText.trim() 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-gray-800">Add New Member</h3>
              <button onClick={() => {
                setShowAddMemberModal(false)
                setNewMemberName('')
                setNewMemberEmail('')
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mt-1 focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="e.g., john@email.com"
                  className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mt-1 focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddMemberModal(false)
                  setNewMemberName('')
                  setNewMemberEmail('')
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newMemberName.trim() && newMemberEmail.trim()) {
                    const newMember = {
                      id: Date.now(),
                      name: newMemberName,
                      email: newMemberEmail,
                      status: 'Active',
                      bookings: 0,
                      joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    }
                    setClubMembers([newMember, ...clubMembers])
                    showToast(`${newMemberName} has been added`)
                    setShowAddMemberModal(false)
                    setNewMemberName('')
                    setNewMemberEmail('')
                  }
                }}
                disabled={!newMemberName.trim() || !newMemberEmail.trim()}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                  newMemberName.trim() && newMemberEmail.trim()
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Tournament Modal */}
      {showCreateTournament && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-gray-800">Create Tournament</h3>
              <button onClick={() => {
                setShowCreateTournament(false)
                setNewTournament({ name: '', type: 'Singles', startDate: '', endDate: '', entryFee: 45, maxParticipants: 32 })
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Tournament Name</label>
                <input
                  type="text"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                  placeholder="e.g., Summer Singles Championship"
                  className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mt-1 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700">Type</label>
                <select
                  value={newTournament.type}
                  onChange={(e) => setNewTournament({...newTournament, type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mt-1 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="Singles">Singles</option>
                  <option value="Doubles">Doubles</option>
                  <option value="Mixed Doubles">Mixed Doubles</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={newTournament.startDate}
                    onChange={(e) => setNewTournament({...newTournament, startDate: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mt-1 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={newTournament.endDate}
                    onChange={(e) => setNewTournament({...newTournament, endDate: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mt-1 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Entry Fee ($)</label>
                  <select
                    value={newTournament.entryFee}
                    onChange={(e) => setNewTournament({...newTournament, entryFee: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mt-1 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value={0}>Free</option>
                    <option value={25}>$25</option>
                    <option value={35}>$35</option>
                    <option value={45}>$45</option>
                    <option value={60}>$60</option>
                    <option value={75}>$75</option>
                    <option value={100}>$100</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Max Participants</label>
                  <select
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({...newTournament, maxParticipants: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mt-1 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value={8}>8</option>
                    <option value={16}>16</option>
                    <option value={32}>32</option>
                    <option value={64}>64</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateTournament(false)
                  setNewTournament({ name: '', type: 'Singles', startDate: '', endDate: '', entryFee: 45, maxParticipants: 32 })
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newTournament.name && newTournament.startDate && newTournament.endDate) {
                    const startDate = new Date(newTournament.startDate)
                    const endDate = new Date(newTournament.endDate)
                    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    
                    const tournament = {
                      id: Date.now(),
                      name: newTournament.name,
                      type: newTournament.type,
                      dates: `${formatDate(startDate)} - ${formatDate(endDate)}`,
                      startDate: newTournament.startDate,
                      entryFee: newTournament.entryFee,
                      maxParticipants: newTournament.maxParticipants,
                      status: 'open',
                      participants: [],
                      draw: null,
                      winner: null
                    }
                    setTournaments([tournament, ...tournaments])
                    showToast(`Tournament "${newTournament.name}" created!`)
                    setShowCreateTournament(false)
                    setNewTournament({ name: '', type: 'Singles', startDate: '', endDate: '', entryFee: 45, maxParticipants: 32 })
                  }
                }}
                disabled={!newTournament.name || !newTournament.startDate || !newTournament.endDate}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                  newTournament.name && newTournament.startDate && newTournament.endDate
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Create Tournament
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* View Participants Modal */}
      {showParticipants && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl text-gray-800">Participants</h3>
                <p className="text-sm text-gray-500">{showParticipants.name}</p>
              </div>
              <button onClick={() => setShowParticipants(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3 mb-4">
              <span className="text-gray-600">{showParticipants.participants.length} / {showParticipants.maxParticipants} registered</span>
              <span className="text-green-600 font-semibold">
                ${showParticipants.participants.filter(p => p.paid).length * showParticipants.entryFee} collected
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {showParticipants.participants.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">👥</div>
                  <p className="text-gray-500 font-medium">No participants yet</p>
                  <p className="text-gray-400 text-sm">Be the first to sign up!</p>
                </div>
              ) : (
                showParticipants.participants.map((participant, idx) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800">{participant.name}</p>
                        {participant.seed && (
                          <span className="text-xs text-orange-600">Seed #{participant.seed}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        participant.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {participant.paid ? '✓ Paid' : 'Unpaid'}
                      </span>
                      <button
                        onClick={() => {
                          const updatedParticipants = showParticipants.participants.filter(p => p.id !== participant.id)
                          const updatedTournament = {...showParticipants, participants: updatedParticipants}
                          setTournaments(tournaments.map(t => t.id === showParticipants.id ? updatedTournament : t))
                          setShowParticipants(updatedTournament)
                          showToast(`${participant.name} removed from tournament`)
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowParticipants(null)}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tournament Results Modal */}
      {showTournamentResults && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-gray-800">Tournament Results</h3>
              <button onClick={() => setShowTournamentResults(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center py-6">
              <div className="text-6xl mb-4">🏆</div>
              <h4 className="font-bold text-2xl text-gray-800 mb-2">{showTournamentResults.name}</h4>
              <p className="text-gray-500 mb-6">{showTournamentResults.dates}</p>
              
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 mb-4">
                <p className="text-sm text-gray-600 mb-1">Champion</p>
                <p className="font-bold text-2xl text-gray-800">{showTournamentResults.winner}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Type</p>
                  <p className="font-semibold text-gray-800">{showTournamentResults.type}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Entry Fee</p>
                  <p className="font-semibold text-gray-800">${showTournamentResults.entryFee}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowTournamentResults(null)}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    )
  }

  // My Bookings Screen
  const MyBookingsScreen = () => {
    // bookingTab is now at parent level for persistence
    const [cancellingBooking, setCancellingBooking] = useState<any>(null)
    
    const pastBookings = [
      { id: 3, court: 'Court 1', date: 'Jan 10', time: '2:00 PM - 3:00 PM', status: 'Completed', matchType: 'singles', paid: true },
      { id: 4, court: 'Court 3', date: 'Jan 8', time: '11:00 AM - 12:00 PM', status: 'Completed', matchType: 'doubles', paid: true },
    ]
    
    const displayBookings = bookingTab === 'upcoming' ? myBookings : pastBookings
    
    return (
    <>
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Green gradient like desktop - lime to emerald */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-lime-500 to-emerald-500" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-green-600/30 backdrop-blur-xl border-b border-white/20 shadow-lg p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => setCurrentScreen('home')} 
              className="text-white font-bold hover:text-white/80 flex items-center gap-2"
            >
              ← Back
            </button>
            <h2 className="font-bold text-xl text-white drop-shadow flex items-center gap-2">
              <Clock className="w-6 h-6" /> My Bookings
            </h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setBookingTab('upcoming')}
              className={`flex-1 py-2 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 ${
                bookingTab === 'upcoming' 
                  ? 'bg-white text-green-700'
                  : 'bg-white/20 backdrop-blur-sm text-white border border-white/20'
              }`}
            >
              {bookingTab === 'upcoming' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
              Upcoming
            </button>
            <button 
              onClick={() => setBookingTab('past')}
              className={`flex-1 py-2 rounded-xl font-semibold ${
                bookingTab === 'past'
                  ? 'bg-white text-green-700 shadow-lg'
                  : 'bg-white/20 backdrop-blur-sm text-white border border-white/20'
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="p-4 space-y-4">
          {displayBookings.map((booking, idx) => (
            <div key={booking.id} className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/50 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                    <span className="text-2xl flex gap-1">
                      {booking.matchType === 'doubles' ? (
                        <>🎾🎾</>
                      ) : (
                        <>🎾</>
                      )}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white drop-shadow">
                      {booking.court}
                    </h3>
                    <p className="text-sm text-white/90 flex items-center gap-1 capitalize">
                      {booking.matchType === 'doubles' ? (
                        <span className="flex items-center -space-x-1.5">
                          <User className="w-3 h-3" />
                          <User className="w-3 h-3" />
                          <User className="w-3 h-3" />
                          <User className="w-3 h-3" />
                        </span>
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                      {' '}{booking.matchType}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold shadow border border-white/30 ${
                  idx === 0 ? 'bg-emerald-400/90 text-white' : 'bg-blue-400/90 text-white'
                }`}>
                  {booking.date}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4 bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                <Clock className="w-5 h-5 text-yellow-300" />
                <p className="text-white font-bold drop-shadow">{booking.time}</p>
              </div>
              <div className="flex items-center gap-2 mb-4 bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                <DollarSign className="w-5 h-5 text-green-300" />
                <p className="text-white font-semibold">
                  {booking.paid 
                    ? '$5.00 paid'
                    : 'Payment pending'
                  }
                </p>
                {!booking.paid && (
                  <button
                    onClick={() => {
                      // Mark as paid
                      const updatedBookings = myBookings.map(b =>
                        b.id === booking.id ? { ...b, paid: true } : b
                      )
                      setMyBookings(updatedBookings)
                      
                      // Send notification to admin
                      const adminNotification = {
                        id: Date.now(),
                        type: 'payment',
                        from: currentUser?.name || 'Member',
                        amount: '$5.00',
                        booking: `${booking.court} - ${booking.date} at ${booking.time}`,
                        timestamp: new Date().toISOString()
                      }
                      setPartnerNotifications([...partnerNotifications, adminNotification])
                      
                      showToast('✓ Payment confirmed! Admin has been notified.')
                    }}
                    className="ml-auto px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Pay
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {bookingTab === 'past' ? (
                  // Past bookings - no actions available
                  <div className="w-full py-3 bg-white/15 backdrop-blur-sm text-white/60 rounded-xl font-semibold text-sm text-center border border-white/20">
                    Completed
                  </div>
                ) : booking.paid ? (
                  <button 
                    onClick={() => {
                      // For court bookings, go back to time selection
                      const court = courts.find(c => c.name === booking.court)
                      setSelectedCourt(court)
                      setReschedulingBooking(booking)
                      setCurrentScreen('timeslot')
                    }}
                    className="w-full py-3 bg-white/25 backdrop-blur-sm text-white rounded-xl font-semibold text-sm hover:bg-white/35 transition-colors border border-white/30 flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Reschedule
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        // For court bookings, go back to time selection
                        const court = courts.find(c => c.name === booking.court)
                        setSelectedCourt(court)
                        setReschedulingBooking(booking)
                        setCurrentScreen('timeslot')
                      }}
                      className="flex-1 py-3 bg-white/25 backdrop-blur-sm text-white rounded-xl font-semibold text-sm hover:bg-white/35 transition-colors border border-white/30 flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Reschedule
                    </button>
                    <button 
                      onClick={() => setCancellingBooking(booking)}
                      className="flex-1 py-3 bg-red-500/80 backdrop-blur-sm text-white rounded-xl font-semibold text-sm hover:bg-red-600/80 transition-colors border border-white/30 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    {/* Cancel Booking Confirmation Modal */}
    {cancellingBooking && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">Cancel Booking?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking?
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  {cancellingBooking.court}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{cancellingBooking.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{cancellingBooking.time}</span>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800">
                ⚠️ This action cannot be undone. You'll need to book again if you change your mind.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCancellingBooking(null)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={() => {
                  setMyBookings(myBookings.filter(b => b.id !== cancellingBooking.id))
                  setCancellingBooking(null)
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
    )
  }

  // Find Partner Screen
  const PartnersScreen = () => {
    const [showPostForm, setShowPostForm] = useState(false)
    // selectedFilter is now partnerFilter at parent level
    const [postDate, setPostDate] = useState('')
    const [postTime, setPostTime] = useState('')
    const [postSkill, setPostSkill] = useState('Beginner')
    const [postMessage, setPostMessage] = useState('')
    
    // Filter partner requests based on selected filter
    const filteredPartners = partnerRequests.filter(partner => {
      if (partnerFilter === 'All') return true
      if (partnerFilter === 'This Week') {
        return partner.date === 'Tomorrow' || partner.date === 'Saturday' || partner.date === 'Sunday'
      }
      return partner.skill === partnerFilter
    })

    return (
      <>
      <div className="min-h-screen pb-20 relative overflow-hidden">
        {/* Blue/Cyan gradient like desktop */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="bg-blue-600/30 backdrop-blur-xl border-b border-white/20 shadow-lg p-4 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentScreen('home')} 
                  className="text-white font-bold hover:text-white/80 flex items-center gap-2"
                >
                  ← Back
                </button>
                <h2 className="font-bold text-xl text-white drop-shadow flex items-center gap-2">
                  <Users className="w-6 h-6" /> Find a Partner
                </h2>
              </div>
              <button 
                onClick={() => setShowPostForm(!showPostForm)}
                className="bg-white text-blue-700 p-2 rounded-xl hover:bg-white/90 transition-colors shadow-lg flex items-center gap-2 px-3"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-bold">Post</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['All', 'Beginner', 'Intermediate', 'Advanced', 'This Week'].map((filter, idx) => (
                <button
                  key={filter}
                  onClick={() => setPartnerFilter(filter)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap shadow flex items-center gap-2 transition-all ${
                    filter === partnerFilter
                      ? 'bg-white text-blue-700 scale-105'
                      : 'bg-white/20 backdrop-blur-sm text-white border border-white/20 hover:bg-white/30'
                  }`}
                >
                  {filter === partnerFilter && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Post Form */}
          {showPostForm && (
            <div className="p-4 bg-white/20 backdrop-blur-xl border-b-2 border-white/20 shadow-lg">
              <h3 className="font-bold text-white mb-4 drop-shadow flex items-center gap-2">
                <Plus className="w-5 h-5" /> Post a Request
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-5 h-5 text-white/70" />
                  <input
                    type="date"
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/25 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-5 h-5 text-white/70" />
                  <input
                    type="time"
                    value={postTime}
                    onChange={(e) => setPostTime(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/25 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <Trophy className="absolute left-3 top-3 w-5 h-5 text-white/70" />
                  <select 
                    value={postSkill}
                    onChange={(e) => setPostSkill(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/25 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  >
                    <option className="text-gray-800">Beginner</option>
                    <option className="text-gray-800">Intermediate</option>
                    <option className="text-gray-800">Advanced</option>
                  </select>
                </div>
                <textarea
                  value={postMessage}
                  onChange={(e) => setPostMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-white/25 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
                  rows={3}
                  placeholder="Message (optional)"
                />
                <button 
                  onClick={() => {
                    if (!postDate || !postTime) {
                      showToast('Please select a date and time', 'error')
                      return
                    }
                    
                    // Format date for display
                    const dateObj = new Date(postDate)
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                    const dayName = days[dateObj.getDay()]
                    const dateDisplay = dayName === days[new Date().getDay() + 1] ? 'Tomorrow' : dayName
                    
                    // Format time for display
                    const [hours, minutes] = postTime.split(':')
                    const hour = parseInt(hours)
                    const ampm = hour >= 12 ? 'pm' : 'am'
                    const displayHour = hour % 12 || 12
                    const timeDisplay = `${displayHour}${ampm}`
                    
                    // Create new partner request
                    const newRequest = {
                      id: Date.now(),
                      name: currentUser?.name || 'You',
                      skill: postSkill,
                      date: dateDisplay,
                      time: timeDisplay,
                      avatar: currentUser?.name.split(' ').map(n => n[0]).join('') || 'YO',
                      message: postMessage
                    }
                    
                    // Add to partner requests list
                    setPartnerRequests([newRequest, ...partnerRequests])
                    
                    // Show success modal
                    setPostedRequest({
                      date: dateDisplay,
                      time: timeDisplay,
                      skill: postSkill
                    })
                    
                    // Reset form
                    setPostDate('')
                    setPostTime('')
                    setPostSkill('Beginner')
                    setPostMessage('')
                    setShowPostForm(false)
                    
                    // Auto-close modal after 3s
                    setTimeout(() => setPostedRequest(null), 3000)
                  }}
                  disabled={!postDate || !postTime}
                  className={`w-full font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    postDate && postTime 
                      ? 'bg-white text-blue-700' 
                      : 'bg-white/50 text-blue-300 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  Post Request
                </button>
              </div>
            </div>
          )}

          {/* Partner Requests */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-semibold drop-shadow flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></span>
                {filteredPartners.length} players looking
              </p>
            </div>
            
            {filteredPartners.map((request) => (
              <div key={request.id} className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-white/40 to-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-blue-700 font-bold text-lg border-2 border-white/40 shadow-lg">
                      {request.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-white drop-shadow">{request.name}</p>
                      <p className="text-sm text-white/90 flex items-center gap-2">
                        <Trophy className="w-3 h-3" />
                        {request.skill}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-white/25 backdrop-blur-sm text-white px-3 py-1 rounded-full font-semibold border border-white/20 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {request.date}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-4 bg-white/15 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                  <Clock className="w-5 h-5 text-yellow-300" />
                  <p className="text-white font-semibold">{request.time}</p>
                </div>
                <button 
                  onClick={() => {
                    const newBooking = {
                      id: Date.now(),
                      type: 'partner',
                      partner: request.name,
                      skill: request.skill,
                      date: request.date,
                      time: request.time,
                      status: 'Requested'
                    }
                    setMyBookings([...myBookings, newBooking])
                    
                    // Send notification to the partner
                    const notification = {
                      id: Date.now(),
                      type: 'partner_request',
                      from: currentUser?.name || 'A member',
                      partnerName: request.name,
                      date: request.date,
                      time: request.time,
                      timestamp: new Date().toISOString()
                    }
                    setPartnerNotifications([...partnerNotifications, notification])
                    
                    // Show success modal
                    setSentRequest(request)
                    setTimeout(() => setSentRequest(null), 3000)
                  }}
                  className="w-full bg-white text-blue-700 font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Send Request
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Post Request Success Modal */}
      {postedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform animate-scale-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Posted! 🎾</h3>
              <p className="text-gray-600 mb-4">
                Your partner request is now live
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">{postedRequest.date}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">{postedRequest.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">{postedRequest.skill} Level</span>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-800">
                  <span className="font-semibold">✨ Your request is visible!</span> Other members can now see and join your session.
                </p>
              </div>
              
              <button
                onClick={() => setPostedRequest(null)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Send Request Success Modal */}
      {sentRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform animate-scale-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Request Sent! 📨</h3>
              <p className="text-gray-600 mb-4">
                Your request to <span className="font-bold text-blue-600">{sentRequest.name}</span> has been sent
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">{sentRequest.date}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">{sentRequest.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">{sentRequest.skill} Level</span>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-800">
                  <span className="font-semibold">📬 Notification sent!</span> {sentRequest.name} will be notified of your partner request.
                </p>
              </div>
              
              <button
                onClick={() => setSentRequest(null)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    )
  }

  // Leagues Screen - Shows matches from Club Schedule
  const LeaguesScreen = () => {
    const [selectedMatch, setSelectedMatch] = useState<any>(null)
    
    // Get all matches from clubEvents
    const matches = clubEvents.filter(e => e.type === 'match')
    
    // Group by upcoming vs past (simple date check)
    const upcomingMatches = matches // In production, filter by actual date comparison
    
    return (
      <div className="min-h-screen pb-20 relative overflow-hidden">
        {/* Orange gradient to match home page */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600" />
        
        <div className="relative z-10">
          <div className="bg-orange-600/30 backdrop-blur-xl border-b border-white/20 shadow-lg p-4 sticky top-0 z-10">
            <button 
              onClick={() => setCurrentScreen('home')} 
              className="text-white font-bold mb-3 hover:text-white/80"
            >
              ← Back to Home
            </button>
            <h2 className="font-bold text-2xl text-white drop-shadow">⚔️ Matches & Leagues</h2>
            <p className="text-white/70 text-sm">Inter-club and league matches</p>
          </div>
          
          <div className="px-4 py-6 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{matches.length}</p>
                <p className="text-white/80 text-xs">Total Matches</p>
              </div>
              <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{playerStats.wins}</p>
                <p className="text-white/80 text-xs">Your Wins</p>
              </div>
              <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{playerStats.currentStreak}</p>
                <p className="text-white/80 text-xs">{playerStats.streakType === 'win' ? '🔥 Win' : 'Loss'} Streak</p>
              </div>
            </div>
            
            {/* Upcoming Matches */}
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl p-4">
              <h3 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
                <span className="text-xl">📅</span> Upcoming Matches
              </h3>
              
              {upcomingMatches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">⚔️</div>
                  <p className="text-white font-semibold mb-1">No upcoming matches</p>
                  <p className="text-white/60 text-sm">Check Club Schedule for new events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMatches.map(match => (
                    <button
                      key={match.id}
                      onClick={() => setSelectedMatch(match)}
                      className="w-full text-left bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-4 hover:bg-white/30 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white text-lg">{match.title}</h4>
                          <p className="text-white/80">{match.opponent}</p>
                          <div className="flex items-center gap-3 mt-2 text-white/60 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {match.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {match.time}
                            </span>
                          </div>
                        </div>
                        <span className="text-3xl">{match.icon}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Link to Club Schedule */}
            <button
              onClick={() => setCurrentScreen('clubSchedule')}
              className="w-full py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              View Full Club Schedule
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Match Details Modal */}
        {selectedMatch && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedMatch.icon}</span>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">{selectedMatch.title}</h3>
                    <p className="text-gray-500">{selectedMatch.opponent}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMatch(null)}>
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-semibold text-gray-800">{selectedMatch.date}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-semibold text-gray-800">{selectedMatch.time}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-semibold text-gray-800">Mono Tennis Club</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedMatch(null)
                    setCurrentScreen('clubSchedule')
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
                >
                  RSVP in Schedule
                </button>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="py-3 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Messages Screen
  const MessagesScreen = () => {
    // openConversation tracks which chat thread is open (stores the other person's email as ID)
    const [replyMessageText, setReplyMessageText] = useState('')
    const [composingNew, setComposingNew] = useState(false)
    const [newMessageTo, setNewMessageTo] = useState('')
    const [newMessageText, setNewMessageText] = useState('')
    
    // Build conversations list - group by the OTHER person (not current user)
    const conversations = useMemo(() => {
      const convoMap = new Map()
      
      messages.forEach(msg => {
        // Determine who the "other" person is in this conversation
        const isFromMe = msg.fromEmail === currentUser?.email
        const otherEmail = isFromMe ? msg.to : msg.fromEmail
        const otherName = isFromMe ? (msg.toName || 'Member') : msg.from
        
        if (!convoMap.has(otherEmail)) {
          convoMap.set(otherEmail, {
            email: otherEmail,
            name: otherName,
            messages: [],
            unreadCount: 0
          })
        }
        
        const convo = convoMap.get(otherEmail)
        convo.messages.push({...msg, isFromMe})
        
        // Count unread messages that I received (not sent)
        if (!isFromMe && !msg.read) {
          convo.unreadCount++
        }
      })
      
      // Sort messages in each conversation by time (newest first for preview, oldest first for display)
      const convos = Array.from(convoMap.values())
      convos.forEach(c => {
        c.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        c.lastMessage = c.messages[c.messages.length - 1]
      })
      
      // Sort conversations by most recent message
      convos.sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime())
      
      return convos
    }, [messages, currentUser?.email])
    
    // Get selected conversation from email
    const selectedConvo = openConversation ? conversations.find(c => c.email === openConversation) : null
    
    // Mark messages as read when viewing a conversation (safeguard)
    useEffect(() => {
      if (openConversation && currentUser?.email) {
        setMessages(prev => prev.map(m => 
          m.fromEmail === openConversation && m.to === currentUser.email && !m.read
            ? {...m, read: true}
            : m
        ))
      }
    }, [openConversation, currentUser?.email])
    
    const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      if (days === 1) return 'Yesterday'
      if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' })
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    
    // Conversation Detail View
    if (selectedConvo) {
      return (
        <div className="min-h-screen pb-20 relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-violet-400 to-purple-400" />
          
          <div className="relative z-10 flex flex-col flex-1">
            {/* Header */}
            <div className="bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-lg p-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setOpenConversation(null)}
                  className="text-white font-bold hover:text-white/80"
                >
                  ← 
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedConvo.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedConvo.name}</h3>
                  <p className="text-white/60 text-xs">{selectedConvo.messages.length} messages</p>
                </div>
              </div>
            </div>
            
            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {selectedConvo.messages.map((msg, idx) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.isFromMe 
                      ? 'bg-white text-gray-800 rounded-br-md' 
                      : 'bg-white/20 backdrop-blur-sm text-white rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.isFromMe ? 'text-gray-400' : 'text-white/50'}`}>
                      {formatTimestamp(msg.timestamp)}
                      {msg.isFromMe && <span className="ml-1">✓</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Reply Input */}
            <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white/20 border-white/30'} backdrop-blur-xl border-t p-4`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyMessageText}
                  onChange={(e) => setReplyMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className={`flex-1 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    darkMode 
                      ? 'bg-slate-700 text-white placeholder-slate-400 border border-slate-600' 
                      : 'bg-white text-gray-800'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && replyMessageText.trim()) {
                      const reply = {
                        id: Date.now(),
                        from: currentUser?.name || 'You',
                        fromEmail: currentUser?.email || '',
                        to: selectedConvo.email,
                        toName: selectedConvo.name,
                        text: replyMessageText,
                        timestamp: new Date().toISOString(),
                        read: false
                      }
                      setMessages(prev => [...prev, reply])
                      setReplyMessageText('')
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (replyMessageText.trim()) {
                      const reply = {
                        id: Date.now(),
                        from: currentUser?.name || 'You',
                        fromEmail: currentUser?.email || '',
                        to: selectedConvo.email,
                        toName: selectedConvo.name,
                        text: replyMessageText,
                        timestamp: new Date().toISOString(),
                        read: false
                      }
                      setMessages(prev => [...prev, reply])
                      setReplyMessageText('')
                    }
                  }}
                  disabled={!replyMessageText.trim()}
                  className={`p-3 rounded-xl font-semibold transition-colors ${
                    replyMessageText.trim() 
                      ? (darkMode ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-blue-600 hover:bg-white/90')
                      : (darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-white/30 text-white/50 cursor-not-allowed')
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    // Conversations List View
    return (
      <div className="min-h-screen pb-20 relative overflow-hidden">
        {/* Purple gradient to match Club Schedule */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-violet-400 to-purple-400" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-lg p-4 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-2xl text-white drop-shadow flex items-center gap-2">
                  <MessageCircle className="w-7 h-7" />
                  Messages
                </h2>
                <p className="text-white/80 text-sm">
                  {conversations.reduce((a, c) => a + c.unreadCount, 0)} unread
                </p>
              </div>
              <button
                onClick={() => setComposingNew(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
          </div>
          
          <div className="px-4 py-4 space-y-3">
            {conversations.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-white font-semibold text-lg mb-2">No conversations yet</p>
                <p className="text-white/60 text-sm">Start a conversation with a club member!</p>
              </div>
            ) : (
              conversations.map((convo) => (
                <button
                  key={convo.email}
                  onClick={() => {
                    // Mark messages as read first
                    setMessages(prev => prev.map(m => 
                      m.fromEmail === convo.email && m.to === currentUser?.email
                        ? {...m, read: true}
                        : m
                    ))
                    // Then open the conversation
                    setOpenConversation(convo.email)
                  }}
                  className={`w-full text-left bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 transition-all hover:bg-white/30 ${
                    convo.unreadCount > 0 ? 'border-l-4 border-l-yellow-400' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {convo.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-semibold text-white ${convo.unreadCount > 0 ? 'font-bold' : ''}`}>
                          {convo.name}
                        </h4>
                        <span className="text-white/60 text-xs flex-shrink-0 ml-2">
                          {formatTimestamp(convo.lastMessage.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'text-white font-medium' : 'text-white/70'}`}>
                        {convo.lastMessage.isFromMe && <span className="text-white/50">You: </span>}
                        {convo.lastMessage.text}
                      </p>
                    </div>
                    {convo.unreadCount > 0 && (
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-800 flex-shrink-0">
                        {convo.unreadCount}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        
        {/* New Message Modal */}
        {composingNew && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl text-gray-800">New Message</h3>
                <button onClick={() => {
                  setComposingNew(false)
                  setNewMessageTo('')
                  setNewMessageText('')
                }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 block mb-2">To</label>
                <select
                  value={newMessageTo}
                  onChange={(e) => setNewMessageTo(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select a member...</option>
                  <option value="sarah.m@email.com">Sarah Mitchell</option>
                  <option value="mike.chen@email.com">Mike Chen</option>
                  <option value="emma.w@email.com">Emma Wilson</option>
                  <option value="david.p@email.com">David Park</option>
                  <option value="admin@monotennis.com">Club Admin</option>
                  <option value="coach@monotennis.com">John Smith (Coach)</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 block mb-2">Message</label>
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  🔒 Messages are private and secure within the club
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setComposingNew(false)
                    setNewMessageTo('')
                    setNewMessageText('')
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newMessageTo && newMessageText.trim()) {
                      const recipientName = {
                        'sarah.m@email.com': 'Sarah Mitchell',
                        'mike.chen@email.com': 'Mike Chen',
                        'emma.w@email.com': 'Emma Wilson',
                        'david.p@email.com': 'David Park',
                        'admin@monotennis.com': 'Club Admin',
                        'coach@monotennis.com': 'John Smith'
                      }[newMessageTo] || 'Member'
                      
                      const newMsg = {
                        id: Date.now(),
                        from: currentUser?.name || 'You',
                        fromEmail: currentUser?.email || '',
                        to: newMessageTo,
                        toName: recipientName,
                        text: newMessageText,
                        timestamp: new Date().toISOString(),
                        read: false
                      }
                      setMessages(prev => [...prev, newMsg])
                      showToast(`Message sent to ${recipientName}`)
                      setComposingNew(false)
                      setNewMessageTo('')
                      setNewMessageText('')
                    }
                  }}
                  disabled={!newMessageTo || !newMessageText.trim()}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    newMessageTo && newMessageText.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Club Schedule Screen
  const ClubScheduleScreen = () => {
    const [selectedCoach, setSelectedCoach] = useState<any>(null)
    const [hoverTimeout, setHoverTimeout] = useState<any>(null)
    // viewMode is now scheduleViewMode from parent level
    const [rsvpMatch, setRsvpMatch] = useState<any>(null)
    const [isEditingFood, setIsEditingFood] = useState(false)
    // foodInstructions, userRsvpStatus, and teamMembers are now at parent level
    const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<any>(null)
    const [showNotification, setShowNotification] = useState(false)
    const isAdmin = currentUser?.isAdmin || false
    
    const handleRSVP = (status: string) => {
      setUserRsvpStatus(status)
      
      // Add current user to team members list
      const currentUserName = currentUser?.name || 'You'
      const existingMemberIndex = teamMembers.findIndex(m => m.name === currentUserName)
      
      if (existingMemberIndex >= 0) {
        // Update existing RSVP
        const updated = [...teamMembers]
        updated[existingMemberIndex].status = status
        setTeamMembers(updated)
      } else {
        // Add new RSVP
        setTeamMembers([...teamMembers, { name: currentUserName, status }])
      }
    }
    
    const confirmedCount = teamMembers.filter(m => m.status === 'coming').length
    
    const coaches = [
      { id: 1, name: 'John Smith', specialty: 'Singles Strategy', rating: 4.9, experience: '15 years', certifications: 'PTR Certified' },
      { id: 2, name: 'Sarah Johnson', specialty: 'Doubles & Volleys', rating: 4.8, experience: '12 years', certifications: 'USPTA Certified' },
      { id: 3, name: 'Mike Chen', specialty: 'Junior Development', rating: 5.0, experience: '10 years', certifications: 'PTR & USPTA' },
    ]
    
    const handleCoachHover = (coachName: string) => {
      if (hoverTimeout) clearTimeout(hoverTimeout)
      const coach = coaches.find(c => c.name === coachName)
      if (coach) {
        setSelectedCoach(coach)
      }
    }
    
    const handleCoachLeave = () => {
      const timeout = setTimeout(() => {
        setSelectedCoach(null)
      }, 300)
      setHoverTimeout(timeout)
    }
    
    const sendCancellationNotification = () => {
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }
    
    return (
      <div className="min-h-screen pb-20 relative overflow-hidden">
        {/* Purple gradient background like home page */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-indigo-400 to-violet-400" />
        
        {/* Animated blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-10 w-72 h-72 bg-pink-300 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-40 left-10 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        
        <div className="relative z-10">
          <div className="bg-purple-700/30 backdrop-blur-xl border-b border-white/20 shadow-lg p-4 sticky top-0 z-10">
            <button 
              onClick={() => setCurrentScreen('home')} 
              className="text-white font-bold mb-3 hover:text-white/80"
            >
              ← Back to Home
            </button>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-2xl text-white drop-shadow flex items-center gap-2">
                <Calendar className="w-6 h-6" /> Club Schedule
              </h2>
              
              {/* View Toggle */}
              <button
                onClick={() => setScheduleViewMode(scheduleViewMode === 'list' ? 'calendar' : 'list')}
                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                {scheduleViewMode === 'list' ? (
                  <><Calendar className="w-4 h-4" /> Calendar View</>
                ) : (
                  <><Menu className="w-4 h-4" /> List View</>
                )}
              </button>
            </div>
          </div>
          
          {/* Book Court via ClubSpark */}
          <div className="px-4 pt-4">
            <button
              onClick={() => window.open('https://clubspark.ca/monotennisclub/Booking', '_blank')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-3 hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              <Calendar className="w-5 h-5" />
              Book a Court
              <span className="text-white/70 text-sm">→ ClubSpark</span>
            </button>
          </div>

          {scheduleViewMode === 'list' ? (
            // List View
            <div className="px-4 py-6 space-y-4">
              {clubEvents.map((event, idx) => (
              <div 
                key={idx} 
                onClick={() => event.type === 'match' && event.opponent && setRsvpMatch(event)}
                className={`bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-xl ${
                  event.type === 'match' && event.opponent ? 'cursor-pointer hover:bg-white/30 transition-all' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-3 rounded-xl ${
                      event.type === 'match' ? 'bg-red-500/50' :
                      'bg-orange-500/50'
                    } backdrop-blur-sm border border-white/30`}>
                      <span className="text-2xl">
                        {event.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white drop-shadow">{event.title}</h3>
                      {event.coach && (
                        <button
                          onClick={() => handleCoachHover(event.coach)}
                          onMouseEnter={() => handleCoachHover(event.coach)}
                          onMouseLeave={handleCoachLeave}
                          className="text-sm text-white/90 underline hover:text-white cursor-pointer"
                        >
                          with {event.coach}
                        </button>
                      )}
                      {event.opponent && <p className="text-sm text-white/90">{event.opponent}</p>}
                      {event.details && <p className="text-sm text-white/80 italic">{event.details}</p>}
                    </div>
                  </div>
                  <span className="bg-white/90 text-purple-700 text-xs px-3 py-1 rounded-full font-bold">
                    {event.date}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">{event.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            // Calendar View
            <div className="px-4 py-6">
              <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-4 mb-4">
                <h3 className="text-white font-bold text-lg mb-4">January 2026</h3>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-white/60 text-xs font-semibold py-2">{day}</div>
                  ))}
                  
                  {/* Calendar days - simplified for January 2026 */}
                  {[...Array(31)].map((_, idx) => {
                    const day = idx + 1
                    const dayEvents = clubEvents.filter(e => {
                      const eventDay = parseInt(e.date.split(' ')[2]) || 0
                      return eventDay === day
                    })
                    
                    return (
                      <div key={day} className={`min-h-[80px] p-2 rounded-lg ${
                        dayEvents.length > 0 ? 'bg-white/30' : 'bg-white/10'
                      } border border-white/20`}>
                        <div className="text-white text-xs font-bold mb-1">{day}</div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedCalendarEvent(event)}
                              className={`w-full text-left text-[8px] px-1 py-0.5 rounded text-white truncate font-semibold hover:opacity-80 transition-opacity cursor-pointer ${
                              event.type === 'match' ? 'bg-red-500/80' :
                              'bg-orange-500/80'
                            }`}>
                              {event.icon} {event.time.split(' ')[0]}
                            </button>
                          ))}
                          {dayEvents.length > 2 && (
                            <button
                              onClick={() => setSelectedCalendarEvent(dayEvents[2])}
                              className="text-[8px] text-white/80 hover:text-white cursor-pointer"
                            >
                              +{dayEvents.length - 2}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Legend */}
              <div className={`${darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/20 border-white/30'} backdrop-blur-xl border rounded-xl p-4`}>
                <h4 className="text-white font-semibold mb-3 text-sm">Legend</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎓</span>
                    <span className="text-white">Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚔️</span>
                    <span className="text-white">Matches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎉</span>
                    <span className="text-white">Socials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎾</span>
                    <span className="text-white">Court Bookings</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coach Profile Popup */}
          {selectedCoach && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
              onClick={() => setSelectedCoach(null)}
            >
              <div 
                className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  if (hoverTimeout) {
                    clearTimeout(hoverTimeout)
                    setHoverTimeout(null)
                  }
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => {
                    setSelectedCoach(null)
                  }, 300)
                  setHoverTimeout(timeout)
                }}
              >
                <button 
                  onClick={() => setSelectedCoach(null)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedCoach.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">{selectedCoach.name}</h3>
                    <p className="text-sm text-gray-600">{selectedCoach.specialty}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-700">Rating: {selectedCoach.rating}/5.0</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-700">{selectedCoach.experience}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">{selectedCoach.certifications}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Calendar Event Popup */}
          {selectedCalendarEvent && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">{selectedCalendarEvent.title}</h3>
                    {selectedCalendarEvent.coach && (
                      <button
                        onClick={() => handleCoachHover(selectedCalendarEvent.coach)}
                        onMouseEnter={() => handleCoachHover(selectedCalendarEvent.coach)}
                        onMouseLeave={handleCoachLeave}
                        className="text-sm text-gray-600 underline hover:text-gray-800 cursor-pointer"
                      >
                        with {selectedCalendarEvent.coach}
                      </button>
                    )}
                    {selectedCalendarEvent.opponent && (
                      <p className="text-sm text-gray-600 mt-1">{selectedCalendarEvent.opponent}</p>
                    )}
                  </div>
                  <button onClick={() => setSelectedCalendarEvent(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">{selectedCalendarEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">{selectedCalendarEvent.time}</span>
                  </div>
                </div>
                
                {selectedCalendarEvent.details && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-700">{selectedCalendarEvent.details}</p>
                  </div>
                )}
                
                {selectedCalendarEvent.type === 'match' && (
                  <button
                    onClick={() => {
                      setRsvpMatch(selectedCalendarEvent)
                      setSelectedCalendarEvent(null)
                    }}
                    className="w-full py-3 bg-mono-green-500 text-white rounded-xl font-semibold hover:bg-mono-green-600 transition-colors"
                  >
                    RSVP for Match
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Inter Club RSVP Popup */}
          {rsvpMatch && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">{rsvpMatch.title}</h3>
                    <p className="text-sm text-gray-600">{rsvpMatch.opponent}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setRsvpMatch(null)
                    }} 
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">{rsvpMatch.date} at {rsvpMatch.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Team Captain: Sarah Wilson</span>
                  </div>
                </div>
                
                {/* RSVP Status */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Will you attend?</h4>
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRSVP('coming')
                      }}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                        userRsvpStatus === 'coming' 
                          ? 'bg-green-600 text-white ring-4 ring-green-300 scale-105' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      ✓ Yes, I'm Coming
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRSVP('not-coming')
                      }}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                        userRsvpStatus === 'not-coming' 
                          ? 'bg-red-600 text-white ring-4 ring-red-300 scale-105' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      ✗ Can't Make It
                    </button>
                  </div>
                  {userRsvpStatus && (
                    <p className="text-center text-sm text-green-600 font-semibold mt-2">
                      ✓ RSVP Recorded!
                    </p>
                  )}
                </div>
                
                {/* Who's Coming */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Team Members ({confirmedCount}/{teamMembers.length} confirmed)
                  </h4>
                  <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                    {teamMembers.map((member, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-gray-700">{member.name}</span>
                        <span className={`font-semibold ${
                          member.status === 'coming' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {member.status === 'coming' ? '✓ Coming' : '✗ Not Coming'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Admin: What to Bring */}
                <div className="bg-purple-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    🍽️ Post-Match Clubhouse
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">Please bring items for social after the match:</p>
                  
                  {isEditingFood ? (
                    <div className="space-y-3">
                      <textarea
                        value={foodInstructions}
                        onChange={(e) => setFoodInstructions(e.target.value)}
                        className="w-full p-3 text-sm text-gray-700 border border-purple-300 rounded-lg"
                        rows={5}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsEditingFood(false)
                          }}
                          className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsEditingFood(false)
                            // Save to backend in production
                          }}
                          className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 text-sm text-gray-700 whitespace-pre-line">
                        {foodInstructions}
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsEditingFood(true)
                          }}
                          className="text-xs text-purple-600 underline mt-2 hover:text-purple-700 cursor-pointer"
                        >
                          Admin: Edit instructions
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Admin: Send Notification */}
                {isAdmin && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      📢 Admin Actions
                    </h4>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        sendCancellationNotification()
                      }}
                      className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                    >
                      🚨 Notify Team: Match Cancelled/Changed
                    </button>
                    <p className="text-xs text-gray-600 mt-2">
                      Sends notification to all team members who RSVP'd
                    </p>
                  </div>
                )}
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setRsvpMatch(null)
                  }}
                  className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                
                {/* Notification Success Toast */}
                {showNotification && (
                  <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl animate-slide-up">
                    ✓ Notification sent to team members!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Tournaments Screen
  const TournamentsScreen = () => {
    const [selectedTournament, setSelectedTournament] = useState<any>(null)
    
    const tournaments = [
      { 
        id: 1, 
        name: 'Spring Singles Championship',
        date: 'March 15-17, 2026',
        entryFee: 45,
        spots: 32,
        registered: 24,
        format: 'Single Elimination',
        prize: 'Trophy + $500',
        skill: 'Open'
      },
      { 
        id: 2, 
        name: 'Doubles Masters',
        date: 'April 5-7, 2026',
        entryFee: 80,
        spots: 16,
        registered: 12,
        format: 'Round Robin + Playoffs',
        prize: 'Trophy + $800',
        skill: 'Advanced'
      },
      { 
        id: 3, 
        name: 'Junior Development Cup',
        date: 'May 10-11, 2026',
        entryFee: 25,
        spots: 24,
        registered: 18,
        format: 'Single Elimination',
        prize: 'Trophy + Medals',
        skill: 'U18'
      },
    ]
    
    return (
      <div className="min-h-screen pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-400 to-red-400" />
        
        <div className="relative z-10">
          <div className="bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-lg p-4 sticky top-0 z-10">
            <button 
              onClick={() => setCurrentScreen('home')} 
              className="text-white font-bold mb-3 hover:text-white/80"
            >
              ← Back to Home
            </button>
            <h2 className="font-bold text-2xl text-white drop-shadow flex items-center gap-2">
              <Trophy className="w-6 h-6" /> Tournaments
            </h2>
          </div>

          <div className="px-4 py-6 space-y-4">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-white drop-shadow mb-1">{tournament.name}</h3>
                    <p className="text-white/90 text-sm">{tournament.date}</p>
                  </div>
                  <span className="bg-yellow-400/90 text-gray-800 text-xs px-3 py-1 rounded-full font-bold">
                    {tournament.skill}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                    <p className="text-white/80 text-xs mb-1">Entry Fee</p>
                    <p className="text-white font-bold text-lg">${tournament.entryFee}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                    <p className="text-white/80 text-xs mb-1">Spots</p>
                    <p className="text-white font-bold text-lg">{tournament.registered}/{tournament.spots}</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 mb-4">
                  <p className="text-white text-sm"><strong>Format:</strong> {tournament.format}</p>
                  <p className="text-white text-sm"><strong>Prize:</strong> {tournament.prize}</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedTournament(tournament)}
                    className="flex-1 py-3 bg-white/25 backdrop-blur-sm text-white rounded-xl font-semibold text-sm hover:bg-white/35 transition-colors border border-white/30"
                  >
                    View Draw
                  </button>
                  <button className="flex-1 py-3 bg-green-500/80 backdrop-blur-sm text-white rounded-xl font-semibold text-sm hover:bg-green-600/80 transition-colors border border-white/30">
                    Register Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Confirmation Popup
  const ConfirmationPopup = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-bounce-subtle">
        <div className="w-20 h-20 bg-mono-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed! 🎾</h3>
        <p className="text-gray-600 mb-4">Payment processed successfully</p>
        <p className="text-sm text-gray-500">See you on the court!</p>
        <div className="text-4xl mt-4">✨🎉✨</div>
      </div>
    </div>
  )

  // Bottom Navigation
  const BottomNav = () => (
    <div className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border-t px-2 py-3 flex justify-around shadow-lg z-40`}>
      <button
        onClick={() => setCurrentScreen('home')}
        className={`${currentScreen === 'home' 
          ? `flex flex-col items-center gap-1 ${darkMode ? 'text-orange-500' : 'text-mono-green-600'} font-semibold`
          : `flex flex-col items-center gap-1 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-mono-green-600'}`} transition-all duration-200 hover:-translate-y-0.5`}
      >
        <Home className="w-5 h-5" />
        <span className="text-xs font-medium">Home</span>
      </button>
      <button
        onClick={() => window.open('https://clubspark.ca/monotennisclub/Booking', '_blank')}
        className={`flex flex-col items-center gap-1 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-mono-green-600'} transition-all duration-200 hover:-translate-y-0.5`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-xs font-medium">Book</span>
      </button>
      <button
        onClick={() => setCurrentScreen('clubSchedule')}
        className={`${currentScreen === 'clubSchedule' 
          ? `flex flex-col items-center gap-1 ${darkMode ? 'text-orange-500' : 'text-mono-green-600'} font-semibold`
          : `flex flex-col items-center gap-1 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-mono-green-600'}`} transition-all duration-200 hover:-translate-y-0.5`}
      >
        <Clock className="w-5 h-5" />
        <span className="text-xs font-medium">Schedule</span>
      </button>
      <button
        onClick={() => setCurrentScreen('partners')}
        className={`${currentScreen === 'partners' 
          ? `flex flex-col items-center gap-1 ${darkMode ? 'text-orange-500' : 'text-mono-green-600'} font-semibold`
          : `flex flex-col items-center gap-1 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-mono-green-600'}`} transition-all duration-200 hover:-translate-y-0.5`}
      >
        <Users className="w-5 h-5" />
        <span className="text-xs font-medium">Partners</span>
      </button>
      <button
        onClick={() => setCurrentScreen('messages')}
        className={`${currentScreen === 'messages' 
          ? `flex flex-col items-center gap-1 ${darkMode ? 'text-orange-500' : 'text-mono-green-600'} font-semibold`
          : `flex flex-col items-center gap-1 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-mono-green-600'}`} transition-all duration-200 hover:-translate-y-0.5 relative`}
      >
        <MessageCircle className="w-5 h-5" />
        {unreadMessageCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadMessageCount}
          </span>
        )}
        <span className="text-xs font-medium">Messages</span>
      </button>
    </div>
  )

  // Helper function
  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour >= 4 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    return 'evening'
  }

  // Main render
  return (
    <div className={`max-w-md mx-auto shadow-2xl min-h-screen relative overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Tennis Confetti Celebration */}
      <TennisConfetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Dark Mode Warning Banner - only show if browser forces dark mode AND user hasn't enabled dark mode */}
      {browserDarkModeDetected && !darkModeWarningDismissed && !darkMode && currentUser && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 shadow-lg">
          <div className="max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌙</span>
              <div className="flex-1">
                <p className="font-bold text-sm">Dark Mode Detected</p>
                <p className="text-xs text-white/90 mt-1">
                  Your browser is applying dark mode. You can enable Dark Mode in Settings for the best experience, or disable browser dark mode.
                </p>
                <p className="text-xs text-white/80 mt-2">
                  <strong>Tip:</strong> Go to Settings → Appearance → Dark Mode
                </p>
              </div>
              <button 
                onClick={() => {
                  setDarkModeWarningDismissed(true)
                  localStorage.setItem('darkModeWarningDismissed', 'true')
                }}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'signup' && <SignupScreen />}
      {currentScreen === 'home' && currentUser && (
        <div className="tab-content">
          <HomeScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'book' && currentUser && (
        <div className="tab-content">
          <BookingScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'timeslot' && currentUser && (
        <div className="tab-content">
          <TimeSlotScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'confirm' && currentUser && (
        <div className="tab-content">
          <ConfirmScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'clubSchedule' && currentUser && (
        <div className="tab-content">
          <ClubScheduleScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'tournaments' && currentUser && (
        <div className="tab-content">
          <TournamentsScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'bookings' && currentUser && (
        <div className="tab-content">
          <MyBookingsScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'partners' && currentUser && (
        <div className="tab-content">
          <PartnersScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'messages' && currentUser && (
        <div className="tab-content">
          <MessagesScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'profile' && currentUser && (
        <div className="tab-content">
          <ProfileScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'settings' && currentUser && (
        <div className="tab-content">
          <SettingsScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'admin' && currentUser && (
        <div className="tab-content">
          <AdminScreen />
          <BottomNav />
        </div>
      )}
      {currentScreen === 'leagues' && currentUser && (
        <>
          <LeaguesScreen />
          <BottomNav />
        </>
      )}
      {showConfirmation && <ConfirmationPopup />}
      
      {/* Pro Shop Modal */}
      {showProShopModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-gray-800">🛒 Pro Shop</h3>
              <button onClick={() => { setShowProShopModal(false); setCart([]) }}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {proShopItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.price === 0 ? 'Free (demo)' : `$${item.price}`}
                      {item.perDay && ' per day'}
                      <span className="ml-2 text-green-600">{item.stock} in stock</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const existing = cart.find(c => c.id === item.id)
                      if (existing) {
                        setCart(cart.map(c => c.id === item.id ? {...c, qty: c.qty + 1} : c))
                      } else {
                        setCart([...cart, {...item, qty: 1}])
                      }
                      showToast(`Added ${item.name} to cart`)
                    }}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
            
            {cart.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-800">Cart ({cart.reduce((a, b) => a + b.qty, 0)} items)</span>
                  <span className="font-bold text-lg text-gray-800">${cart.reduce((a, b) => a + (b.price * b.qty), 0)}</span>
                </div>
                <button
                  onClick={() => {
                    // Create order
                    const order = {
                      id: Date.now(),
                      user: currentUser?.name || 'Member',
                      items: cart.map(c => ({name: c.name, qty: c.qty, price: c.price})),
                      total: cart.reduce((a, b) => a + (b.price * b.qty), 0),
                      timestamp: new Date().toISOString(),
                      status: 'pending'
                    }
                    setProShopOrders([order, ...proShopOrders])
                    
                    // Add notification for admin
                    setPartnerNotifications([...partnerNotifications, {
                      type: 'pro_shop_order',
                      from: currentUser?.name || 'Member',
                      items: cart.length,
                      total: cart.reduce((a, b) => a + (b.price * b.qty), 0),
                      orderId: order.id
                    }])
                    
                    showToast('Order placed! Pay at the front desk.')
                    setCart([])
                    setShowProShopModal(false)
                  }}
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Ball Machine Modal */}
      {showBallMachineModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-gray-800">🎾 Ball Machine</h3>
              <button onClick={() => setShowBallMachineModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">📍 Located at Court 4</p>
              <p className="text-yellow-700 text-sm mt-1">Free for members • 1 hour slots</p>
            </div>
            
            <div className="mb-4">
              <p className="font-semibold text-gray-700 mb-2">Select Time Slot:</p>
              <div className="grid grid-cols-2 gap-2">
                {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map(time => (
                  <button
                    key={time}
                    onClick={() => {
                      setBallMachineBookings([...ballMachineBookings, { time, date: 'Today', user: currentUser?.name }])
                      showToast(`Ball machine booked for ${time}`)
                      setShowBallMachineModal(false)
                    }}
                    className="py-2 px-3 bg-gray-100 rounded-lg text-gray-800 hover:bg-green-100 hover:text-green-700 transition-colors"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-gray-700 text-sm mb-2">Instructions:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Turn on power switch on the left side</li>
                <li>• Adjust speed dial (1-10)</li>
                <li>• Load balls into hopper (max 150)</li>
                <li>• Press green start button</li>
                <li>• Please clean up balls when done!</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Anonymous Rating Modal */}
      {showRatingModal && currentRating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-gray-800">Rate Your Experience</h3>
              <button onClick={() => { setShowRatingModal(false); setCurrentRating(null) }}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-sm">
                🔒 <strong>100% Anonymous</strong> - Your rating helps improve the club experience. 
                The member will only see their average rating, never who rated them.
              </p>
            </div>
            
            <p className="text-gray-600 mb-4">
              How was your {currentRating.odType === 'doubles_partner' ? 'doubles match' : 'game'} with <strong>{currentRating.odName}</strong> on {currentRating.odDate}?
            </p>
            
            <div className="space-y-3 mb-4">
              {[
                { label: 'Friendly & Respectful', key: 'friendly' },
                { label: 'On Time', key: 'punctual' },
                { label: 'Good Sport', key: 'sportsmanship' },
              ].map(criteria => (
                <div key={criteria.key} className="flex items-center justify-between">
                  <span className="text-gray-700">{criteria.label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setCurrentRating({...currentRating, [criteria.key]: star})}
                        className={`text-2xl ${(currentRating[criteria.key] || 0) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setPendingRatings(pendingRatings.filter(r => r.odId !== currentRating.odId))
                showToast('Thanks for your anonymous feedback!')
                setShowRatingModal(false)
                setCurrentRating(null)
              }}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
            >
              Submit Anonymous Rating
            </button>
          </div>
        </div>
      )}
      
      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-gray-800">Add New Item</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="e.g., Tennis Balls (Can of 3)"
                  className="w-full p-3 border border-gray-300 rounded-xl mt-1 text-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Price ($)</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 border border-gray-300 rounded-xl mt-1 text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Stock</label>
                  <input
                    type="number"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})}
                    className="w-full p-3 border border-gray-300 rounded-xl mt-1 text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl mt-1 text-gray-800"
                >
                  <option value="balls">Balls</option>
                  <option value="accessories">Accessories</option>
                  <option value="apparel">Apparel</option>
                  <option value="demo">Demo Equipment</option>
                  <option value="drinks">Drinks & Snacks</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newItem.name.trim()) {
                    setProShopItems(prev => [...prev, { ...newItem, id: Date.now() }])
                    showToast('Item added!')
                    setNewItem({ name: '', price: 0, stock: 0, category: 'accessories' })
                    setShowAddItemModal(false)
                  }
                }}
                disabled={!newItem.name.trim()}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:bg-gray-300"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Item Modal */}
      {showEditItemModal && editingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-gray-800">Edit Item</h3>
              <button onClick={() => { setShowEditItemModal(false); setEditingItem(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl mt-1 text-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Price ($)</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 border border-gray-300 rounded-xl mt-1 text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Stock</label>
                  <input
                    type="number"
                    value={editingItem.stock}
                    onChange={(e) => setEditingItem({...editingItem, stock: parseInt(e.target.value) || 0})}
                    className="w-full p-3 border border-gray-300 rounded-xl mt-1 text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl mt-1 text-gray-800"
                >
                  <option value="balls">Balls</option>
                  <option value="accessories">Accessories</option>
                  <option value="apparel">Apparel</option>
                  <option value="demo">Demo Equipment</option>
                  <option value="drinks">Drinks & Snacks</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setShowEditItemModal(false); setEditingItem(null) }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setProShopItems(prev => prev.map(i => i.id === editingItem.id ? editingItem : i))
                  showToast('Item updated!')
                  setShowEditItemModal(false)
                  setEditingItem(null)
                }}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white`}>
            <span className="text-xl">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className="font-semibold">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-2 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Demo: Quick User Switcher (for testing) */}
      {currentUser && (
        <>
          <button
            onClick={() => setShowUserSwitcher(!showUserSwitcher)}
            className="fixed bottom-24 right-4 z-50 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg flex items-center justify-center text-white font-bold hover:scale-110 transition-transform"
            title="Quick User Switcher (Demo)"
          >
            👤
          </button>
          
          {showUserSwitcher && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xl text-gray-800">Quick Switch User</h3>
                  <button
                    onClick={() => setShowUserSwitcher(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mb-4">Demo feature for testing multi-user functionality</p>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setCurrentUser({ name: 'Admin User', email: 'admin@monotennis.com', isAdmin: true, isCoach: false })
                      setCurrentScreen('home')
                      setShowUserSwitcher(false)
                    }}
                    className="w-full p-3 bg-red-50 border-2 border-red-200 rounded-lg text-left hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👑</span>
                      <div>
                        <p className="font-semibold text-gray-800">Admin User</p>
                        <p className="text-xs text-gray-500">admin@monotennis.com</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setCurrentUser({ name: 'John Smith', email: 'coach@monotennis.com', isAdmin: false, isCoach: true })
                      setCurrentScreen('home')
                      setShowUserSwitcher(false)
                    }}
                    className="w-full p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎾</span>
                      <div>
                        <p className="font-semibold text-gray-800">John Smith (Coach)</p>
                        <p className="text-xs text-gray-500">coach@monotennis.com</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setCurrentUser({ name: 'Alex Johnson', email: 'alex@monotennis.com', isAdmin: false, isCoach: false })
                      setCurrentScreen('home')
                      setShowUserSwitcher(false)
                    }}
                    className="w-full p-3 bg-purple-50 border-2 border-purple-200 rounded-lg text-left hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👤</span>
                      <div>
                        <p className="font-semibold text-gray-800">Alex Johnson (Member)</p>
                        <p className="text-xs text-gray-500">alex@monotennis.com</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setCurrentUser({ name: 'Club President', email: 'president@monotennis.com', isAdmin: true, isCoach: false })
                      setCurrentScreen('home')
                      setShowUserSwitcher(false)
                    }}
                    className="w-full p-3 bg-green-50 border-2 border-green-200 rounded-lg text-left hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👑</span>
                      <div>
                        <p className="font-semibold text-gray-800">Club President</p>
                        <p className="text-xs text-gray-500">president@monotennis.com</p>
                      </div>
                    </div>
                  </button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Currently logged in as: <span className="font-semibold">{currentUser?.name}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

