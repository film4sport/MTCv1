(function() {
  'use strict';
  /* events.js - MTC Court */
  // ============================================
  // CLUB EVENTS SYSTEM
  // ============================================

  const eventsCalendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Load persisted RSVPs or use defaults
  const userRsvps = (function() {
    return MTC.storage.get('mtc-user-rsvps', ['mens-round-robin', 'friday-mixed']);
  })();

  function saveUserRsvps() {
    MTC.storage.set('mtc-user-rsvps', userRsvps);
  }

  // Illustrated avatar SVGs for diverse representation
  const avatarSvgs = {
    'user': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#c8ff00"/><circle cx="20" cy="15" r="8" fill="#2d2d2d"/><path d="M8 35c0-7 5-12 12-12s12 5 12 12" fill="#2d2d2d"/><circle cx="20" cy="15" r="6" fill="#f4c7a0"/><path d="M14 14c0 0 2-4 6-4s6 4 6 4" fill="#2d2d2d"/></svg>',
    // East Asian man - black hair, warm skin tone
    'mike': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#4ECDC4"/><circle cx="20" cy="16" r="9" fill="#e8b89a"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#2563eb"/><path d="M11 12c0-5 4-8 9-8s9 3 9 8c0 2-1 3-2 4h-14c-1-1-2-2-2-4z" fill="#1a1a1a"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Light-skinned woman - brown hair
    'sarah': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#FF6B9D"/><circle cx="20" cy="16" r="9" fill="#fce5d8"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#ec4899"/><path d="M9 14c0 0 1-10 11-10s11 10 11 10c0 0-3 4-11 4s-11-4-11-4z" fill="#8B4513"/><path d="M9 14c0 0 2 3 11 3s11-3 11-3" fill="#8B4513"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#c97878" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Black man - dark skin, short hair
    'james': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#F97316"/><circle cx="20" cy="16" r="9" fill="#8B5A2B"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#dc2626"/><path d="M12 11c0-3 3-6 8-6s8 3 8 6c0 1 0 2-1 3h-14c-1-1-1-2-1-3z" fill="#1a1a1a"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#5c3d2e" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Latina woman - tan skin, dark hair
    'emily': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#A855F7"/><circle cx="20" cy="16" r="9" fill="#d4a574"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#7c3aed"/><path d="M8 16c0 0 2-12 12-12s12 12 12 12c0 0-4 3-12 3s-12-3-12-3z" fill="#2d1f1a"/><path d="M8 16c0 0 3 2 12 2s12-2 12-2" fill="#2d1f1a"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#a67c5b" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // East Asian man - black hair, warm skin
    'david': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#06B6D4"/><circle cx="20" cy="16" r="9" fill="#e8c4a0"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#0891b2"/><path d="M12 10c0-4 3-6 8-6s8 2 8 6c0 2-1 4-2 5h-12c-1-1-2-3-2-5z" fill="#1a1a1a"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Light-skinned woman - blonde hair
    'lisa': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#FBBF24"/><circle cx="20" cy="16" r="9" fill="#fce5d8"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#f59e0b"/><path d="M8 15c0 0 2-11 12-11s12 11 12 11c0 0-4 3-12 3s-12-3-12-3z" fill="#D4A03A"/><path d="M8 15c0 0 3 2 12 2s12-2 12-2" fill="#D4A03A"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#c97878" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // White man - red hair
    'ryan': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#22C55E"/><circle cx="20" cy="16" r="9" fill="#fce5d8"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#16a34a"/><path d="M12 10c0-4 3-6 8-6s8 2 8 6c0 2-1 4-2 5h-12c-1-1-2-3-2-5z" fill="#C65D3B"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#c97878" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Coach - professional with polo
    'coach': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#EAB308"/><circle cx="20" cy="16" r="9" fill="#d4a574"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#1a1a1a"/><path d="M12 11c0-3 3-5 8-5s8 2 8 5c0 2-1 3-2 4h-12c-1-1-2-2-2-4z" fill="#2d2d2d"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#8B5A2B" stroke-width="1.5" stroke-linecap="round"/><text x="20" y="38" text-anchor="middle" fill="#c8ff00" font-size="8" font-weight="bold">\uD83C\uDFC6</text></svg>',
    // MTC Board Members
    // Kelly - woman, light brown hair
    'kelly': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#10B981"/><circle cx="20" cy="16" r="9" fill="#fce5d8"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#059669"/><path d="M9 14c0 0 1-10 11-10s11 10 11 10c0 0-3 4-11 4s-11-4-11-4z" fill="#8B6914"/><path d="M9 14c0 0 2 3 11 3s11-3 11-3" fill="#8B6914"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#c97878" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Phil - older man, gray hair
    'phil': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#6366F1"/><circle cx="20" cy="16" r="9" fill="#fce5d8"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#4f46e5"/><path d="M12 10c0-4 3-6 8-6s8 2 8 6c0 2-1 4-2 5h-12c-1-1-2-3-2-5z" fill="#9CA3AF"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#c97878" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Jan - woman, short gray hair
    'jan': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#EC4899"/><circle cx="20" cy="16" r="9" fill="#fce5d8"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#db2777"/><path d="M11 13c0-4 4-7 9-7s9 3 9 7c0 2-2 4-4 5h-10c-2-1-4-3-4-5z" fill="#9CA3AF"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#c97878" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Patrick - man, dark hair
    'patrick': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#8B5CF6"/><circle cx="20" cy="16" r="9" fill="#e8c4a0"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#7c3aed"/><path d="M12 10c0-4 3-6 8-6s8 2 8 6c0 2-1 4-2 5h-12c-1-1-2-3-2-5z" fill="#3d2d1f"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Michael - man, brown hair
    'michael': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#0EA5E9"/><circle cx="20" cy="16" r="9" fill="#fce5d8"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#0284c7"/><path d="M12 10c0-4 3-6 8-6s8 2 8 6c0 2-1 4-2 5h-12c-1-1-2-3-2-5z" fill="#5C4033"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#c97878" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // Peter - older man, gray/white hair
    'peter': '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#F59E0B"/><circle cx="20" cy="16" r="9" fill="#fce5d8"/><ellipse cx="20" cy="28" rx="11" ry="8" fill="#d97706"/><path d="M12 10c0-4 3-6 8-6s8 2 8 6c0 2-1 4-2 5h-12c-1-1-2-3-2-5z" fill="#E5E7EB"/><circle cx="16" cy="15" r="1.5" fill="#1a1a1a"/><circle cx="24" cy="15" r="1.5" fill="#1a1a1a"/><path d="M17 20c1.5 1.5 4.5 1.5 6 0" stroke="#c97878" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };

  function getAvatar(name) {
    const avatarMap = {
      'You': 'user',
      'Mike Chen': 'mike',
      'Sarah Wilson': 'sarah',
      'James Park': 'james',
      'Emily Rodriguez': 'emily',
      'David Kim': 'david',
      'Lisa Thompson': 'lisa',
      'Ryan O\'Connor': 'ryan',
      'Coach Martinez': 'coach',
      // MTC Board Members
      'Kelly K.': 'kelly',
      'Kelly Kamstra-Lloyd': 'kelly',
      'Phil P.': 'phil',
      'Phil Primmer': 'phil',
      'Jan H.': 'jan',
      'Jan Howard': 'jan',
      'Patrick M.': 'patrick',
      'Patrick Minshall': 'patrick',
      'Michael H.': 'michael',
      'Michael Horton': 'michael',
      'Peter G.': 'peter',
      'Peter Gibson': 'peter'
    };
    return avatarSvgs[avatarMap[name]] || avatarSvgs['user'];
  }

  const clubEventsData = {
    'euchre-tournament': {
      id: 'euchre-tournament',
      title: 'Euchre Tournament',
      date: '2026-03-14',
      time: 'Evening',
      location: 'Clubhouse',
      badge: 'free',
      price: 'Free',
      spotsTotal: 40,
      spotsTaken: 0,
      description: 'Pre-season Euchre tournament! Open to members and guests. Prizes for top teams.',
      attendees: []
    },
    'opening-day-bbq': {
      id: 'opening-day-bbq',
      title: 'Opening Day BBQ & Round Robin',
      date: '2026-05-09',
      time: '12:30 PM - 3:00 PM',
      location: 'All Courts & Clubhouse',
      badge: 'free',
      price: 'Free',
      spotsTotal: 60,
      spotsTaken: 38,
      description: 'Kick off the 2026 season! BBQ, music, round robin play, and meet our coaching staff. All members and families welcome.',
      attendees: ['Mike Chen', 'Sarah Wilson', 'James Park', 'Emily Rodriguez', 'Lisa Thompson']
    },
    'french-open-rr': {
      id: 'french-open-rr',
      title: 'French Open Round Robin Social',
      date: '2026-06-07',
      time: '1:00 PM - 4:00 PM',
      location: 'All Courts',
      badge: 'free',
      price: 'Free',
      spotsTotal: 40,
      spotsTaken: 0,
      description: 'Celebrate the French Open with a themed round robin social! Mixed doubles, prizes, and refreshments. All skill levels welcome.',
      attendees: []
    },
    'wimbledon-rr': {
      id: 'wimbledon-rr',
      title: 'Wimbledon Open Round Robin',
      date: '2026-07-12',
      time: '1:00 PM - 4:00 PM',
      location: 'All Courts',
      badge: 'free',
      price: 'Free',
      spotsTotal: 40,
      spotsTaken: 0,
      description: 'Wimbledon-themed round robin! Whites encouraged. Mixed doubles play, strawberries & cream, and great prizes.',
      attendees: []
    },
    'mens-round-robin': {
      id: 'mens-round-robin',
      title: "Men's Round Robin",
      date: '2026-05-12',
      time: '9:00 AM - 11:00 AM',
      location: 'Courts 1-2',
      badge: 'members',
      price: 'Members',
      spotsTotal: 16,
      spotsTaken: 10,
      description: 'Weekly men\'s round robin every Tuesday morning. All skill levels welcome. Drop in and play!',
      attendees: ['Mike Chen', 'James Park', 'David Kim', 'Ryan O\'Connor']
    },
    'freedom-55': {
      id: 'freedom-55',
      title: 'Freedom 55 League',
      date: '2026-05-14',
      time: '9:00 AM - 11:00 AM',
      location: 'Courts 1-2',
      badge: 'members',
      price: 'Members',
      spotsTotal: 16,
      spotsTaken: 12,
      description: 'Thursday morning league for the 55+ crowd. Fun and social tennis with a great group of players.',
      attendees: ['Lisa Thompson', 'David Kim']
    },
    'interclub-league': {
      id: 'interclub-league',
      title: 'Interclub Competitive League',
      date: '2026-05-14',
      time: '7:00 PM - 9:30 PM',
      location: 'Courts 1-2',
      badge: 'members',
      price: 'Team',
      spotsTotal: 12,
      spotsTaken: 10,
      description: 'Thursday night competitive interclub league. A & B teams compete against clubs in the region. RSVP required for team selection.',
      attendees: ['Mike Chen', 'James Park', 'Ryan O\'Connor']
    },
    'ladies-round-robin': {
      id: 'ladies-round-robin',
      title: "Ladies Round Robin",
      date: '2026-05-15',
      time: '9:00 AM - 11:00 AM',
      location: 'Courts 1-2',
      badge: 'members',
      price: 'Members',
      spotsTotal: 16,
      spotsTaken: 8,
      description: 'Weekly ladies round robin every Friday morning. All skill levels welcome. A fun way to start the weekend!',
      attendees: ['Sarah Wilson', 'Emily Rodriguez', 'Lisa Thompson']
    },
    'friday-mixed': {
      id: 'friday-mixed',
      title: 'Friday Night Mixed Round Robin',
      date: '2026-05-15',
      time: '6:00 PM - 9:00 PM',
      location: 'All Courts',
      badge: 'members',
      price: 'Members',
      spotsTotal: 24,
      spotsTaken: 16,
      description: 'Friday night mixed doubles round robin under the lights! Bring a partner or get matched. The most popular weekly event at MTC.',
      attendees: ['Mike Chen', 'Sarah Wilson', 'James Park', 'Emily Rodriguez', 'David Kim']
    },
    'mixed-doubles-tournament-day1': {
      id: 'mixed-doubles-tournament-day1',
      title: '95+ Mixed Doubles Tournament (Day 1)',
      date: '2026-07-18',
      time: 'All Day',
      location: 'All Courts',
      badge: 'paid',
      price: '$180/Team',
      spotsTotal: 32,
      spotsTaken: 16,
      description: '95+ combined age mixed doubles tournament. A+B Draw. Includes lunches at Mono Cliffs Inn and great prizes! Day 1 of 2.',
      attendees: []
    },
    'mixed-doubles-tournament-day2': {
      id: 'mixed-doubles-tournament-day2',
      title: '95+ Mixed Doubles Tournament (Day 2)',
      date: '2026-07-19',
      time: 'All Day',
      location: 'All Courts',
      badge: 'paid',
      price: '$180/Team',
      spotsTotal: 32,
      spotsTaken: 16,
      description: '95+ combined age mixed doubles tournament. A+B Draw. Includes lunches at Mono Cliffs Inn and great prizes! Day 2 of 2.',
      attendees: []
    },
    'summer-camp-day1': {
      id: 'summer-camp-day1',
      title: 'Summer Tennis Camp (Day 1)',
      date: '2026-07-28',
      time: '8:30 AM - 3:30 PM',
      location: 'Courts 1-4',
      badge: 'paid',
      price: 'See Details',
      spotsTotal: 30,
      spotsTaken: 12,
      description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
      attendees: []
    },
    'summer-camp-day2': {
      id: 'summer-camp-day2',
      title: 'Summer Tennis Camp (Day 2)',
      date: '2026-07-29',
      time: '8:30 AM - 3:30 PM',
      location: 'Courts 1-4',
      badge: 'paid',
      price: 'See Details',
      spotsTotal: 30,
      spotsTaken: 12,
      description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
      attendees: []
    },
    'summer-camp-day3': {
      id: 'summer-camp-day3',
      title: 'Summer Tennis Camp (Day 3)',
      date: '2026-07-30',
      time: '8:30 AM - 3:30 PM',
      location: 'Courts 1-4',
      badge: 'paid',
      price: 'See Details',
      spotsTotal: 30,
      spotsTaken: 12,
      description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
      attendees: []
    },
    'summer-camp-day4': {
      id: 'summer-camp-day4',
      title: 'Summer Tennis Camp (Day 4)',
      date: '2026-07-31',
      time: '8:30 AM - 3:30 PM',
      location: 'Courts 1-4',
      badge: 'paid',
      price: 'See Details',
      spotsTotal: 30,
      spotsTaken: 12,
      description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
      attendees: []
    },
    'summer-camp-day5': {
      id: 'summer-camp-day5',
      title: 'Summer Tennis Camp (Day 5)',
      date: '2026-08-01',
      time: '8:30 AM - 3:30 PM',
      location: 'Courts 1-4',
      badge: 'paid',
      price: 'See Details',
      spotsTotal: 30,
      spotsTaken: 12,
      description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
      attendees: []
    },
    'mark-taylor-classes': {
      id: 'mark-taylor-classes',
      title: 'Classes & Summer Camps',
      date: '2026-05-11',
      time: 'Various Times',
      location: 'Courts 1-2',
      badge: 'paid',
      price: 'See Details',
      spotsTotal: 40,
      spotsTaken: 18,
      description: 'Register for coaching classes and summer camps with Mark Taylor. Programs for all ages and skill levels. Spots fill up fast!',
      attendees: []
    }
  };

  // Sync attendees with persisted userRsvps (add 'You' if RSVP'd)
  (function syncRsvpAttendees() {
    userRsvps.forEach(function(eventId) {
      const ev = clubEventsData[eventId];
      if (ev && ev.attendees.indexOf('You') === -1) {
        ev.attendees.unshift('You');
        ev.spotsTaken++;
      }
    });
  })();

  // Sync HTML event card date boxes with dynamic clubEventsData dates
  function syncEventCardDates() {
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    document.querySelectorAll('#scheduleEventsView .event-card[onclick]').forEach(function(card) {
      const onclick = card.getAttribute('onclick') || '';
      const match = onclick.match(/(?:showEventModal|showCoachRegistrationModal)\(['"]([^'"]+)['"]\)/);
      if (!match) return;
      const eventId = match[1];
      const ev = clubEventsData[eventId];
      if (!ev || !ev.date) return;
      const parts = ev.date.split('-');
      const monthEl = card.querySelector('.event-card-month');
      const dayEl = card.querySelector('.event-card-day');
      if (monthEl) monthEl.textContent = months[parseInt(parts[1], 10) - 1];
      if (dayEl) dayEl.textContent = parseInt(parts[2], 10);
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncEventCardDates);
  } else {
    syncEventCardDates();
  }

  function switchEventsView(view) {
    document.querySelectorAll('#scheduleEventsView .events-view').forEach(function(v) { v.classList.remove('active'); });
    document.querySelectorAll('#scheduleEventsView .view-toggle-btn').forEach(function(b) { b.classList.remove('active'); });
    const viewEl = document.getElementById('events' + view.charAt(0).toUpperCase() + view.slice(1) + 'View');
    const btnEl = document.getElementById('events' + view.charAt(0).toUpperCase() + view.slice(1) + 'ViewBtn');
    if (viewEl) viewEl.classList.add('active');
    if (btnEl) btnEl.classList.add('active');
    if (view === 'calendar') generateEventsCalendar();
  }

  function generateEventsCalendar() {
    const grid = document.getElementById('eventsCalendarGrid');
    const monthLabel = document.getElementById('eventsCalendarMonth');
    if (!grid || !monthLabel) return;

    const year = eventsCalendarDate.getFullYear();
    const month = eventsCalendarDate.getMonth();
    const monthNames = MTC.config.monthNamesFull;
    monthLabel.textContent = monthNames[month] + ' ' + year;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    // Build event dates lookup
    const eventDates = {};
    Object.values(clubEventsData).forEach(function(ev) { eventDates[ev.date] = ev; });

    let html = '';
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      html += '<div class="calendar-day other-month">' + (daysInPrevMonth - i) + '</div>';
    }
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const isToday = dateStr === todayStr;
      const hasEvent = eventDates[dateStr] ? true : false;
      let classes = 'calendar-day';
      if (isToday) classes += ' today';
      if (hasEvent) classes += ' has-event';
      html += '<div class="' + classes + '" onclick="showEventsForDate(\'' + dateStr + '\', this)">' + day + '</div>';
    }
    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const nextMonthDays = totalCells - (firstDay + daysInMonth);
    for (let j = 1; j <= nextMonthDays; j++) {
      html += '<div class="calendar-day other-month">' + j + '</div>';
    }
    grid.innerHTML = html;
  }

  function changeEventsMonth(delta) {
    eventsCalendarDate.setMonth(eventsCalendarDate.getMonth() + delta);
    generateEventsCalendar();
  }

  function showEventsForDate(dateStr, clickedEl) {
    // Highlight selected day
    document.querySelectorAll('#eventsCalendarGrid .calendar-day').forEach(function(d) { d.classList.remove('selected'); });
    if (clickedEl) clickedEl.classList.add('selected');

    const container = document.getElementById('eventsCalendarEventsList');
    const titleEl = document.getElementById('eventsSelectedDateTitle');
    if (!container || !titleEl) return;

    const eventsForDate = Object.values(clubEventsData).filter(function(e) { return e.date === dateStr; });
    const date = new Date(dateStr + 'T12:00:00');
    titleEl.textContent = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

    container.innerHTML = '';
    if (eventsForDate.length === 0) {
      container.innerHTML = '<div class="calendar-event-item-empty" style="text-align:center;padding:20px;color:var(--text-muted);">No events on this date</div>';
    } else {
      eventsForDate.forEach(function(ev) {
        container.insertAdjacentHTML('beforeend',
          '<div class="calendar-event-item" onclick="showEventModal(\'' + ev.id + '\')">' +
          '  <div class="calendar-event-time">' + sanitizeHTML(ev.time.split(' - ')[0]) + '</div>' +
          '  <div class="calendar-event-info">' +
          '    <div class="calendar-event-title">' + sanitizeHTML(ev.title) + '</div>' +
          '    <div class="calendar-event-location">' + sanitizeHTML(ev.location) + ' \u2022 ' + (ev.badge === 'paid' ? ev.spotsTaken + '/' + ev.spotsTotal + ' spots' : ev.spotsTaken + ' going') + '</div>' +
          '  </div>' +
          '  <div class="calendar-event-dot ' + (ev.badge === 'paid' ? 'gold' : ev.badge === 'free' ? 'blue' : '') + '"></div>' +
          '</div>'
        );
      });
    }
  }

  function showEventModal(eventId) {
    const event = clubEventsData[eventId];
    if (!event) return;

    const isRegistered = userRsvps.includes(eventId);
    const hasSpotsLimit = event.badge === 'paid';
    const spotsPercent = hasSpotsLimit ? (event.spotsTaken / event.spotsTotal) * 100 : 0;
    const spotsLeft = hasSpotsLimit ? event.spotsTotal - event.spotsTaken : 999;

    const attendeesHtml = event.attendees.length > 0 ? event.attendees.map(function(name) {
      return '<div class="event-modal-attendee">' +
        '<span class="event-modal-attendee-avatar">' + getAvatar(name) + '</span>' +
        '<span>' + sanitizeHTML(name) + '</span>' +
      '</div>';
    }).join('') : '<span style="color: var(--text-muted); font-size: 13px;">Be the first to register!</span>';

    const dateDisplay = new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const rsvpBtnClass = isRegistered ? 'registered' : 'register';
    const rsvpBtnContent = isRegistered
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> REGISTERED - TAP TO CANCEL'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg> REGISTER NOW';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'eventModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Event details');
    modal.onclick = function(e) { if (e.target === this) closeEventModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 85vh; overflow-y: auto;">' +
        '<div class="event-modal-header">' +
          '<div class="event-modal-badge ' + event.badge + '">' + sanitizeHTML(event.price) + '</div>' +
          '<div class="event-modal-title">' + sanitizeHTML(event.title) + '</div>' +
          '<div class="event-modal-meta">' +
            '<div class="event-modal-meta-item">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ' +
              dateDisplay +
            '</div>' +
            '<div class="event-modal-meta-item">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ' +
              sanitizeHTML(event.time) +
            '</div>' +
            '<div class="event-modal-meta-item">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ' +
              sanitizeHTML(event.location) +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="event-modal-section">' +
          '<div class="event-modal-section-title">About This Event</div>' +
          '<div class="event-modal-description">' + sanitizeHTML(event.description) + '</div>' +
        '</div>' +
        '<div class="event-modal-section">' +
          '<div class="event-modal-section-title">' + (hasSpotsLimit ? 'Availability' : 'Attendance') + '</div>' +
          (hasSpotsLimit ? '<div class="event-modal-spots-bar"><div class="event-modal-spots-fill" style="width: ' + spotsPercent + '%"></div></div>' : '') +
          '<div class="event-modal-spots-text">' +
            '<span>' + event.spotsTaken + ' ' + (hasSpotsLimit ? 'registered' : 'going') + '</span>' +
            (hasSpotsLimit ? '<span>' + spotsLeft + ' spots left</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="event-modal-section">' +
          '<div class="event-modal-section-title">Who\'s Coming (' + event.attendees.length + ')</div>' +
          '<div class="event-modal-attendees">' +
            attendeesHtml +
          '</div>' +
        '</div>' +
        '<button class="event-modal-rsvp-btn ' + rsvpBtnClass + '" onclick="toggleEventRsvp(\'' + eventId + '\')">' +
          rsvpBtnContent +
        '</button>' +
        '<button class="event-modal-close-btn" onclick="closeEventModal()">Close</button>' +
      '</div>';

    document.getElementById('app').appendChild(modal);
    setTimeout(function() { modal.classList.add('active'); }, 10);
  }

  function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  }

  function toggleEventRsvp(eventId) {
    const event = clubEventsData[eventId];
    if (!event) return;

    const isRegistered = userRsvps.includes(eventId);

    if (isRegistered) {
      // Unregister
      const rsvpIdx = userRsvps.indexOf(eventId);
      if (rsvpIdx !== -1) userRsvps.splice(rsvpIdx, 1);
      saveUserRsvps();
      event.spotsTaken--;
      const attIdx = event.attendees.indexOf('You');
      if (attIdx !== -1) event.attendees.splice(attIdx, 1);
      showToast('Registration cancelled');
      removeEventFromMyBookings(eventId);
    } else {
      // Register — only paid/coaching events have spot limits
      if (event.badge === 'paid' && event.spotsTaken >= event.spotsTotal) {
        showToast('Sorry, this event is full!');
        return;
      }
      userRsvps.push(eventId);
      saveUserRsvps();
      event.spotsTaken++;
      event.attendees.unshift('You');
      showToast('Successfully registered! \uD83C\uDF89');
      addEventToMyBookings(eventId, 'event');
    }

    // Close modal after brief delay for visual feedback
    setTimeout(function() { closeEventModal(); }, 600);
  }

  // ============================================
  // MARK TAYLOR CLASS REGISTRATION SYSTEM
  // ============================================
  const coachClasses = {
    'adult-beginner': { title: 'Adult Beginner Lessons', level: 'Beginner', schedule: 'Saturdays 9:00 AM', duration: '6 weeks', price: 180, maxSpots: 8, desc: 'Perfect for newcomers. Learn grips, strokes, and rally skills with Coach Mark Taylor.' },
    'adult-intermediate': { title: 'Adult Intermediate Clinic', level: 'Intermediate', schedule: 'Saturdays 10:30 AM', duration: '6 weeks', price: 210, maxSpots: 8, desc: 'Improve consistency, net play, and match strategy. Take your game to the next level.' },
    'junior-development': { title: 'Junior Development', level: 'Ages 8-14', schedule: 'Wednesdays 4:00 PM', duration: '8 weeks', price: 240, maxSpots: 12, desc: 'Fun, skill-building program for juniors. Fundamentals, footwork, and match play.' },
    'summer-camp-week1': { title: 'Summer Camp \u2014 Week 1', level: 'Ages 6-14', schedule: 'Jul 6-10, 9 AM - 12 PM', duration: '1 week', price: 275, maxSpots: 16, desc: 'Full week tennis day camp. Games, drills, and fun for all levels. Snacks included.' },
    'summer-camp-week2': { title: 'Summer Camp \u2014 Week 2', level: 'Ages 6-14', schedule: 'Jul 13-17, 9 AM - 12 PM', duration: '1 week', price: 275, maxSpots: 16, desc: 'Full week tennis day camp. Games, drills, and fun for all levels. Snacks included.' }
  };

  // Load class registrations from localStorage
  function getClassRegistrations() {
    return MTC.storage.get('mtc-class-registrations', {});
  }

  function saveClassRegistrations(regs) {
    MTC.storage.set('mtc-class-registrations', regs);
  }

  function getClassRegCount(classId) {
    const regs = getClassRegistrations();
    return regs[classId] ? regs[classId].length : 0;
  }

  function isUserRegisteredForClass(classId) {
    const regs = getClassRegistrations();
    if (!regs[classId]) return false;
    return regs[classId].some(function(r) { return r.name === 'You'; });
  }

  function showCoachRegistrationModal() {
    const regs = getClassRegistrations();

    const classListHtml = Object.keys(coachClasses).map(function(classId) {
      const c = coachClasses[classId];
      const regCount = getClassRegCount(classId);
      const isFull = regCount >= c.maxSpots;
      const isRegistered = isUserRegisteredForClass(classId);
      const spotsLeft = c.maxSpots - regCount;
      const barPercent = (regCount / c.maxSpots) * 100;

      return '<div class="coach-class-card" style="background: var(--bg-secondary); border-radius: 14px; padding: 16px; margin-bottom: 12px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">' +
          '<div>' +
            '<div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">' + sanitizeHTML(c.title) + '</div>' +
            '<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">' + sanitizeHTML(c.level) + ' \u2022 ' + sanitizeHTML(c.schedule) + '</div>' +
          '</div>' +
          '<div style="font-family: Bebas Neue, sans-serif; font-size: 22px; color: var(--volt); white-space: nowrap;">$' + c.price + '</div>' +
        '</div>' +
        '<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.4;">' + sanitizeHTML(c.desc) + '</div>' +
        '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">' +
          '<div style="flex: 1; height: 6px; background: var(--bg-card); border-radius: 3px; overflow: hidden;">' +
            '<div style="height: 100%; width: ' + barPercent + '%; background: ' + (isFull ? '#ef4444' : 'var(--volt)') + '; border-radius: 3px; transition: width 0.3s;"></div>' +
          '</div>' +
          '<span style="font-size: 11px; color: var(--text-muted); white-space: nowrap;">' + regCount + '/' + c.maxSpots + '</span>' +
        '</div>' +
        (isRegistered ?
          '<button class="modal-btn ripple" style="background: var(--bg-card); color: var(--volt); font-size: 13px; padding: 10px;" onclick="event.stopPropagation()">\u2713 REGISTERED</button>' :
          (isFull ?
            '<button class="modal-btn ripple" style="background: var(--bg-card); color: var(--text-muted); font-size: 13px; padding: 10px;" disabled>CLASS FULL</button>' :
            '<button class="modal-btn ripple" style="font-size: 13px; padding: 10px;" onclick="registerForClass(\'' + classId + '\')">SIGN UP \u2014 ' + spotsLeft + ' spot' + (spotsLeft !== 1 ? 's' : '') + ' left</button>'
          )
        ) +
      '</div>';
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'coachRegistrationModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Coach registration');
    modal.onclick = function(e) { if (e.target === modal) closeCoachRegistrationModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 440px; max-height: 85vh; overflow-y: auto;">' +
        '<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 24px; border-radius: 20px 20px 0 0; margin: -24px -24px 20px -24px;">' +
          '<button onclick="closeCoachRegistrationModal()" style="position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer;"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' +
          '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">' +
            '<div style="width: 48px; height: 48px;">' + (avatarSvgs['coach'] || '') + '</div>' +
            '<div>' +
              '<div style="font-family: Bebas Neue, sans-serif; font-size: 24px; color: #fff; line-height: 1.1;">Mark Taylor</div>' +
              '<div style="font-size: 12px; color: rgba(255,255,255,0.6);">Head Coach \u2022 MTC</div>' +
            '</div>' +
          '</div>' +
          '<div style="font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.4;">Register for classes and summer camps. Spots fill up fast!</div>' +
        '</div>' +
        classListHtml +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="closeCoachRegistrationModal()">CLOSE</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
    setTimeout(function() { modal.classList.add('active'); }, 10);
  }

  function closeCoachRegistrationModal() {
    const modal = document.getElementById('coachRegistrationModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  }

  function registerForClass(classId) {
    const c = coachClasses[classId];
    if (!c) return;

    if (isUserRegisteredForClass(classId)) {
      showToast('You\'re already registered for this class');
      return;
    }

    const regCount = getClassRegCount(classId);
    if (regCount >= c.maxSpots) {
      showToast('Sorry, this class is full!');
      return;
    }

    // Add registration
    const regs = getClassRegistrations();
    if (!regs[classId]) regs[classId] = [];
    regs[classId].push({
      name: 'You',
      date: new Date().toISOString()
    });
    saveClassRegistrations(regs);

    // Add to My Bookings
    if (typeof addEventToMyBookings === 'function') {
      addEventToMyBookings('class-' + classId, 'program', {
        title: c.title,
        date: c.schedule,
        time: c.duration,
        location: 'MTC Courts'
      });
    }

    // Close modal and show celebration
    closeCoachRegistrationModal();

    // Check if class is now full — notify coach
    const newCount = getClassRegCount(classId);
    const isFull = newCount >= c.maxSpots;

    showToast('\uD83C\uDF89 Registered for ' + c.title + '!');

    // Show celebration modal
    setTimeout(function() {
      showClassRegistrationSuccess('YOU\'RE IN!', c.title, c.schedule);
    }, 400);

    // If class is full, add coach notification
    if (isFull && typeof addCoachNotification === 'function') {
      addCoachNotification(classId, c.title, newCount);
    }
  }

  // Coach notification when a class fills up
  function addCoachNotification(classId, title, count) {
    const notifications = MTC.storage.get('mtc-coach-notifications', []);
    notifications.unshift({
      type: 'class-full',
      classId: classId,
      title: title,
      count: count,
      date: new Date().toISOString(),
      read: false
    });
    MTC.storage.set('mtc-coach-notifications', notifications);
  }

  // Get registered list for a class (for coach/admin view)
  function getClassRegisteredList(classId) {
    const regs = getClassRegistrations();
    return regs[classId] || [];
  }

  // ============================================
  // ADMIN: CLASS REGISTRATIONS PANEL
  // ============================================
  function renderAdminClassRegistrations() {
    const container = document.getElementById('adminClassRegistrations');
    if (!container) return;

    const regs = getClassRegistrations();
    let hasAny = false;

    let html = '';
    Object.keys(coachClasses).forEach(function(classId) {
      const c = coachClasses[classId];
      const regList = regs[classId] || [];
      const count = regList.length;
      const isFull = count >= c.maxSpots;
      if (count > 0) hasAny = true;

      html += '<div class="settings-item" style="flex-direction: column; align-items: stretch; gap: 8px; padding: 14px 16px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center;">' +
          '<div>' +
            '<div style="font-weight: 600; font-size: 14px;">' + c.title + '</div>' +
            '<div style="font-size: 12px; color: var(--text-muted);">' + c.level + ' \u2022 ' + c.schedule + '</div>' +
          '</div>' +
          '<div style="font-size: 13px; font-weight: 700; color: ' + (isFull ? '#ef4444' : 'var(--volt)') + ';">' + count + '/' + c.maxSpots + (isFull ? ' FULL' : '') + '</div>' +
        '</div>';

      if (regList.length > 0) {
        html += '<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">';
        regList.forEach(function(r) {
          html += '<span style="font-size: 11px; padding: 3px 8px; border-radius: 8px; background: var(--bg-secondary); color: var(--text-secondary);">' + (r.name || 'Member') + '</span>';
        });
        html += '</div>';
      }
      html += '</div>';
    });

    if (!hasAny) {
      container.innerHTML = '<div class="admin-empty-state">No registrations yet. Classes will appear here as members sign up.</div>';
    } else {
      container.innerHTML = html;
    }
  }

  function renderAdminCoachNotifications() {
    const container = document.getElementById('adminCoachNotifications');
    if (!container) return;

    const notifications = MTC.storage.get('mtc-coach-notifications', []);

    if (notifications.length === 0) {
      container.innerHTML = '<div class="admin-empty-state">No coach notifications</div>';
      return;
    }

    let html = '';
    notifications.slice(0, 10).forEach(function(n) {
      const date = new Date(n.date);
      const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      html += '<div class="settings-item" style="padding: 12px 16px;">' +
        '<div style="flex: 1;">' +
          '<div style="font-weight: 600; font-size: 13px; color: ' + (n.type === 'class-full' ? '#ef4444' : 'var(--text-primary)') + ';">' +
            (n.type === 'class-full' ? '\uD83D\uDD34 CLASS FULL: ' : '\uD83D\uDCCB ') + n.title +
          '</div>' +
          '<div style="font-size: 11px; color: var(--text-muted);">' + n.count + ' registered \u2022 ' + timeStr + '</div>' +
        '</div>' +
      '</div>';
    });
    container.innerHTML = html;
  }

  // Render admin class panels when admin screen becomes visible (flattened from inner IIFE)
  function setupAdminClassObserver() {
    const adminScreen = document.getElementById('screen-admin');
    if (!adminScreen) return;
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'class' && adminScreen.classList.contains('active')) {
          renderAdminClassRegistrations();
          renderAdminCoachNotifications();
        }
      });
    });
    observer.observe(adminScreen, { attributes: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAdminClassObserver);
  } else {
    setupAdminClassObserver();
  }

  // Show class registration success modal
  function showClassRegistrationSuccess(heading, title, detail) {
    const existing = document.getElementById('celebrationModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'celebrationModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Registration confirmed');
    modal.onclick = function(e) { if (e.target === modal) { modal.classList.remove('active'); setTimeout(function() { modal.remove(); }, 300); } };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="text-align: center; max-width: 340px;">' +
        '<div class="modal-icon-success" style="margin: 0 auto 16px; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="var(--volt)" stroke-width="3" width="36" height="36"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
        '</div>' +
        '<div style="font-family: Bebas Neue, sans-serif; font-size: 28px; color: var(--volt); margin-bottom: 8px;">' + sanitizeHTML(heading) + '</div>' +
        '<div style="font-weight: 600; font-size: 16px; color: var(--text-primary); margin-bottom: 4px;">' + sanitizeHTML(title) + '</div>' +
        '<div style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">' + sanitizeHTML(detail) + '</div>' +
        '<button class="modal-btn ripple" onclick="const m=document.getElementById(\'celebrationModal\'); if(m){m.classList.remove(\'active\'); setTimeout(function(){m.remove();},300);}">AWESOME!</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
    setTimeout(function() { modal.classList.add('active'); }, 10);
  }

  // ============================================
  // RSVP LIST MODAL — Shows who's coming
  // Works from home screen + club events cards
  // ============================================
  function showRsvpListModal(eventId) {
    // Resolve home screen short IDs to real event IDs
    let realId = eventId;
    if (typeof homeToClubEventMap !== 'undefined' && homeToClubEventMap[eventId]) {
      realId = homeToClubEventMap[eventId];
    }

    const ev = (typeof clubEventsData !== 'undefined') ? clubEventsData[realId] : null;
    if (!ev) { showToast('Event not found'); return; }

    const isRegistered = userRsvps.indexOf(realId) !== -1;
    const hasSpotsLimit = ev.badge === 'paid';
    const spotsLeft = hasSpotsLimit ? ev.spotsTotal - ev.spotsTaken : 999;
    const spotsPercent = hasSpotsLimit ? Math.min(100, Math.round((ev.spotsTaken / ev.spotsTotal) * 100)) : 0;

    // Build attendee list HTML
    let attendeesHtml = '';
    if (ev.attendees && ev.attendees.length > 0) {
      attendeesHtml = ev.attendees.map(function(name) {
        const isYou = name === 'You';
        return '<div class="rsvp-attendee' + (isYou ? ' you' : '') + '">' +
          '<span class="rsvp-attendee-avatar">' + getAvatar(name) + '</span>' +
          '<span class="rsvp-attendee-name">' + (isYou ? 'You' : sanitizeHTML(name)) + '</span>' +
          (isYou ? '<span class="rsvp-you-badge">YOU</span>' : '') +
        '</div>';
      }).join('');
    } else {
      attendeesHtml = '<div class="rsvp-empty">No one has RSVP\'d yet. Be the first!</div>';
    }

    // Status bar color
    const barColor = spotsPercent < 60 ? 'var(--volt)' : (spotsPercent < 85 ? '#ffb400' : 'var(--coral)');
    const statusText = hasSpotsLimit
      ? (spotsLeft > 0 ? '<span style="color:' + barColor + ';">' + spotsLeft + ' spots left</span>' : '<span style="color:var(--coral);">FULL</span>')
      : '';

    let rsvpBtn = '';
    if (!isRegistered && (hasSpotsLimit ? spotsLeft > 0 : true)) {
      rsvpBtn = '<button class="rsvp-modal-action-btn register" onclick="rsvpFromModal(\'' + eventId + '\')">RSVP NOW</button>';
    } else if (isRegistered) {
      rsvpBtn = '<button class="rsvp-modal-action-btn registered" onclick="rsvpFromModal(\'' + eventId + '\')">\u2713 REGISTERED \u2014 TAP TO CANCEL</button>';
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'rsvpListModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'RSVP list');
    modal.onclick = function(e) { if (e.target === modal) closeRsvpListModal(); };
    modal.innerHTML =
      '<div class="rsvp-list-modal" onclick="event.stopPropagation()">' +
        '<button class="rsvp-modal-close" onclick="closeRsvpListModal()" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
        '<div class="rsvp-modal-title">' + sanitizeHTML(ev.title) + '</div>' +
        '<div class="rsvp-modal-meta">' + sanitizeHTML(ev.time) + ' \u2022 ' + sanitizeHTML(ev.location) + '</div>' +
        '<div class="rsvp-modal-spots">' +
          (hasSpotsLimit ? '<div class="rsvp-spots-bar"><div class="rsvp-spots-fill" style="width:' + spotsPercent + '%;background:' + barColor + ';"></div></div>' : '') +
          '<div class="rsvp-spots-text">' +
            '<span>' + ev.spotsTaken + (hasSpotsLimit ? ' / ' + ev.spotsTotal + ' registered' : ' going') + '</span>' +
            statusText +
          '</div>' +
        '</div>' +
        '<div class="rsvp-modal-section-title">WHO\'S COMING (' + ev.attendees.length + ')</div>' +
        '<div class="rsvp-attendee-list">' + attendeesHtml + '</div>' +
        rsvpBtn +
      '</div>';

    document.getElementById('app').appendChild(modal);
    setTimeout(function() { modal.classList.add('active'); }, 10);
  }

  function closeRsvpListModal() {
    const modal = document.getElementById('rsvpListModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  }

  function rsvpFromModal(eventId) {
    // Find the corresponding RSVP button on home screen to pass to rsvpToEvent
    let btn = null;
    const homeEventEl = document.getElementById('homeEvent-' + eventId);
    if (homeEventEl) {
      btn = homeEventEl.querySelector('.event-rsvp-btn');
    }

    // Close modal first
    closeRsvpListModal();

    // Trigger RSVP via existing function
    if (typeof rsvpToEvent === 'function') {
      rsvpToEvent(eventId, btn);
    } else if (typeof toggleEventRsvp === 'function') {
      const realId = (typeof homeToClubEventMap !== 'undefined' && homeToClubEventMap[eventId]) ? homeToClubEventMap[eventId] : eventId;
      toggleEventRsvp(realId);
    }
  }

  // ============================================
  // EXPORTS — expose to MTC namespace + window
  // ============================================

  // MTC.state — shared state objects
  if (!MTC.state) MTC.state = {};
  MTC.state.userRsvps = userRsvps;
  MTC.state.clubEventsData = clubEventsData;

  // MTC.fn — shared functions
  if (!MTC.fn) MTC.fn = {};
  /** Persists userRsvps array to localStorage */
  MTC.fn.saveUserRsvps = saveUserRsvps;
  /** @function MTC.fn.getAvatar @param {string} name - Member name @returns {string} SVG markup */
  MTC.fn.getAvatar = getAvatar;

  // Window aliases for cross-file access and onclick handlers
  window.userRsvps = userRsvps;
  window.saveUserRsvps = saveUserRsvps;
  window.avatarSvgs = avatarSvgs;
  window.getAvatar = getAvatar;
  window.clubEventsData = clubEventsData;
  window.syncEventCardDates = syncEventCardDates;
  window.switchEventsView = switchEventsView;
  window.changeEventsMonth = changeEventsMonth;
  window.showEventsForDate = showEventsForDate;
  // Keyboard handler for event cards (Enter/Space triggers click)
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.event-card[role="button"]');
    if (!card) return;
    e.preventDefault();
    card.click();
  });

  window.showEventModal = showEventModal;
  window.closeEventModal = closeEventModal;
  window.toggleEventRsvp = toggleEventRsvp;
  window.showCoachRegistrationModal = showCoachRegistrationModal;
  window.closeCoachRegistrationModal = closeCoachRegistrationModal;
  window.registerForClass = registerForClass;
  window.addCoachNotification = addCoachNotification;
  window.showRsvpListModal = showRsvpListModal;
  window.closeRsvpListModal = closeRsvpListModal;
  window.rsvpFromModal = rsvpFromModal;
})();
