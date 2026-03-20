(function() {
  'use strict';
  /* events.js - MTC Court */
  // ============================================
  // CLUB EVENTS SYSTEM
  // ============================================

  const eventsCalendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  var serverManagedEventIds = [];
  var pendingEventRsvps = new Set();

  // Load persisted RSVPs or use defaults
  const userRsvps = (function() {
    return MTC.storage.get('mtc-user-rsvps', []);
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
      spotsTaken: 0,
      description: 'Kick off the 2026 season! BBQ, music, and meet our coaching staff including Mark Taylor. All members, families, and guests welcome.',
      attendees: []
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
      location: 'All Courts',
      badge: 'members',
      price: 'Members',
      spotsTotal: 16,
      spotsTaken: 0,
      description: 'Weekly men\'s round robin every Tuesday morning. All skill levels welcome. Drop in and play! $20 season ball fee — covers balls for the whole season. Payment details coming by email soon.',
      attendees: []
    },
    'freedom-55': {
      id: 'freedom-55',
      title: 'Freedom 55 League',
      date: '2026-05-14',
      time: '9:00 AM - 11:00 AM',
      location: 'All Courts',
      badge: 'members',
      price: 'Members',
      spotsTotal: 16,
      spotsTaken: 0,
      description: 'Thursday morning league for the 55+ crowd. Fun and social tennis with a great group of players.',
      attendees: []
    },
    'interclub-league': {
      id: 'interclub-league',
      title: 'Interclub Competitive League',
      date: '2026-05-14',
      time: '7:00 PM - 9:30 PM',
      location: 'All Courts',
      badge: 'members',
      price: 'Team',
      spotsTotal: 12,
      spotsTaken: 0,
      description: 'Thursday night competitive interclub league. A & B teams compete against clubs in the region. RSVP required for team selection.',
      attendees: []
    },
    'ladies-round-robin': {
      id: 'ladies-round-robin',
      title: "Ladies Round Robin",
      date: '2026-05-15',
      time: '9:00 AM - 11:00 AM',
      location: 'All Courts',
      badge: 'members',
      price: 'Members',
      spotsTotal: 16,
      spotsTaken: 0,
      description: 'Weekly ladies round robin every Friday morning. All skill levels welcome. A fun way to start the weekend! $20 season ball fee — covers balls for the whole season. Payment details coming by email soon.',
      attendees: []
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
      spotsTaken: 0,
      description: 'Friday night mixed doubles round robin under the lights! Bring a partner or get matched. The most popular weekly event at MTC. $20 season ball fee — covers balls for the whole season. Payment details coming by email soon.',
      attendees: []
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
      spotsTaken: 0,
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
      spotsTaken: 0,
      description: '95+ combined age mixed doubles tournament. A+B Draw. Includes lunches at Mono Cliffs Inn and great prizes! Day 2 of 2.',
      attendees: []
    },
    'junior-summer-camp': {
      id: 'junior-summer-camp',
      title: 'Junior Summer Camp',
      date: '2026-07-01',
      time: 'Dates TBA',
      location: 'All Courts',
      badge: 'paid',
      price: 'See Details',
      spotsTotal: 12,
      spotsTaken: 0,
      description: 'Intensive camp for juniors aged 8-14 with Mark Taylor. Daily drills, match play, fitness, and fun activities. Exact dates coming soon!',
      attendees: []
    }
  };

  // Compute next occurrence for recurring weekly events (matches desktop recurring templates)
  // dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  (function setRecurringDates() {
    var SEASON_START = '2026-05-09'; // Opening Day
    var SEASON_END   = '2026-09-30';
    var recurring = {
      'mens-round-robin':  2, // Tuesday
      'freedom-55':        4, // Thursday
      'interclub-league':  4, // Thursday
      'ladies-round-robin': 5, // Friday
      'friday-mixed':      5  // Friday
    };
    var today = new Date();
    today.setHours(0,0,0,0);
    var seasonStart = new Date(SEASON_START + 'T12:00:00');
    var seasonEnd   = new Date(SEASON_END + 'T12:00:00');

    Object.keys(recurring).forEach(function(id) {
      var ev = clubEventsData[id];
      if (!ev) return;
      var dow = recurring[id];
      // Start searching from today or season start, whichever is later
      var from = today > seasonStart ? new Date(today) : new Date(seasonStart);
      // Move forward to the next matching day of week
      var diff = (dow - from.getDay() + 7) % 7;
      if (diff === 0 && from <= today) diff = 7; // if today is the day but it's past, go to next week
      from.setDate(from.getDate() + diff);
      if (from <= seasonEnd) {
        var y = from.getFullYear();
        var m = String(from.getMonth() + 1).padStart(2, '0');
        var d = String(from.getDate()).padStart(2, '0');
        ev.date = y + '-' + m + '-' + d;
      }
    });
  })();

  // Sync attendees with persisted userRsvps (add 'You' if RSVP'd)
  (function syncRsvpAttendees() {
    userRsvps.forEach(function(eventId) {
      const ev = clubEventsData[eventId];
      if (ev && ev.attendees.indexOf('You') === -1) {
        ev.attendees.unshift('You');
        ev.spotsTaken++;
      }
    });
    // Sync home RSVP buttons on initial load
    setTimeout(function() {
      if (typeof syncHomeRsvpButtons === 'function') syncHomeRsvpButtons();
    }, 100);
  })();

  // Sync HTML event card date boxes with dynamic clubEventsData dates
  function syncEventCardDates() {
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    document.querySelectorAll('#scheduleEventsView .event-card[onclick]').forEach(function(card) {
      const onclick = card.getAttribute('onclick') || '';
      const match = onclick.match(/showEventModal\(['"]([^'"]+)['"]\)/);
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
    Object.values(clubEventsData).forEach(function(ev) {
      if (!ev.date || ev.date < todayStr) return;
      eventDates[ev.date] = ev;
    });

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

    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const eventsForDate = Object.values(clubEventsData).filter(function(e) { return e.date === dateStr && e.date >= todayStr; });
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

  function showEventModal(eventId, accentOverride) {
    const event = clubEventsData[eventId];
    if (!event) return;

    const isRegistered = userRsvps.includes(eventId);
    const hasSpotsLimit = event.badge === 'paid';
    const spotsPercent = hasSpotsLimit ? (event.spotsTaken / event.spotsTotal) * 100 : 0;
    const spotsLeft = hasSpotsLimit ? event.spotsTotal - event.spotsTaken : 999;

    // Accent color cycling: coral → electric-blue → dark, repeating
    const accentColors = ['var(--coral)', 'var(--electric-blue)', 'var(--deep-black)'];
    // Fixed map for homepage events to match their RSVP button colors
    const accentMap = {
      'euchre-tournament': 'var(--coral)',
      'opening-day-bbq': 'var(--electric-blue)',
      'mens-round-robin': 'var(--deep-black)'
    };
    const accentColor = accentOverride || accentMap[eventId] || accentColors[Object.keys(clubEventsData).indexOf(eventId) % 3];
    // For dark accent colors, button text must be white; icons need volt override in dark mode
    const isDarkAccent = accentColor === 'var(--deep-black)';
    const btnTextColor = isDarkAccent ? '#ffffff' : 'var(--color-black)';
    const iconStroke = isDarkAccent ? 'var(--volt)' : '';

    // Build attendee grid (2-col, max 6 shown, overflow chip)
    const maxShow = 6;
    const attendees = event.attendees || [];
    let attendeesHtml = '';
    if (attendees.length > 0) {
      const shown = attendees.slice(0, maxShow);
      var genericIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
      attendeesHtml = shown.map(function(name) {
        return '<div class="event-modal-attendee">' +
          '<span class="event-modal-attendee-avatar">' + genericIcon + '</span>' +
          '<span>' + sanitizeHTML(name) + '</span>' +
        '</div>';
      }).join('');
      if (attendees.length > maxShow) {
        attendeesHtml += '<div class="event-modal-attendee">' +
          '<span class="event-modal-attendee-overflow">+' + (attendees.length - maxShow) + '</span>' +
        '</div>';
      }
    } else {
      attendeesHtml = '<div class="event-modal-empty">Be the first to register!</div>';
    }

    const dateDisplay = new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const rsvpBtnClass = isRegistered ? 'registered' : 'register';
    const rsvpBtnContent = isRegistered
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> REGISTERED \u2014 TAP TO CANCEL'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg> REGISTER NOW';

    const goingText = event.spotsTaken + (isRegistered ? ' confirmed' : ' going');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'eventModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Event details');
    modal.onclick = function(e) { if (e.target === this) closeEventModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 85vh; overflow-y: auto; --modal-accent: ' + accentColor + '; --modal-btn-text: ' + btnTextColor + (iconStroke ? '; --modal-icon-stroke: ' + iconStroke : '') + ';">' +
        '<div class="event-modal-header">' +
          '<div class="event-modal-header-content">' +
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
        '</div>' +
        '<div class="event-modal-divider"></div>' +
        '<div class="event-modal-section">' +
          '<div class="event-modal-description">' + sanitizeHTML(event.description) + '</div>' +
        '</div>' +
        (hasSpotsLimit ?
          '<div class="event-modal-divider"></div>' +
          '<div class="event-modal-section">' +
            '<div class="event-modal-section-title">Availability</div>' +
            '<div class="event-modal-spots-bar"><div class="event-modal-spots-fill" style="width: ' + spotsPercent + '%"></div></div>' +
            '<div class="event-modal-spots-text">' +
              '<span>' + event.spotsTaken + ' / ' + event.spotsTotal + ' registered</span>' +
              '<span>' + spotsLeft + ' spots left</span>' +
            '</div>' +
          '</div>' : '') +
        '<div class="event-modal-divider"></div>' +
        '<div class="event-modal-section">' +
          '<div class="event-modal-whos-playing">' +
            '<span class="event-modal-whos-playing-title">Who\'s Playing</span>' +
            '<span class="event-modal-whos-playing-count">' + goingText + '</span>' +
          '</div>' +
          '<div class="event-modal-attendees">' +
            attendeesHtml +
          '</div>' +
        '</div>' +
        '<button class="event-modal-rsvp-btn ' + rsvpBtnClass + '" onclick="toggleEventRsvp(\'' + eventId + '\')">' +
          rsvpBtnContent +
        '</button>' +
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
    // Sync home RSVP buttons with current state
    if (typeof syncHomeRsvpButtons === 'function') syncHomeRsvpButtons();
  }

  function toggleEventRsvp(eventId) {
    const event = clubEventsData[eventId];
    if (!event) return;
    if (pendingEventRsvps.has(eventId)) return;

    pendingEventRsvps.add(eventId);

    const isRegistered = userRsvps.includes(eventId);

    if (isRegistered) {
      // Unregister — optimistic
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
      showToast('You\'re in!');
      addEventToMyBookings(eventId, 'event');

      // Success flash on the button
      var rsvpBtn = document.querySelector('#eventModal .event-modal-rsvp-btn');
      if (rsvpBtn) {
        rsvpBtn.classList.add('success-flash');
        rsvpBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> YOU\'RE IN!';
      }
    }

    // Refresh home calendar dots and schedule calendar to reflect RSVP change
    if (typeof MTC.fn.renderHomeCalendar === 'function') MTC.fn.renderHomeCalendar();
    if (typeof generateCalendar === 'function') generateCalendar();

    // Persist RSVP to Supabase via API — wait for confirmation before closing modal
    var token = MTC.getToken();
    var isUnrsvp = !userRsvps.includes(eventId); // we just toggled, so check current state
    if (token && typeof MTC.fn.apiRequest === 'function') {
      MTC.fn.apiRequest('/mobile/events', {
        method: 'POST',
        body: JSON.stringify({ eventId: eventId })
      }).then(function(res) {
        if (!res.ok) {
          // Rollback optimistic UI
          if (!isUnrsvp) {
            // Was an RSVP that failed — undo it
            var idx = userRsvps.indexOf(eventId);
            if (idx !== -1) userRsvps.splice(idx, 1);
            saveUserRsvps();
            event.spotsTaken--;
            var attIdx = event.attendees.indexOf('You');
            if (attIdx !== -1) event.attendees.splice(attIdx, 1);
            removeEventFromMyBookings(eventId);
          } else {
            // Was an un-RSVP that failed — re-add
            userRsvps.push(eventId);
            saveUserRsvps();
            event.spotsTaken++;
            event.attendees.unshift('You');
            addEventToMyBookings(eventId, 'event');
          }
          var errMsg = (res.data && res.data.error) || 'RSVP failed';
          if (res.status === 409) errMsg = 'Sorry, this event is full!';
          showToast(errMsg, 'error');
          if (typeof MTC.fn.renderHomeCalendar === 'function') MTC.fn.renderHomeCalendar();
          if (typeof generateCalendar === 'function') generateCalendar();
          renderEventModal(event);
        } else {
          // Success — close modal
          setTimeout(function() { closeEventModal(); }, 900);
        }
      }).catch(function(err) {
        MTC.warn('[MTC] RSVP sync error:', err);
        if (!isUnrsvp) {
          var idx = userRsvps.indexOf(eventId);
          if (idx !== -1) userRsvps.splice(idx, 1);
          saveUserRsvps();
          event.spotsTaken--;
          var attendeeIdx = event.attendees.indexOf('You');
          if (attendeeIdx !== -1) event.attendees.splice(attendeeIdx, 1);
          removeEventFromMyBookings(eventId);
        } else {
          userRsvps.push(eventId);
          saveUserRsvps();
          event.spotsTaken++;
          event.attendees.unshift('You');
          addEventToMyBookings(eventId, 'event');
        }
        if (typeof MTC.fn.renderHomeCalendar === 'function') MTC.fn.renderHomeCalendar();
        if (typeof generateCalendar === 'function') generateCalendar();
        renderEventModal(event);
        showToast('Network error — please try again', 'error');
      }).finally(function() {
        pendingEventRsvps.delete(eventId);
      });
    } else {
      if (!isUnrsvp) {
        var missingTokenIdx = userRsvps.indexOf(eventId);
        if (missingTokenIdx !== -1) userRsvps.splice(missingTokenIdx, 1);
        saveUserRsvps();
        event.spotsTaken--;
        var missingTokenAttendeeIdx = event.attendees.indexOf('You');
        if (missingTokenAttendeeIdx !== -1) event.attendees.splice(missingTokenAttendeeIdx, 1);
        removeEventFromMyBookings(eventId);
      } else {
        userRsvps.push(eventId);
        saveUserRsvps();
        event.spotsTaken++;
        event.attendees.unshift('You');
        addEventToMyBookings(eventId, 'event');
      }
      if (typeof MTC.fn.renderHomeCalendar === 'function') MTC.fn.renderHomeCalendar();
      if (typeof generateCalendar === 'function') generateCalendar();
      renderEventModal(event);
      pendingEventRsvps.delete(eventId);
      showToast('Please sign in again to RSVP', 'error');
    }
  }

  // Coach registration modal removed — coaching info lives on the Lessons screen

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
    // Reuse the unified event detail modal
    showEventModal(realId);
  }

  function closeRsvpListModal() {
    const modal = document.getElementById('rsvpListModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
    // Sync home RSVP buttons with current state
    if (typeof syncHomeRsvpButtons === 'function') syncHomeRsvpButtons();
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
  // EVENT FILTER TABS
  // ============================================
  var _activeFilter = 'all';

  function filterEvents(filter) {
    _activeFilter = filter;
    // Update tab UI
    document.querySelectorAll('#eventFilterTabs .event-filter-tab').forEach(function(tab) {
      tab.classList.toggle('active', tab.dataset.filter === filter);
    });

    // Filter event cards by badge type
    document.querySelectorAll('#eventsListView .event-card').forEach(function(card) {
      var onclick = card.getAttribute('onclick') || '';
      var match = onclick.match(/showEventModal\(['"]([^'"]+)['"]\)/);
      if (!match) return;
      var eventId = match[1];
      var ev = clubEventsData[eventId];
      if (!ev) { card.style.display = ''; return; }

      if (filter === 'all') {
        card.style.display = '';
      } else {
        card.style.display = ev.badge === filter ? '' : 'none';
      }
    });

    // Also hide section headers if all their cards are hidden
    document.querySelectorAll('#eventsListView .section-header').forEach(function(header) {
      var next = header.nextElementSibling;
      var hasVisible = false;
      while (next && !next.classList.contains('section-header')) {
        if (next.classList.contains('event-card') && next.style.display !== 'none') {
          hasVisible = true;
          break;
        }
        next = next.nextElementSibling;
      }
      header.style.display = hasVisible ? '' : 'none';
    });
  }

  // ============================================
  // SPOTS REMAINING — inject into event cards
  // ============================================
  function updateEventCardSpots() {
    document.querySelectorAll('#eventsListView .event-card, #scheduleEventsView .event-card').forEach(function(card) {
      var onclick = card.getAttribute('onclick') || '';
      var match = onclick.match(/showEventModal\(['"]([^'"]+)['"]\)/);
      if (!match) return;
      var eventId = match[1];
      var ev = clubEventsData[eventId];
      if (!ev) return;

      // Remove any existing spots badge
      var existing = card.querySelector('.event-spots-badge');
      if (existing) existing.remove();

      var footer = card.querySelector('.event-card-footer');
      if (!footer) return;

      var spotsLeft = ev.spotsTotal - ev.spotsTaken;
      var badgeHtml = '';
      if (ev.badge === 'paid') {
        // Paid events: show spots remaining
        if (spotsLeft <= 0) {
          badgeHtml = '<span class="event-spots-badge full">FULL</span>';
        } else if (spotsLeft <= 5) {
          badgeHtml = '<span class="event-spots-badge low">' + spotsLeft + ' spots left</span>';
        } else {
          badgeHtml = '<span class="event-spots-badge">' + spotsLeft + '/' + ev.spotsTotal + ' spots</span>';
        }
      } else {
        // Free/members: show going count
        badgeHtml = '<span class="event-spots-badge">' + ev.spotsTaken + ' going</span>';
      }
      footer.insertAdjacentHTML('afterbegin', badgeHtml);
    });
  }

  // Run after DOM ready + after API data loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(updateEventCardSpots, 100); });
  } else {
    setTimeout(updateEventCardSpots, 100);
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
  window.filterEvents = filterEvents;
  window.updateEventCardSpots = updateEventCardSpots;
  window.showRsvpListModal = showRsvpListModal;
  window.closeRsvpListModal = closeRsvpListModal;
  window.rsvpFromModal = rsvpFromModal;

  /**
   * Update events data from Supabase API response.
   * Called by auth.js after successful login when API data is available.
   * Merges API events into the existing clubEventsData object.
   */
  window.updateEventsFromAPI = function(apiEvents) {
    if (!Array.isArray(apiEvents)) return;
    var nextServerEventIds = apiEvents.map(function(ev) { return ev.id; });
    serverManagedEventIds.forEach(function(eventId) {
      if (nextServerEventIds.indexOf(eventId) === -1) {
        delete clubEventsData[eventId];
      }
    });
    serverManagedEventIds = nextServerEventIds;

    // Get current user's name for RSVP matching
    var currentUser = MTC.storage.get('mtc-user', null) || MTC.storage.get('mtc-current-user', null);
    var userName = currentUser ? (currentUser.name || '') : '';

    apiEvents.forEach(function(ev) {
      clubEventsData[ev.id] = {
        id: ev.id,
        title: ev.title,
        date: ev.date,
        time: ev.time,
        location: ev.location,
        badge: ev.badge,
        price: ev.price,
        spotsTotal: ev.spotsTotal,
        spotsTaken: ev.spotsTaken || 0,
        description: ev.description,
        type: ev.type,
        attendees: ev.attendees || [],
        rsvpCount: (ev.attendees || []).length
      };
    });

    // Rebuild userRsvps from API attendees (restore RSVP state on login/device switch)
    if (userName) {
      // Clear and rebuild from API truth
      userRsvps.length = 0;
      Object.keys(clubEventsData).forEach(function(eventId) {
        var ev = clubEventsData[eventId];
        if (ev.attendees) {
          // Replace real name with "You" for client-side display consistency
          var idx = ev.attendees.indexOf(userName);
          if (idx !== -1) {
            ev.attendees[idx] = 'You';
            userRsvps.push(eventId);
          }
        }
      });
      saveUserRsvps();

      // Rebuild event bookings list for My Bookings screen
      if (typeof MTC.state !== 'undefined') {
        MTC.state.eventBookings = [];
        userRsvps.forEach(function(eventId) {
          var ev = clubEventsData[eventId];
          if (ev) {
            MTC.state.eventBookings.push({
              eventId: eventId,
              type: ev.type || 'event',
              title: ev.title,
              date: ev.date,
              time: ev.time,
              location: ev.location || 'MTC Courts'
            });
          }
        });
        window.eventBookings = MTC.state.eventBookings;
        MTC.storage.set('mtc-event-bookings', MTC.state.eventBookings);
        if (typeof MTC.fn.renderEventBookings === 'function') MTC.fn.renderEventBookings();
      }
    }

    // Re-sync the UI
    if (typeof syncEventCardDates === 'function') syncEventCardDates();
    if (typeof updateEventCardSpots === 'function') updateEventCardSpots();
  };
})();
