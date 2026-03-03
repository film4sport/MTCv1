/**
 * booking.js - MTC Court - Enhanced CourtReserve-style Booking
 * IIFE Module: Court booking system, weekly grid, calendar view, event details
 */
(function() {
  'use strict';

  // ============================================
  // PRIVATE: Booking State
  // ============================================
  let currentWeekOffset = 0;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let selectedSlot = null;
  let selectedCalendarDay = null;
  let selectedWeekDay = null;

  // ============================================
  // BOOKING & EVENT DATA (populated from API after login)
  // ============================================
  const bookingsData = {};
  const eventsData = {};

  // Registered member lists (populated from API)
  const eventRegistrations = {};

  (function generateScheduleData() {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    function ds(dayOffset) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + dayOffset);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    // Individual bookings come from API via updateBookingsFromAPI()
    // No demo bookings generated here

    // ============================================
    // REAL MTC PROGRAMS (weekly recurring)
    // ============================================
    const programs = [
      // TUESDAY - Men's Round Robin 9-11am (starts before 9:30 bookable slot)
      { day:1, start:'9:00 AM', end:'11:00 AM', courts:[1,2], type:'roundrobin',
        title:"Men's Round Robin", fee:0, guestFee:10,
        coach: null, regKey:'mens-rr',
        desc:'Weekly men\'s round robin. All skill levels welcome.' },

      // THURSDAY AM - Freedom 55 League 9-11am
      { day:3, start:'9:00 AM', end:'11:00 AM', courts:[1,2], type:'openplay',
        title:'Freedom 55 League', fee:0, guestFee:10,
        coach: null, regKey:'freedom55',
        desc:'Weekday morning league for the 55+ crowd. Fun and social!' },

      // THURSDAY PM - Interclub Competitive A & B 7-9:30pm
      { day:3, start:'7:00 PM', end:'9:30 PM', courts:[1,2], type:'doubles',
        title:'Interclub Competitive League', fee:0, guestFee:0,
        coach: null, regKey:'thu-interclub-a', rsvp:true,
        desc:'Thursday night competitive interclub. Team A & B. RSVP required.' },

      // FRIDAY AM - Ladies Round Robin 9-11am
      { day:4, start:'9:00 AM', end:'11:00 AM', courts:[1,2], type:'roundrobin',
        title:"Ladies Round Robin", fee:0, guestFee:10,
        coach: null, regKey:'ladies-rr',
        desc:'Weekly ladies round robin. All skill levels welcome.' },

      // FRIDAY PM - Mixed Round Robin 6-9pm
      { day:4, start:'6:00 PM', end:'9:00 PM', courts:[1,2,3,4], type:'roundrobin',
        title:'Friday Night Mixed Round Robin', fee:0, guestFee:10,
        coach: null, regKey:'fri-mixed-rr',
        desc:'Weekly mixed doubles round robin. Bring a partner or get matched!' },

      // (Weekend Open Play and Sunday Mixed Doubles removed - not real MTC programs)
    ];

    programs.forEach(function(e) {
      const d = ds(e.day);
      if (!eventsData[d]) eventsData[d] = [];
      eventsData[d].push({
        startTime:e.start, endTime:e.end,
        courts: e.courts,
        type:e.type, title:e.title,
        fee:e.fee, guestFee:e.guestFee,
        coach:e.coach, regKey:e.regKey,
        rsvp:e.rsvp||false, desc:e.desc||'',
        registered: e.regKey ? (eventRegistrations[e.regKey]||[]) : []
      });
    });
    // ============================================
    // SPECIAL EVENTS (one-off, fixed dates)
    // ============================================
    const specialEvents = [
      { date:'2026-05-09', start:'12:30 PM', end:'3:00 PM', courts:[1,2,3,4], type:'openplay',
        title:'Opening Day BBQ & Round Robin', fee:0, guestFee:0,
        coach: null, regKey:null,
        desc:'Kick off the season! BBQ, music, and meet our coaching staff. All members, families, and guests welcome.' },
      { date:'2026-06-07', start:'1:00 PM', end:'4:00 PM', courts:[1,2,3,4], type:'roundrobin',
        title:'French Open Round Robin Social', fee:0, guestFee:0,
        coach: null, regKey:null,
        desc:'Celebrate the French Open with a themed round robin social! Mixed doubles, prizes, and refreshments.' },
      { date:'2026-07-12', start:'1:00 PM', end:'4:00 PM', courts:[1,2,3,4], type:'roundrobin',
        title:'Wimbledon Open Round Robin', fee:0, guestFee:0,
        coach: null, regKey:null,
        desc:'Wimbledon-themed round robin! Whites encouraged. Mixed doubles play, strawberries & cream, and great prizes.' }
    ];

    specialEvents.forEach(function(e) {
      if (!eventsData[e.date]) eventsData[e.date] = [];
      eventsData[e.date].push({
        startTime:e.start, endTime:e.end,
        courts: e.courts,
        type:e.type, title:e.title,
        fee:e.fee, guestFee:e.guestFee,
        coach:e.coach, regKey:e.regKey,
        rsvp:false, desc:e.desc,
        registered: []
      });
    });
  })();


  // ============================================
  // HELPERS
  // ============================================
  function formatDateStr(date) {
    return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  }

  function getWeekDates(offset) {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay()+6)%7) + (offset*7));
    const dates = [];
    for (let i=0;i<7;i++) { const d=new Date(monday); d.setDate(monday.getDate()+i); dates.push(d); }
    return dates;
  }

  function timeToMinutes(t) {
    // 12h: '10:00 AM', '1:30 PM'
    var m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m12) {
      var h = parseInt(m12[1]), min = parseInt(m12[2]), pm = m12[3].toUpperCase()==='PM';
      if (pm && h !== 12) h += 12;
      if (!pm && h === 12) h = 0;
      return h * 60 + min;
    }
    // 24h fallback: '19:00'
    var p = t.split(':');
    return parseInt(p[0]) * 60 + parseInt(p[1] || 0);
  }
  function timeToIndex(time) {
    var idx = MTC.config.timeSlots.indexOf(time);
    if (idx >= 0) return idx;
    // Time not in slots — find nearest slot by minutes
    var mins = timeToMinutes(time);
    for (var i = 0; i < MTC.config.timeSlots.length; i++) {
      if (timeToMinutes(MTC.config.timeSlots[i]) >= mins) return i;
    }
    return MTC.config.timeSlots.length;
  }

  function formatTimeLabel(time) {
    // Handle 12h AM/PM format (e.g. '10:00 AM', '1:30 PM')
    var ampmMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
      var h12 = parseInt(ampmMatch[1]);
      var min = parseInt(ampmMatch[2]);
      var period = ampmMatch[3].toLowerCase();
      if (min > 0) return h12 + ':' + String(min).padStart(2,'0') + period;
      return h12 + period;
    }
    // Fallback: 24h format (e.g. '19:00')
    var parts = time.split(':');
    var h = parseInt(parts[0]);
    var m = parseInt(parts[1] || 0);
    var suffix = h >= 12 ? 'pm' : 'am';
    var displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    if (m > 0) return displayH + ':' + String(m).padStart(2,'0') + suffix;
    return displayH + suffix;
  }

  function formatTimeRange(s,e) { return formatTimeLabel(s)+' \u2013 '+formatTimeLabel(e); }

  function getBookingAt(dateStr,time,court) {
    const d = bookingsData[dateStr]||[];
    for (let i=0;i<d.length;i++) { if (d[i].time===time && d[i].court===court) return d[i]; }
    return null;
  }

  function getEventAt(dateStr,time,court) {
    const d = eventsData[dateStr]||[];
    for (let i=0;i<d.length;i++) {
      const ev=d[i]; if (ev.courts.indexOf(court)===-1) continue;
      const si=timeToIndex(ev.startTime), ei=timeToIndex(ev.endTime), ti=timeToIndex(time);
      if (ti>=si && ti<ei) return ev;
    }
    return null;
  }

  function isEventStart(dateStr,time,court) {
    const d = eventsData[dateStr]||[];
    const ti = timeToIndex(time);
    for (let i=0;i<d.length;i++) {
      if (d[i].courts.indexOf(court)===-1) continue;
      // Match exact start OR first visible slot if event starts before grid
      const si = timeToIndex(d[i].startTime);
      if (d[i].startTime===time || (si <= 0 && ti === 0)) return d[i];
    }
    return null;
  }

  function getEventSpan(ev) { return timeToIndex(ev.endTime)-timeToIndex(ev.startTime); }

  // Check if a court is closed at a given time
  function isCourtClosed(court, time) {
    const closeTime = MTC.config.courtHours[court] ? MTC.config.courtHours[court].close : '22:00';
    return timeToMinutes(time) >= timeToMinutes(closeTime);
  }

  function timeToMinutes(time) {
    const parts = time.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
  }


  // ============================================
  // VIEW TOGGLE
  // ============================================
  function switchBookingView(view) {
    const wv=document.getElementById('weekView'), cv=document.getElementById('bookingCalendarView');
    const wb=document.getElementById('weekViewBtn'), cb=document.getElementById('bookingCalendarViewBtn');
    if (view==='week') {
      wv.style.display='flex'; cv.style.display='none';
      wb.classList.add('active'); cb.classList.remove('active');
      renderWeeklyGrid();
    } else {
      wv.style.display='none'; cv.style.display='flex';
      wb.classList.remove('active'); cb.classList.add('active');
      renderCalendar();
    }
  }


  // ============================================
  // WEEKLY GRID - CourtReserve Style
  // ============================================
  function changeWeek(dir) { currentWeekOffset+=dir; selectedWeekDay=null; renderWeeklyGrid(); }
  function selectWeekDay(idx) { selectedWeekDay=idx; renderWeeklyGrid(); }

  function renderWeeklyGrid() {
    const gridBody=document.getElementById('weeklyGridBody');
    const weekLabel=document.getElementById('weekLabel');
    const weekDatesEl=document.getElementById('weekDates');
    if (!gridBody) return;
    try {

    const dates=getWeekDates(currentWeekOffset);
    const dayN=MTC.config.dayNamesShort.slice(1).concat(MTC.config.dayNamesShort[0]);
    const moN=MTC.config.monthNamesShort;
    const todayStr=formatDateStr(new Date());

    if (weekLabel) {
      if (currentWeekOffset===0) weekLabel.textContent='THIS WEEK';
      else if (currentWeekOffset===1) weekLabel.textContent='NEXT WEEK';
      else if (currentWeekOffset===-1) weekLabel.textContent='LAST WEEK';
      else weekLabel.textContent='';
    }
    if (weekDatesEl) weekDatesEl.textContent=moN[dates[0].getMonth()]+' '+dates[0].getDate()+' \u2013 '+moN[dates[6].getMonth()]+' '+dates[6].getDate();

    if (selectedWeekDay===null) {
      selectedWeekDay=0;
      for (let i=0;i<7;i++) { if (formatDateStr(dates[i])===todayStr) { selectedWeekDay=i; break; } }
    }

    const selectedDate=dates[selectedWeekDay];
    const dateStr=formatDateStr(selectedDate);
    const todayMidnight=new Date(); todayMidnight.setHours(0,0,0,0);
    const isPastDay=selectedDate<todayMidnight;

    // Day tabs
    let tabsC=document.getElementById('weekDayTabs');
    if (!tabsC) {
      tabsC=document.createElement('div'); tabsC.id='weekDayTabs'; tabsC.className='week-day-tabs';
      const gc=gridBody.closest('.weekly-grid-container');
      if (gc) gc.parentNode.insertBefore(tabsC,gc);
    }
    let th='';
    for (let t=0;t<7;t++) {
      const isT=formatDateStr(dates[t])===todayStr, isS=t===selectedWeekDay;
      let tc='week-day-tab'; if (isS) tc+=' active'; if (isT) tc+=' today';
      const tabDs=formatDateStr(dates[t]);
      const dayEv=eventsData[tabDs]||[];
      let dots='';
      if (dayEv.length>0) {
        dots='<span class="day-tab-dots">';
        const shown={};
        for (let e=0;e<dayEv.length&&Object.keys(shown).length<4;e++) {
          const et=dayEv[e].type;
          if (!shown[et]) { shown[et]=true; dots+='<span class="day-dot" style="background:'+MTC.config.eventTypes[et].color+'"></span>'; }
        }
        dots+='</span>';
      }
      th+='<button class="'+tc+'" onclick="selectWeekDay('+t+')"><span class="week-day-tab-name">'+sanitizeHTML(dayN[t])+'</span><span class="week-day-tab-date">'+dates[t].getDate()+'</span>'+dots+'</button>';
    }
    tabsC.innerHTML=th;

    // Build covered cells map
    const covered={};
    (eventsData[dateStr]||[]).forEach(function(ev) {
      const si=timeToIndex(ev.startTime), ei=timeToIndex(ev.endTime);
      ev.courts.forEach(function(c) { for (let ti=si;ti<ei;ti++) covered[MTC.config.timeSlots[ti]+'-'+c]=true; });
    });

    // Grid rows
    let html='';
    MTC.config.timeSlots.forEach(function(time,rowIdx) {
      html+='<div class="weekly-grid-row" data-row="'+rowIdx+'">';
      html+='<div class="weekly-time-cell">'+formatTimeLabel(time)+'</div>';

      MTC.config.courts.forEach(function(co) {
        const court=co.id, ck=time+'-'+court;
        const booking=getBookingAt(dateStr,time,court);
        const evStart=isEventStart(dateStr,time,court);
        let sc='weekly-slot', inner='', click='';

        if (isPastDay) {
          sc+=' past'; inner='<span class="slot-dash">\u2014</span>';
        } else if (isCourtClosed(court, time)) {
          sc+=' closed'; inner='<span class="slot-dash closed-label">Closed</span>';
        } else if (evStart) {
          const ev=evStart, span=getEventSpan(ev), info=MTC.config.eventTypes[ev.type]||MTC.config.eventTypes.reserved;
          sc+=' event-start';
          const bh='calc('+span+' * (var(--grid-row-height, 48px) + 1px) - 1px)';
          const regCount=(ev.registered||[]).length;
          const st=regCount>0?'<span class="ev-slots">'+regCount+' going</span>':'<span class="ev-slots">Open</span>';
          inner='<div class="event-block" style="height:'+bh+';background:'+info.color+';color:'+info.textColor+';" onclick="event.stopPropagation();showEventDetail(\''+dateStr+'\',\''+ev.startTime+'\','+court+')"><span class="ev-title">'+sanitizeHTML(ev.title)+'</span><span class="ev-time">'+formatTimeRange(ev.startTime,ev.endTime)+'</span>'+st+'</div>';
        } else if (covered[ck]) {
          sc+=' event-covered';
        } else if (booking) {
          if (booking.user==='You') {
            sc+=' my-booking'; inner='<span class="slot-label mine-label">\ud83c\udfbe MY COURT</span>';
          } else {
            sc+=' booked'; inner='<span class="slot-label booked-label">'+sanitizeHTML(booking.user)+'</span>';
          }
          click=' onclick="selectSlot(this)" tabindex="0" role="button"';
        } else {
          sc+=' available'; inner='<span class="slot-book-btn">Book</span>';
          click=' onclick="selectSlot(this)" tabindex="0" role="button" aria-label="Book '+formatTimeLabel(time)+' '+co.name+'"';
        }

        html+='<div class="'+sc+'" data-date="'+dateStr+'" data-time="'+time+'" data-court="'+court+'"'+click+'>'+inner+'</div>';
      });
      html+='</div>';
    });
    gridBody.innerHTML=html;

    // Floodlight headers
    const headers=document.querySelectorAll('#screen-book .weekly-grid-header .court-header');
    headers.forEach(function(h,idx) {
      const c=MTC.config.courts[idx];
      if (c) h.innerHTML=sanitizeHTML(c.name)+(c.floodlight?' <span class="floodlight-icon" title="Floodlights">\ud83d\udca1</span>':'');
    });
    } catch(e) {
      console.warn('renderWeeklyGrid error:', e);
      MTC.fn.renderError(gridBody, 'Could not load the booking grid. Please try again.');
    }
  }


  // ============================================
  // ACCESSIBILITY: Keyboard handler for grid slots
  // ============================================
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const slot = e.target.closest('.weekly-slot[role="button"]');
    if (!slot) return;
    e.preventDefault();
    slot.click();
  });

  // ============================================
  // EVENT DETAIL CARD
  // ============================================
  function showEventDetail(dateStr,startTime,court) {
    const dayEv=eventsData[dateStr]||[];
    let ev=null;
    for (let i=0;i<dayEv.length;i++) {
      if (dayEv[i].startTime===startTime && dayEv[i].courts.indexOf(court)!==-1) { ev=dayEv[i]; break; }
    }
    if (!ev) return;

    const info=MTC.config.eventTypes[ev.type]||MTC.config.eventTypes.reserved;
    const d=new Date(dateStr+'T12:00:00');
    const days=MTC.config.dayNamesFull;
    const mos=MTC.config.monthNamesShort;
    const dateLbl=days[d.getDay()]+', '+mos[d.getMonth()]+' '+d.getDate();
    // Determine if this is a social event (no courts/fees to show)
    const isSocialEvent = ['roundrobin', 'openplay', 'doubles', 'social'].indexOf(ev.type) !== -1;

    // Court names - only show for non-social events
    const courtNames=ev.courts.map(function(c){return 'Court '+c;}).join(', ');
    const courtHtml = isSocialEvent ? '' : '<div class="event-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="2"></rect><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg> '+sanitizeHTML(courtNames)+'</div>';

    // Fee display - only show for non-social events
    const feeText = ev.fee > 0 ? '$'+ev.fee.toFixed(2) : 'FREE for members';
    const feeHtml = isSocialEvent ? '' : '<div class="event-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> '+sanitizeHTML(feeText)+'</div>';
    let guestFeeHtml = '';
    if (!isSocialEvent && ev.guestFee && ev.guestFee > 0) {
      guestFeeHtml = '<div class="event-meta-row guest-fee"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg> Non-members: $'+ev.guestFee.toFixed(2)+'</div>';
    }

    const regCount = (ev.registered||[]).length;
    const slotsClass = '';
    const slotsText = regCount > 0 ? regCount + ' registered' : 'Be the first to sign up!';
    let btnText = ev.rsvp ? 'RSVP' : 'REGISTER';
    const btnClass = '';

    // Non-member: show fee on button
    let userIsMember = true;
    if (typeof memberPaymentData !== 'undefined' && memberPaymentData.currentUser) {
      userIsMember = memberPaymentData.currentUser.isMember !== false;
    }
    if (!userIsMember && ev.guestFee > 0 && btnText === 'REGISTER') {
      btnText = 'REGISTER \u2014 $' + ev.guestFee.toFixed(2);
    }

    // Coach info
    let coachHtml = '';
    if (ev.coach) {
      coachHtml = '<div class="event-meta-row coach-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Coach: <strong>'+sanitizeHTML(ev.coach)+'</strong></div>';
    }

    // Registered members list (publicly visible)
    const regList = ev.registered || [];
    let regHtml = '';
    if (regList.length > 0) {
      regHtml = '<div class="event-reg-list"><div class="event-reg-title">Registered ('+regList.length+')</div><div class="event-reg-members">';
      regList.forEach(function(name) {
        const isYou = name === 'You';
        regHtml += '<span class="reg-member'+(isYou?' you':'')+'">'+sanitizeHTML(name)+'</span>';
      });
      regHtml += '</div></div>';
    }

    const descHtml = ev.desc ? '<div class="event-detail-desc">'+sanitizeHTML(ev.desc)+'</div>' : '';

    const existing=document.getElementById('eventDetailCard');
    if (existing) existing.remove();

    const card=document.createElement('div');
    card.id='eventDetailCard';
    card.className='event-detail-overlay';
    card.onclick=function(e){if(e.target===card)card.remove();};

    const tennisBallSvg = '<svg class="event-tennis-ball" viewBox="0 0 100 100" width="48" height="48">' +
      '<circle cx="50" cy="50" r="48" fill="#c8ff00" stroke="#a8d600" stroke-width="2"/>' +
      '<path d="M 18 22 Q 50 48 18 78" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M 82 22 Q 50 48 82 78" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '</svg>';

    card.innerHTML=
      '<div class="event-detail-card">'+
        '<button class="event-detail-close" onclick="document.getElementById(\'eventDetailCard\').remove()" aria-label="Close">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'+
        '</button>'+
        '<div class="event-detail-top">'+
          tennisBallSvg +
          '<div class="event-detail-badge" style="background:'+info.color+';color:'+info.textColor+'">'+sanitizeHTML(info.label)+'</div>'+
        '</div>'+
        '<div class="event-detail-title">'+sanitizeHTML(ev.title)+'</div>'+
        descHtml +
        '<div class="event-detail-meta">'+
          '<div class="event-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> '+sanitizeHTML(dateLbl)+'</div>'+
          '<div class="event-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> '+formatTimeRange(ev.startTime,ev.endTime)+'</div>'+
          courtHtml +
          feeHtml +
          guestFeeHtml +
          coachHtml +
        '</div>'+
        '<div class="event-detail-slots '+slotsClass+'"><span class="slots-dot"></span> '+sanitizeHTML(slotsText)+'</div>'+
        regHtml +
        '<button class="event-detail-btn '+btnClass+'" onclick="registerForGridEvent(\''+dateStr+'\',\''+ev.startTime+'\','+court+')">'+sanitizeHTML(btnText)+'</button>'+
      '</div>';

    const app=document.getElementById('app')||document.body;
    app.appendChild(card);
    requestAnimationFrame(function(){card.classList.add('show');});
  }

  function registerForGridEvent(dateStr,startTime,court) {
    const card=document.getElementById('eventDetailCard');
    if (card) card.remove();

    const dayEv=eventsData[dateStr]||[];
    let ev=null;
    for (let i=0;i<dayEv.length;i++) {
      if (dayEv[i].startTime===startTime && dayEv[i].courts.indexOf(court)!==-1) { ev=dayEv[i]; break; }
    }

    const msg = ev && ev.rsvp ? "RSVP confirmed! You're on the list." : "You're registered! See you on the court \ud83c\udfbe";
    showToast(msg);

    // Add to My Bookings
    if (ev) {
      addEventToMyBookings(ev.title + '-' + dateStr, ev.rsvp ? 'interclub' : 'event', {
        title: ev.title,
        date: dateStr,
        time: formatTimeRange(ev.startTime, ev.endTime),
        location: ev.courts ? 'Court ' + ev.courts.join(', ') : 'MTC Courts'
      });
    }

    if (ev && ev.coach) {
      showPushNotification('Coach Notified', sanitizeHTML(ev.coach) + ' has been notified of your registration for ' + sanitizeHTML(ev.title), '\ud83c\udfbe');
    } else {
      showPushNotification('Event Registered', "You're signed up! Check your schedule.", '\ud83c\udfbe');
    }

    if (ev && ev.registered && ev.registered.indexOf('You') === -1) {
      ev.registered.push('You');
    }

    // Non-member: show payment popup if event has a guest fee
    let userIsMember = true;
    if (typeof memberPaymentData !== 'undefined' && memberPaymentData.currentUser) {
      userIsMember = memberPaymentData.currentUser.isMember !== false;
    }
    if (!userIsMember && ev && ev.guestFee > 0) {
      setTimeout(function() {
        showNonMemberEventPayment(ev.title, ev.guestFee);
      }, 800);
    }
  }


  // ============================================
  // NON-MEMBER / GUEST BOOKING (future: separate login flow)
  // ============================================

  // Guest payment popup - shown when a non-member books a court
  function showGuestPaymentPopup(courtNum, time) {
    const existing = document.getElementById('guestPaymentPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'guestPaymentPopup';
    popup.className = 'event-detail-overlay';
    popup.onclick = function(e) { if (e.target === popup) popup.remove(); };

    const tennisBall = '<svg viewBox="0 0 100 100" width="56" height="56">' +
      '<circle cx="50" cy="50" r="48" fill="#c8ff00" stroke="#a8d600" stroke-width="2"/>' +
      '<path d="M 18 22 Q 50 48 18 78" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M 82 22 Q 50 48 82 78" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '<line x1="12" y1="1" x2="12" y2="23" transform="translate(38,25) scale(1.2)" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" transform="translate(38,25) scale(1.2)" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';

    popup.innerHTML =
      '<div class="event-detail-card" style="text-align:center;">' +
        '<button class="event-detail-close" onclick="document.getElementById(\'guestPaymentPopup\').remove()" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
        '<div style="margin-bottom:16px;">' + tennisBall + '</div>' +
        '<div class="event-detail-title" style="color:var(--coral);">GUEST BOOKING \u2014 $' + MTC.config.fees.guest.toFixed(2) + '</div>' +
        '<div class="event-detail-desc" style="text-align:center;">Court ' + sanitizeHTML(String(courtNum)) + ' has been booked for your guest.</div>' +
        '<div class="guest-payment-box">' +
          '<div class="guest-payment-label">Please send e-transfer to:</div>' +
          '<div class="guest-payment-email" onclick="copyGuestEmail()">monotennis.payment@gmail.com</div>' +
          '<div class="guest-payment-amount">Amount: <strong>$' + MTC.config.fees.guest.toFixed(2) + '</strong></div>' +
          '<div class="guest-payment-note">Include your name & court time in the message</div>' +
        '</div>' +
        '<button class="event-detail-btn" onclick="copyGuestEmail(); document.getElementById(\'guestPaymentPopup\').remove();" style="margin-top:12px;">COPY EMAIL & CLOSE</button>' +
      '</div>';

    const app = document.getElementById('app') || document.body;
    app.appendChild(popup);
    requestAnimationFrame(function() { popup.classList.add('show'); });
  }

  function copyGuestEmail() {
    const email = 'monotennis.payment@gmail.com';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).then(function() {
        showToast('Email copied: ' + email);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Email copied: ' + email);
    }
  }

  // Non-member event registration payment popup
  function showNonMemberEventPayment(eventTitle, fee) {
    const existing = document.getElementById('guestPaymentPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'guestPaymentPopup';
    popup.className = 'event-detail-overlay';
    popup.onclick = function(e) { if (e.target === popup) popup.remove(); };

    const tennisBall = '<svg viewBox="0 0 100 100" width="56" height="56">' +
      '<circle cx="50" cy="50" r="48" fill="#c8ff00" stroke="#a8d600" stroke-width="2"/>' +
      '<path d="M 18 22 Q 50 48 18 78" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M 82 22 Q 50 48 82 78" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '</svg>';

    popup.innerHTML =
      '<div class="event-detail-card" style="text-align:center;">' +
        '<button class="event-detail-close" onclick="document.getElementById(\'guestPaymentPopup\').remove()" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
        '<div style="margin-bottom:16px;">' + tennisBall + '</div>' +
        '<div class="event-detail-title" style="color:var(--coral);">NON-MEMBER FEE \u2014 $' + fee.toFixed(2) + '</div>' +
        '<div class="event-detail-desc" style="text-align:center;">You\'re registered for <strong>' + sanitizeHTML(eventTitle) + '</strong>!</div>' +
        '<div class="guest-payment-box">' +
          '<div class="guest-payment-label">Please send e-transfer to:</div>' +
          '<div class="guest-payment-email" onclick="copyGuestEmail()">monotennis.payment@gmail.com</div>' +
          '<div class="guest-payment-amount">Amount: <strong>$' + fee.toFixed(2) + '</strong></div>' +
          '<div class="guest-payment-note">Include your name & the program name in the message</div>' +
        '</div>' +
        '<button class="event-detail-btn" onclick="copyGuestEmail(); document.getElementById(\'guestPaymentPopup\').remove();" style="margin-top:12px;">COPY EMAIL & CLOSE</button>' +
      '</div>';

    const app = document.getElementById('app') || document.body;
    app.appendChild(popup);
    requestAnimationFrame(function() { popup.classList.add('show'); });
  }


  // ============================================
  // SLOT SELECTION
  // ============================================
  function selectSlot(el) {
    if (el.classList.contains('booked')||el.classList.contains('past')||el.classList.contains('closed')||el.classList.contains('event-covered')||el.classList.contains('event-start')) {
      showToast('This slot is not available'); return;
    }
    if (el.classList.contains('my-booking')) { showToast('This is your existing booking'); return; }
    document.querySelectorAll('.weekly-slot.selected').forEach(function(s){s.classList.remove('selected');});
    el.classList.add('selected');

    selectedSlot={date:el.dataset.date, time:el.dataset.time, court:el.dataset.court};

    const dateEl=document.getElementById('summaryDate');
    const timeEl=document.getElementById('summaryTime');
    const courtEl=document.getElementById('summaryCourt');

    const d=new Date(selectedSlot.date+'T12:00:00');
    const mos=MTC.config.monthNamesShort;
    const dayNames=MTC.config.dayNamesShort;

    dateEl.textContent=dayNames[d.getDay()]+', '+mos[d.getMonth()]+' '+d.getDate();
    const hour=parseInt(selectedSlot.time.split(':')[0]);
    timeEl.textContent=hour>12?(hour-12)+':00 PM':(hour===12?'12:00 PM':hour+':00 AM');
    courtEl.textContent='Court '+selectedSlot.court;

    const feeEl=document.getElementById('summaryFee');
    const creditNote=document.getElementById('summaryCreditNote');
    const creditText=document.getElementById('summaryCreditText');
    const creditExplain=document.getElementById('summaryCreditExplain');
    const paymentBox=document.getElementById('paymentInfoBox');
    const paymentTitle=document.getElementById('paymentInfoTitle');
    const paymentText=document.getElementById('paymentInfoText');
    const paymentNote=document.getElementById('paymentInfoNote');

    // Hide credit note/explain (legacy)
    if (creditNote) creditNote.style.display='none';
    if (creditExplain) creditExplain.style.display='none';

    // Check if user is a member or non-member
    let isMember = true;
    if (typeof memberPaymentData !== 'undefined' && memberPaymentData.currentUser) {
      isMember = memberPaymentData.currentUser.isMember !== false;
    }

    if (isMember) {
      if (feeEl) feeEl.textContent='FREE';
      if (paymentBox){
        paymentBox.className='booking-modal-payment-info covered';
        paymentTitle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg> Free for Members';
        paymentText.innerHTML='Court bookings are <strong>free</strong> for all MTC members.';
        paymentNote.textContent='Cancel 24+ hrs in advance to free up the slot for others.';
      }
    } else {
      if (feeEl) feeEl.textContent='$10.00';
      if (paymentBox){
        paymentBox.className='booking-modal-payment-info warning';
        paymentTitle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Court Fee: $10.00';
        paymentText.innerHTML='Non-member court fee is <strong>$10/hr</strong>. After booking, you will be prompted to send an <strong>e-transfer</strong> to <strong>monotennis.payment@gmail.com</strong>.';
        paymentNote.textContent='Include your name and court time in the e-transfer message.';
      }
    }
    openBookingModal();
  }

  function openBookingModal() {
    const m=document.getElementById('bookingModal'); if(!m) return;
    m.classList.add('active'); document.body.style.overflow='hidden';
    if (MTC.fn.manageFocus) MTC.fn.manageFocus(m);
  }

  function closeBookingModal(event) {
    if (event&&event.target!==event.currentTarget) return;
    const m=document.getElementById('bookingModal'); if(!m) return;
    m.classList.remove('active'); document.body.style.overflow='';
    document.querySelectorAll('.weekly-slot.selected').forEach(function(s){s.classList.remove('selected');});
  }


  // ============================================
  // CONFIRM BOOKING
  // ============================================
  function confirmBooking() {
    if (typeof confirmBookingPayment==='function'){confirmBookingPayment();return;}
    if (!selectedSlot||!selectedSlot.date||!selectedSlot.time||!selectedSlot.court){showToast('Please select a time slot first');closeBookingModal();return;}

    const slotDate=new Date(selectedSlot.date); const now=new Date();now.setHours(0,0,0,0);
    if (slotDate<now){showToast('Cannot book a past date');return;}

    const btn=document.querySelector('.booking-confirm-btn');
    if (btn){btn.disabled=true;btn.textContent='BOOKING...';btn.style.transform='scale(0.97)';btn.style.opacity='0.7';}

    var bookedForName = (typeof getActiveDisplayName === 'function') ? getActiveDisplayName() : '';
    var userName = MTC.storage.get('mtc-user-name', '');
    var courtId = parseInt(selectedSlot.court.replace(/\D/g, ''), 10) || 1;

    var bookingData = {
      courtId: courtId,
      courtName: 'Court ' + selectedSlot.court,
      date: selectedSlot.date,
      time: selectedSlot.time,
      userName: userName,
      bookedFor: (MTC.state.activeFamilyMember && bookedForName) ? bookedForName : undefined,
      type: 'court'
    };

    function resetBtn() {
      if (btn){btn.disabled=false;btn.style.transform='';btn.style.opacity='';btn.innerHTML='CONFIRM & BOOK <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';}
    }

    // Use the real API client if available, fall back to optimistic-only for offline
    if (MTC.fn.createBooking && MTC.storage.get('mtc-access-token')) {
      MTC.fn.createBooking(bookingData,
        function onSuccess() {
          var toastMsg = 'Court '+selectedSlot.court+' booked for '+selectedSlot.time+'!';
          if (bookedForName && MTC.state.activeFamilyMember) toastMsg = bookedForName + ': ' + toastMsg;
          showToast(toastMsg);
          closeBookingModal();
          document.querySelectorAll('.weekly-slot.selected').forEach(function(s){
            s.classList.remove('selected','available');s.classList.add('my-booking');
            s.innerHTML='<span class="slot-label mine-label">\ud83c\udfbe MY COURT</span>';
          });
          selectedSlot=null;
          resetBtn();
          showModal(); triggerBookingNotification();
        },
        function onError(err) {
          resetBtn();
          showToast(err || 'Booking failed — please try again', 'error');
        }
      );
    } else {
      // Offline / no token: queue for background sync
      if (MTC.fn.queueForSync) {
        MTC.fn.queueForSync('booking', bookingData);
      }
      var toastMsg = 'Court '+selectedSlot.court+' booked for '+selectedSlot.time+'!';
      if (bookedForName && MTC.state.activeFamilyMember) toastMsg = bookedForName + ': ' + toastMsg;
      showToast(toastMsg + ' (will sync when online)');
      closeBookingModal();
      document.querySelectorAll('.weekly-slot.selected').forEach(function(s){
        s.classList.remove('selected','available');s.classList.add('my-booking');
        s.innerHTML='<span class="slot-label mine-label">\ud83c\udfbe MY COURT</span>';
      });
      selectedSlot=null;
      resetBtn();
      showModal(); triggerBookingNotification();
    }
  }


  // ============================================
  // CALENDAR VIEW - Enhanced
  // ============================================
  function renderCalendar() {
    const moN=MTC.config.monthNamesFull;
    const moEl=document.getElementById('calendarMonth');
    if (moEl) moEl.textContent=moN[currentMonth]+' '+currentYear;

    const fd=new Date(currentYear,currentMonth,1), ld=new Date(currentYear,currentMonth+1,0);
    const sd=fd.getDay(), td=ld.getDate(), today=new Date();
    const cDays=document.getElementById('calendarDays'); if(!cDays) return;

    let html='';
    const pm=new Date(currentYear,currentMonth,0);
    for(let i=sd-1;i>=0;i--) html+='<div class="calendar-day other-month">'+(pm.getDate()-i)+'</div>';

    for(let day=1;day<=td;day++){
      const d=new Date(currentYear,currentMonth,day), ds=formatDateStr(d);
      const isT=d.toDateString()===today.toDateString();
      const isP=d<new Date(today.getFullYear(),today.getMonth(),today.getDate());
      const hB=bookingsData[ds]&&bookingsData[ds].length>0;
      const hE=eventsData[ds]&&eventsData[ds].length>0;
      let cls='calendar-day';
      if(isT) cls+=' today'; if(isP) cls+=' past';
      if(hB||hE) cls+=' has-booking';
      if(selectedCalendarDay===ds) cls+=' selected';

      let dots='';
      if(hE){
        dots='<div class="cal-day-dots">';
        const shown={}, de=eventsData[ds];
        for(let e=0;e<de.length&&Object.keys(shown).length<3;e++){
          const et=de[e].type;
          if(!shown[et]){shown[et]=true;dots+='<span class="cal-dot" style="background:'+MTC.config.eventTypes[et].color+'"></span>';}
        }
        dots+='</div>';
      } else if(hB){
        dots='<div class="cal-day-dots"><span class="cal-dot" style="background:#c8ff00"></span></div>';
      }
      html+='<div class="'+cls+'" onclick="selectCalendarDay(\''+ds+'\')"><span class="cal-day-num">'+day+'</span>'+dots+'</div>';
    }

    const rem=42-(sd+td);
    for(let j=1;j<=rem;j++) html+='<div class="calendar-day other-month">'+j+'</div>';
    cDays.innerHTML=html;
  }

  function changeMonth(dir){
    currentMonth+=dir;
    if(currentMonth>11){currentMonth=0;currentYear++;}
    if(currentMonth<0){currentMonth=11;currentYear--;}
    selectedCalendarDay=null; renderCalendar();
  }

  function selectCalendarDay(dateStr){
    selectedCalendarDay=dateStr; renderCalendar();
    const container=document.getElementById('dayTimeSlotsContainer');
    const grid=document.getElementById('dayTimeSlotsGrid');
    const title=document.getElementById('selectedDayTitle');
    if(!container||!grid) return;

    const d=new Date(dateStr+'T12:00:00');
    const dayN=MTC.config.dayNamesFull;
    const moN=MTC.config.monthNamesShort;
    if(title) title.textContent=dayN[d.getDay()]+', '+moN[d.getMonth()]+' '+d.getDate();

    // Events list cards
    const dayEv=eventsData[dateStr]||[];
    let evHtml='';
    if(dayEv.length>0){
      evHtml='<div class="cal-day-events">';
      dayEv.forEach(function(ev){
        const info=MTC.config.eventTypes[ev.type];
        const cn=ev.courts.map(function(c){return 'Ct '+c;}).join(', ');
        const regCt=(ev.registered||[]).length; const st=regCt>0?regCt+' going':'Open';
        evHtml+='<div class="cal-event-card" style="border-left:4px solid '+info.color+'" onclick="showEventDetail(\''+dateStr+'\',\''+ev.startTime+'\','+ev.courts[0]+')">'+
          '<div class="cal-ev-header"><span class="cal-ev-badge" style="background:'+info.color+';color:'+info.textColor+'">'+sanitizeHTML(info.label)+'</span><span class="cal-ev-slots '+''+'">'+sanitizeHTML(st)+'</span></div>'+
          '<div class="cal-ev-title">'+sanitizeHTML(ev.title)+'</div>'+
          '<div class="cal-ev-info">'+formatTimeRange(ev.startTime,ev.endTime)+' \u00b7 '+sanitizeHTML(cn)+'</div></div>';
      });
      evHtml+='</div>';
    }

    const existingList=container.querySelector('.cal-day-events');
    if(existingList) existingList.remove();
    if(evHtml){
      const tmp=document.createElement('div'); tmp.innerHTML=evHtml;
      const gw=container.querySelector('.weekly-grid-container');
      if(gw) container.insertBefore(tmp.firstChild,gw);
    }

    // Grid
    const isPast=d<new Date(new Date().setHours(0,0,0,0));
    const covered={};
    dayEv.forEach(function(ev){
      const si=timeToIndex(ev.startTime),ei=timeToIndex(ev.endTime);
      ev.courts.forEach(function(c){for(let ti=si;ti<ei;ti++) covered[MTC.config.timeSlots[ti]+'-'+c]=true;});
    });

    let html='';
    MTC.config.timeSlots.forEach(function(time,rowIdx){
      html+='<div class="weekly-grid-row" data-row="'+rowIdx+'">';
      html+='<div class="weekly-time-cell">'+formatTimeLabel(time)+'</div>';
      MTC.config.courts.forEach(function(co){
        const court=co.id,ck=time+'-'+court;
        const booking=getBookingAt(dateStr,time,court);
        const evStart=isEventStart(dateStr,time,court);
        let sc='weekly-slot',inner='',click='';

        if(isPast){sc+=' past';inner='<span class="slot-dash">\u2014</span>';}
        else if(isCourtClosed(court,time)){sc+=' closed';inner='<span class="slot-dash closed-label">Closed</span>';}
        else if(evStart){
          const ev=evStart,span=getEventSpan(ev),info=MTC.config.eventTypes[ev.type];sc+=' event-start';
          const bh='calc('+span+' * (var(--grid-row-height, 48px) + 1px) - 1px)';
          const regCt2=(ev.registered||[]).length; const st=regCt2>0?'<span class="ev-slots">'+regCt2+' going</span>':'<span class="ev-slots">Open</span>';
          inner='<div class="event-block" style="height:'+bh+';background:'+info.color+';color:'+info.textColor+';" onclick="event.stopPropagation();showEventDetail(\''+dateStr+'\',\''+ev.startTime+'\','+court+')"><span class="ev-title">'+sanitizeHTML(ev.title)+'</span><span class="ev-time">'+formatTimeRange(ev.startTime,ev.endTime)+'</span>'+st+'</div>';
        } else if(covered[ck]){sc+=' event-covered';}
        else if(booking){
          if(booking.user==='You'){sc+=' my-booking';inner='<span class="slot-label mine-label">\ud83c\udfbe MY COURT</span>';}
          else{sc+=' booked';inner='<span class="slot-label booked-label">'+sanitizeHTML(booking.user)+'</span>';}
          click=' onclick="selectSlot(this)"';
        } else {
          sc+=' available';inner='<span class="slot-book-btn">Book</span>';click=' onclick="selectSlot(this)"';
        }
        html+='<div class="'+sc+'" data-date="'+dateStr+'" data-time="'+time+'" data-court="'+court+'"'+click+'>'+inner+'</div>';
      });
      html+='</div>';
    });
    grid.innerHTML=html;
    container.style.display='flex';

    const headers=container.querySelectorAll('.court-header');
    headers.forEach(function(h,idx){const c=MTC.config.courts[idx];if(c) h.innerHTML=sanitizeHTML(c.name)+(c.floodlight?' <span class="floodlight-icon" title="Floodlights">\ud83d\udca1</span>':'');});
  }


  // ============================================
  // SCHEDULE HELPERS
  // ============================================
  function switchScheduleView(view){
    document.querySelectorAll('.schedule-view').forEach(function(v){v.classList.remove('active');});
    document.querySelectorAll('.view-toggle-btn').forEach(function(b){b.classList.remove('active');});
    const ve=document.getElementById(view+'View'),be=document.getElementById(view+'ViewBtn');
    if(ve)ve.classList.add('active');if(be)be.classList.add('active');
    if(view==='calendar')generateCalendar();
  }
  function switchScheduleTab(tab){
    document.querySelectorAll('.schedule-tab').forEach(function(t){t.classList.remove('active');});
    document.querySelectorAll('.schedule-content').forEach(function(c){c.classList.remove('active');});
    const te=document.getElementById(tab+'Tab'),ce=document.getElementById(tab+'Content');
    if(te)te.classList.add('active');if(ce)ce.classList.add('active');
  }
  function animateCountUp(){
    document.querySelectorAll('[data-count]').forEach(function(el){
      const target=parseInt(el.getAttribute('data-count'));
      let current=0;
      const inc=target/30;
      const timer=setInterval(function(){current+=inc;if(current>=target){el.textContent=target;clearInterval(timer);}else{el.textContent=Math.floor(current);}},30);
    });
  }
  function initBookingSystem(){renderWeeklyGrid();}

  // ============================================
  // EXPORTS: MTC.state, MTC.fn, window
  // ============================================

  // Shared state - bookingsData is a mutable object, export the reference
  MTC.state.bookingsData = bookingsData;
  window.bookingsData = bookingsData; // Backward-compat alias

  // selectedSlot needs getter/setter since it's reassigned
  Object.defineProperty(MTC.state, 'selectedSlot', {
    get: function() { return selectedSlot; },
    set: function(val) { selectedSlot = val; },
    enumerable: true,
    configurable: true
  });
  // Backward-compat: other files reference `selectedSlot` globally
  Object.defineProperty(window, 'selectedSlot', {
    get: function() { return selectedSlot; },
    set: function(val) { selectedSlot = val; },
    enumerable: true,
    configurable: true
  });

  // eventsData is only used in booking.js but expose for safety
  window.eventsData = eventsData;

  // Shared functions
  /** Renders the weekly court booking grid for the current week offset */
  MTC.fn.renderWeeklyGrid = renderWeeklyGrid;
  window.renderWeeklyGrid = renderWeeklyGrid; // Backward-compat alias

  // Window exports for HTML onclick handlers
  window.selectSlot = selectSlot;
  window.selectWeekDay = selectWeekDay;
  window.changeWeek = changeWeek;
  window.switchBookingView = switchBookingView;
  window.changeMonth = changeMonth;
  window.selectCalendarDay = selectCalendarDay;
  window.showEventDetail = showEventDetail;
  window.confirmBooking = confirmBooking;
  window.closeBookingModal = closeBookingModal;
  window.registerForGridEvent = registerForGridEvent;
  window.showNonMemberEventPayment = showNonMemberEventPayment;
  window.showGuestPaymentPopup = showGuestPaymentPopup;
  window.copyGuestEmail = copyGuestEmail;
  window.switchScheduleView = switchScheduleView;
  window.switchScheduleTab = switchScheduleTab;
  window.animateCountUp = animateCountUp;
  window.initBookingSystem = initBookingSystem;
  window.formatDateStr = formatDateStr;
  window.formatTimeLabel = formatTimeLabel;
  window.formatTimeRange = formatTimeRange;

  /**
   * Update bookings data from Supabase API.
   * Called by auth.js after login when API data is available.
   * Merges real bookings into the booking grid.
   */
  window.updateBookingsFromAPI = function(apiBookings) {
    if (!Array.isArray(apiBookings)) return;

    // Clear demo data and replace with real bookings
    Object.keys(bookingsData).forEach(function(k) { delete bookingsData[k]; });

    apiBookings.forEach(function(b) {
      var date = b.date;
      if (!bookingsData[date]) bookingsData[date] = [];
      // Convert 24h time or formatted time to HH:MM
      var time = b.time;
      if (time && time.indexOf('AM') !== -1 || time && time.indexOf('PM') !== -1) {
        // Parse "9:00 AM" format to "09:00"
        var parts = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (parts) {
          var h = parseInt(parts[1]);
          if (parts[3].toUpperCase() === 'PM' && h !== 12) h += 12;
          if (parts[3].toUpperCase() === 'AM' && h === 12) h = 0;
          time = String(h).padStart(2, '0') + ':' + parts[2];
        }
      }
      bookingsData[date].push({
        time: time,
        court: b.courtId,
        user: b.userName || 'Booked'
      });
    });

    // Re-render if booking system is initialized
    if (typeof initBookingSystem === 'function') {
      try { initBookingSystem(); } catch(e) { /* may not be on booking screen */ }
    }
  };

  /**
   * Update announcements from Supabase API.
   * Called by auth.js after login when API data is available.
   */
  window.updateAnnouncementsFromAPI = function(apiAnnouncements) {
    if (!Array.isArray(apiAnnouncements)) return;
    // Update the home screen announcement banner if present
    var banner = document.querySelector('#screen-home .announcement-banner');
    if (!banner) return;

    var active = apiAnnouncements.filter(function(a) { return !a.dismissed; });
    if (active.length > 0) {
      var latest = active[0];
      var textEl = banner.querySelector('.announcement-text');
      if (textEl) textEl.textContent = latest.text;
      banner.style.display = '';
    } else {
      banner.style.display = 'none';
    }
  };

})();
