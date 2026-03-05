/* config.js - MTC Court Configuration */
// ============================================
// All configurable values in one place.
// Loaded after utils.js, before all other files.
// ============================================

/**
 * Application configuration constants.
 * @namespace MTC.config
 * @property {Array<{id: number, name: string, floodlight: boolean}>} courts - Court definitions
 * @property {string[]} timeSlots - Available booking time slots
 * @property {Object<number, {close: string}>} courtHours - Court operating hours keyed by court ID
 * @property {Object<string, {label: string, color: string, textColor: string}>} eventTypes - Event type display config
 * @property {string} headCoach - Head coach name
 * @property {{booking: number, guest: number, tabWarning: number, tabBlock: number, cancelWindowHours: number}} fees - Fee structure
 * @property {{lat: number, lon: number, name: string}} club - Club location coordinates and name
 * @property {string[]} guestAllowedScreens - Screens accessible without membership
 * @property {string[]} dayNamesShort - Abbreviated day names (Sun-Sat)
 * @property {string[]} dayNamesFull - Full day names (Sunday-Saturday)
 * @property {string[]} monthNamesShort - Abbreviated month names (Jan-Dec)
 * @property {string[]} monthNamesFull - Full month names (January-December)
 */
MTC.config = {
  // Court definitions
  courts: [
    { id: 1, name: 'Court 1', floodlight: true },
    { id: 2, name: 'Court 2', floodlight: true },
    { id: 3, name: 'Court 3', floodlight: false },
    { id: 4, name: 'Court 4', floodlight: false }
  ],

  // Available booking time slots (must match dashboard TIME_SLOTS — 12h AM/PM format)
  timeSlots: [
    '9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM',
    '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM',
    '4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM',
    '7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM'
  ],

  // Court operating hours (close time)
  // Courts 1&2: bookable 9:30 AM - 10:00 PM (lights out 11 PM)
  // Courts 3&4: bookable 9:30 AM - 8:00 PM (no lights)
  courtHours: {
    1: { close: '22:00' },
    2: { close: '22:00' },
    3: { close: '20:00' },
    4: { close: '20:00' }
  },

  // Event type definitions with colors
  eventTypes: {
    singles:    { label: 'Singles',        color: '#4CAF50', textColor: '#fff' },
    doubles:    { label: 'Doubles',        color: '#c8ff00', textColor: '#000' },
    social:     { label: 'Social',         color: '#ff5a5f', textColor: '#fff' },
    roundrobin: { label: 'Round Robin',    color: '#ff5a5f', textColor: '#fff' },
    drills:     { label: 'Drills/Clinic',  color: '#00d4ff', textColor: '#000' },
    lesson:     { label: 'Lesson',         color: '#9C27B0', textColor: '#fff' },
    openplay:   { label: 'Open Play',      color: '#FF9800', textColor: '#000' },
    reserved:   { label: 'Reserved',       color: '#757575', textColor: '#fff' },
    mybooking:  { label: 'My Booking',     color: '#c8ff00', textColor: '#000' }
  },

  // Head coach
  headCoach: 'Mark Taylor',

  // Fee structure
  fees: {
    booking: 0,           // Free for members
    guest: 10,            // $10 when bringing a guest
    tabWarning: 20,       // Nudge to pay at $20
    tabBlock: 30,         // Block bookings at $30
    cancelWindowHours: 24 // Free cancel window
  },

  // Club location
  club: {
    lat: 44.0167,
    lon: -80.0667,
    name: 'MONO, ONTARIO'
  },

  // Screens guests can access without membership
  guestAllowedScreens: ['book', 'programs'],

  // Date formatting arrays
  dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  dayNamesFull: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  monthNamesFull: ['January','February','March','April','May','June','July','August','September','October','November','December']
};

// ============================================
// BACKWARD-COMPAT ALIASES
// Other files reference these globals directly.
// Will be removed after IIFE wrapping (Phase 2).
// ============================================
const COURTS = MTC.config.courts;
const timeSlots = MTC.config.timeSlots;
const COURT_HOURS = MTC.config.courtHours;
const EVENT_TYPES = MTC.config.eventTypes;
const HEAD_COACH = MTC.config.headCoach;
const BOOKING_FEE = MTC.config.fees.booking;
const GUEST_FEE = MTC.config.fees.guest;
const TAB_WARNING_THRESHOLD = MTC.config.fees.tabWarning;
const TAB_BLOCK_THRESHOLD = MTC.config.fees.tabBlock;
const CANCEL_WINDOW_HOURS = MTC.config.fees.cancelWindowHours;
const GUEST_ALLOWED_SCREENS = MTC.config.guestAllowedScreens;
