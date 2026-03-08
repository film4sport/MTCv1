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

  // Court blocks data (populated from API)
  let courtBlocksData = [];

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
      { day:1, start:'9:00 AM', end:'11:00 AM', courts:[1,2], type:'social',
        title:"Men's Round Robin", fee:0, guestFee:10,
        coach: null, regKey:'mens-rr',
        desc:'Weekly men\'s round robin. All skill levels welcome.' },

      // THURSDAY AM - Freedom 55 League 9-11am
      { day:3, start:'9:00 AM', end:'11:00 AM', courts:[1,2,3,4], type:'openplay',
        title:'Freedom 55 League', fee:0, guestFee:10,
        coach: null, regKey:'freedom55',
        desc:'Weekday morning league for the 55+ crowd. Fun and social!' },

      // THURSDAY PM - Interclub Competitive A & B 7-9:30pm
      { day:3, start:'7:00 PM', end:'9:30 PM', courts:[1,2,3,4], type:'doubles',
        title:'Interclub Competitive League', fee:0, guestFee:0,
        coach: null, regKey:'thu-interclub-a', rsvp:true,
        desc:'Thursday night competitive interclub. Team A & B. RSVP required.' },

      // FRIDAY AM - Ladies Round Robin 9-11am
      { day:4, start:'9:00 AM', end:'11:00 AM', courts:[1,2], type:'social',
        title:"Ladies Round Robin", fee:0, guestFee:10,
        coach: null, regKey:'ladies-rr',
        desc:'Weekly ladies round robin. All skill levels welcome.' },

      // FRIDAY PM - Mixed Round Robin 6-9pm
      { day:4, start:'6:00 PM', end:'9:00 PM', courts:[1,2,3,4], type:'social',
        title:'Friday Night Mixed Round Robin', fee:0, guestFee:10,
        coach: null, regKey:'fri-mixed-rr',
        desc:'Weekly mixed doubles round robin. Bring a partner or get matched!' },

      // (Weekend Open Play and Sunday Mixed Doubles removed - not real MTC programs)
    ];

    // Season starts on Opening Day — don't show recurring programs before then
    const seasonStart = new Date('2026-05-09');
    seasonStart.setHours(0,0,0,0);

    programs.forEach(function(e) {
      const d = ds(e.day);
      // Skip recurring programs before the season opens
      const programDate = new Date(d + 'T00:00:00');
      if (programDate < seasonStart) return;

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
      { date:'2026-06-07', start:'1:00 PM', end:'4:00 PM', courts:[1,2,3,4], type:'social',
        title:'French Open Round Robin Social', fee:0, guestFee:0,
        coach: null, regKey:null,
        desc:'Celebrate the French Open with a themed round robin social! Mixed doubles, prizes, and refreshments.' },
      { date:'2026-07-12', start:'1:00 PM', end:'4:00 PM', courts:[1,2,3,4], type:'social',
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
    today.setHours(0,0,0,0);
    const start = new Date(today);
    start.setDate(today.getDate() + (offset*7)); // Rolling 7-day view from today
    const dates = [];
    for (let i=0;i<7;i++) { const d=new Date(start); d.setDate(start.getDate()+i); dates.push(d); }
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

  // Check if a court is closed at a given time (hours) or in maintenance
  function isCourtClosed(court, time) {
    // Check maintenance status from API
    var courtConfig = MTC.config.courts.find(function(c) { return c.id === court; });
    if (courtConfig && courtConfig.status === 'maintenance') return true;
    var closeTime = MTC.config.courtHours[court] ? MTC.config.courtHours[court].close : '22:00';
    return timeToMinutes(time) >= timeToMinutes(closeTime);
  }

  // timeToMinutes defined at line 149 (handles both 12h AM/PM and 24h formats)


  // ============================================
  // VIEW TOGGLE
  // ============================================
  function switchBookingView(view) {
    const wv=document.getElementById('weekView'), cv=document.getElementById('bookingCalendarView');
    const wb=document.getElementById('weekViewBtn'), cb=document.getElementById('bookingCalendarViewBtn');
    if (view==='week') {
      wv.style.display='block'; cv.style.display='none';
      wb.classList.add('active'); cb.classList.remove('active');
      renderWeeklyGrid();
    } else {
      wv.style.display='none'; cv.style.display='flex';
      wb.classList.remove('active'); cb.classList.add('active');
      renderCalendar();
    }
  }


  // ============================================
  // COURT BLOCK HELPERS
  // ============================================
  function isSlotBlocked(dateStr, time, courtId) {
    if (!courtBlocksData || courtBlocksData.length === 0) return null;
    var slotMins = timeToMinutes(time);
    for (var i = 0; i < courtBlocksData.length; i++) {
      var block = courtBlocksData[i];
      if (block.block_date !== dateStr) continue;
      // court_id null means ALL courts
      if (block.court_id !== null && block.court_id !== courtId) continue;
      // Full-day block (no time_start/time_end)
      if (!block.time_start && !block.time_end) return block;
      // Time-range block — parse start/end
      var startMins = block.time_start ? timeToMinutes(block.time_start) : 0;
      var endMins = block.time_end ? timeToMinutes(block.time_end) : 1440;
      if (slotMins >= startMins && slotMins < endMins) return block;
    }
    return null;
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
    const dayNFull=MTC.config.dayNamesShort; // Sun=0, Mon=1, ..., Sat=6
    const moN=MTC.config.monthNamesShort;
    const todayStr=formatDateStr(new Date());

    if (weekLabel) {
      if (currentWeekOffset===0) weekLabel.textContent='NEXT 7 DAYS';
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
    const isToday=formatDateStr(selectedDate)===todayStr;
    const nowMins=isToday?(new Date().getHours()*60+new Date().getMinutes()):-1;

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
          if (!shown[et]) { shown[et]=true; var eti=MTC.config.eventTypes[et]||MTC.config.eventTypes.reserved; dots+='<span class="day-dot" style="background:'+eti.color+'"></span>'; }
        }
        dots+='</span>';
      }
      th+='<button class="'+tc+'" onclick="selectWeekDay('+t+')"><span class="week-day-tab-name">'+sanitizeHTML(dayNFull[dates[t].getDay()])+'</span><span class="week-day-tab-date">'+dates[t].getDate()+'</span>'+dots+'</button>';
    }
    tabsC.innerHTML=th;

    // Build covered cells map
    const covered={};
    (eventsData[dateStr]||[]).forEach(function(ev) {
      const si=timeToIndex(ev.startTime), ei=timeToIndex(ev.endTime);
      ev.courts.forEach(function(c) { for (let ti=si;ti<ei;ti++) covered[MTC.config.timeSlots[ti]+'-'+c]=true; });
    });

    // Grid rows
    let html='', nowRowIdx=-1;
    // Prime time: weekday evenings 6-9pm, weekend mornings 9:30-12pm
    const isWeekend=selectedDate.getDay()===0||selectedDate.getDay()===6;
    MTC.config.timeSlots.forEach(function(time,rowIdx) {
      const slotMins=timeToMinutes(time);
      const isPastSlot=isToday&&slotMins<nowMins;
      const isNowSlot=isToday&&slotMins<=nowMins&&(rowIdx+1>=MTC.config.timeSlots.length||timeToMinutes(MTC.config.timeSlots[rowIdx+1])>nowMins);
      if (isNowSlot) nowRowIdx=rowIdx;
      const isPrime=isWeekend?(slotMins>=570&&slotMins<720):(slotMins>=1080&&slotMins<1260); // weekend 9:30-12, weekday 6-9pm
      let rowCls='weekly-grid-row'+(isNowSlot?' now-row':'')+(isPrime?' prime-time':'');
      html+='<div class="'+rowCls+'" data-row="'+rowIdx+'">';
      html+='<div class="weekly-time-cell">'+formatTimeLabel(time)+'</div>';

      MTC.config.courts.forEach(function(co) {
        const court=co.id, ck=time+'-'+court;
        const booking=getBookingAt(dateStr,time,court);
        const evStart=isEventStart(dateStr,time,court);
        let sc='weekly-slot', inner='', click='';

        var blockInfo=isSlotBlocked(dateStr,time,court);

        if (isPastDay||(isPastSlot&&!booking)) {
          sc+=' past'; inner='<span class="slot-dash">\u2014</span>';
        } else if (isCourtClosed(court, time)) {
          sc+=' closed'; inner='<span class="slot-dash closed-label">Closed</span>';
        } else if (blockInfo) {
          sc+=' blocked'; var reasonShort=blockInfo.reason||'Blocked'; if(reasonShort.length>12)reasonShort=reasonShort.slice(0,11)+'\u2026';
          inner='<span class="slot-blocked-label">'+sanitizeHTML(reasonShort)+'</span>';
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
            sc+=' my-booking'; inner='<span class="slot-label mine-label"><svg class="mine-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><circle cx="8" cy="8" r="7"/></svg> MY COURT</span>';
          } else {
            sc+=' booked'; inner='<span class="slot-label booked-label">Booked</span>';
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

    // Floodlight headers with court hours (#4)
    const headers=document.querySelectorAll('#screen-book .weekly-grid-header .court-header');
    headers.forEach(function(h,idx) {
      const c=MTC.config.courts[idx];
      if (c) {
        const hrs=MTC.config.courtHours[c.id];
        const closeH=hrs?parseInt(hrs.close):20;
        const closeLabel=closeH>12?(closeH-12)+' PM':closeH+' AM';
        h.innerHTML=sanitizeHTML(c.name)+(c.floodlight?' <span class="floodlight-icon" title="Floodlights">\ud83d\udca1</span>':'')+'<span class="court-hours-label">'+(c.floodlight?'Lit til ':'til ')+closeLabel+'</span>';
      }
    });

    // Smart scroll to now row (#8)
    // The actual scrolling container is #screen-book (overflow-y:auto), not gridBody
    // (gridBody has no max-height so it expands to fit all content and never scrolls itself).
    if (isToday&&nowRowIdx>=0) {
      var nowEl=gridBody.querySelector('.now-row');
      if (nowEl) setTimeout(function(){
        var scrollContainer = document.getElementById('screen-book');
        if (!scrollContainer) return;
        var containerRect = scrollContainer.getBoundingClientRect();
        var nowRect = nowEl.getBoundingClientRect();
        var scrollOffset = nowRect.top - containerRect.top + scrollContainer.scrollTop - 60;
        scrollContainer.scrollTop = Math.max(0, scrollOffset);
      },150);
    }
    } catch(e) {
      MTC.warn('renderWeeklyGrid error:', e);
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
    const isSocialEvent = ['social', 'openplay', 'doubles'].indexOf(ev.type) !== -1;

    // Court names - only show for non-social events
    const courtNames=ev.courts.map(function(c){return 'Court '+c;}).join(', ');
    const courtHtml = isSocialEvent ? '' : '<div class="event-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="2"></rect><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg> '+sanitizeHTML(courtNames)+'</div>';

    // Fee display - only show for non-social events
    const feeText = ev.fee > 0 ? '$'+ev.fee.toFixed(2) : 'FREE for members';
    const feeHtml = isSocialEvent ? '' : '<div class="event-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> '+sanitizeHTML(feeText)+'</div>';
    const guestFeeHtml = '';

    const regCount = (ev.registered||[]).length;
    const slotsClass = '';
    const slotsText = regCount > 0 ? regCount + ' registered' : 'Be the first to sign up!';
    let btnText = ev.rsvp ? 'RSVP' : 'REGISTER';
    const btnClass = '';

    // Coach info
    let coachHtml = '';
    if (ev.coach) {
      coachHtml = '<div class="event-meta-row coach-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Coach: <strong>'+sanitizeHTML(ev.coach)+'</strong></div>';
    }

    // Registered members list with avatar circles (matching dashboard style)
    const regList = ev.registered || [];
    let regHtml = '';
    var _avatarColors = ['#6b7a3d','#d97706','#2563eb','#7c3aed','#dc2626','#0891b2','#4f46e5','#059669'];
    function _getAvatarColor(n) {
      var sum=0; for(var i=0;i<n.length;i++) sum+=n.charCodeAt(i);
      return _avatarColors[sum % _avatarColors.length];
    }
    function _getInitials(n) {
      return n.split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
    }
    if (regList.length > 0) {
      regHtml = '<div class="event-reg-list"><div class="event-reg-title">Registered ('+regList.length+')</div><div class="event-reg-avatars">';
      var showList = regList.slice(0, 8);
      showList.forEach(function(name) {
        var isYou = name === 'You';
        var displayName = isYou ? 'You' : name.split(' ')[0];
        var initials = isYou ? 'U' : _getInitials(name);
        var bgColor = isYou ? '#6b7a3d' : _getAvatarColor(name);
        regHtml += '<div class="reg-avatar-item'+(isYou?' you':'')+'">' +
          '<div class="reg-avatar-circle" style="background:'+bgColor+'">'+sanitizeHTML(initials)+'</div>' +
          '<span class="reg-avatar-name">'+sanitizeHTML(displayName)+'</span></div>';
      });
      if (regList.length > 8) {
        regHtml += '<div class="reg-avatar-item"><div class="reg-avatar-circle" style="background:#d4e157;color:#2a2f1e">+' + (regList.length - 8) + '</div><span class="reg-avatar-name">more</span></div>';
      }
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
        '<button class="event-detail-cal-btn" onclick="downloadEventICS(\''+dateStr+'\',\''+ev.startTime+'\',\''+ev.endTime+'\',\''+sanitizeHTML(ev.title).replace(/'/g,"\\'")+'\')">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
          ' Add to Calendar</button>'+
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

    const msg = ev && ev.rsvp ? "RSVP confirmed! You're on the list." : "You're registered! See you on the court.";
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
      showPushNotification('Coach Notified', sanitizeHTML(ev.coach) + ' has been notified of your registration for ' + sanitizeHTML(ev.title), '\u2705');
    } else {
      showPushNotification('Event Registered', "You're signed up! Check your schedule.", '\u2705');
    }

    if (ev && ev.registered && ev.registered.indexOf('You') === -1) {
      ev.registered.push('You');
    }

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

    // Guest fee note is static in HTML — no dynamic updates needed
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
    resetBookingOptions();
  }


  // ============================================
  // BOOKING OPTIONS STATE
  // ============================================
  var _selectedMatchType = 'singles';
  var _selectedDuration = 2; // slots (2=1h, 3=1.5h, 4=2h)
  var _selectedParticipants = []; // [{id, name}]

  // Match type rules (must match API BOOKING_RULES)
  var MATCH_RULES = {
    singles: { durations: [2, 3], maxParticipants: 1 },
    doubles: { durations: [2, 3, 4], maxParticipants: 3 }
  };

  function selectMatchType(type) {
    _selectedMatchType = type;
    document.querySelectorAll('#matchTypeToggle .match-type-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.type === type);
    });
    // Update available durations
    var rules = MATCH_RULES[type];
    document.querySelectorAll('#durationToggle .duration-btn').forEach(function(b) {
      var slots = parseInt(b.dataset.slots, 10);
      b.style.display = rules.durations.indexOf(slots) !== -1 ? '' : 'none';
    });
    // Reset duration if current selection isn't valid for new type
    if (rules.durations.indexOf(_selectedDuration) === -1) {
      selectDuration(rules.durations[0]);
    }
    // Adjust max participants hint
    var maxP = rules.maxParticipants;
    var addBtn = document.getElementById('addPlayerBtn');
    if (addBtn) addBtn.style.display = _selectedParticipants.length >= maxP ? 'none' : '';
  }

  function selectDuration(slots) {
    _selectedDuration = slots;
    document.querySelectorAll('#durationToggle .duration-btn').forEach(function(b) {
      b.classList.toggle('active', parseInt(b.dataset.slots, 10) === slots);
    });
  }

  function toggleGuestField() {
    var toggle = document.getElementById('guestToggle');
    var fields = document.getElementById('guestFields');
    if (!toggle || !fields) return;
    var isOn = toggle.classList.toggle('active');
    toggle.setAttribute('aria-checked', isOn ? 'true' : 'false');
    fields.style.display = isOn ? 'block' : 'none';
    if (isOn) {
      var inp = document.getElementById('guestNameInput');
      if (inp) setTimeout(function() { inp.focus(); }, 100);
    }
  }

  function openPlayerPicker() {
    // Build member list from cached members data
    var members = MTC.storage.get('mtc-members', []);
    var currentUser = MTC.storage.get('mtc-user', null) || MTC.storage.get('mtc-current-user', null);
    var currentId = currentUser ? currentUser.id : '';

    // Filter out current user and already-added participants
    var addedIds = _selectedParticipants.map(function(p) { return p.id; });
    var available = members.filter(function(m) {
      return m.id !== currentId && addedIds.indexOf(m.id) === -1;
    });

    var overlay = document.createElement('div');
    overlay.className = 'player-picker-overlay';
    overlay.id = 'playerPickerOverlay';
    overlay.onclick = function(e) { if (e.target === overlay) closePlayerPicker(); };

    var html = '<div class="player-picker">' +
      '<div class="player-picker-header">' +
        '<span class="player-picker-title">ADD PLAYER</span>' +
        '<button onclick="closePlayerPicker()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
      '</div>' +
      '<div class="player-picker-search">' +
        '<input type="text" id="playerSearchInput" placeholder="Search members..." oninput="filterPlayerList(this.value)" autocomplete="off">' +
      '</div>' +
      '<div class="player-picker-list" id="playerPickerList">';

    if (available.length === 0) {
      html += '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">No members available</div>';
    } else {
      available.forEach(function(m) {
        var initials = (m.name || '?').split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
        html += '<div class="player-picker-item" data-name="' + sanitizeHTML(m.name || '') + '" onclick="addParticipant(\'' + sanitizeHTML(m.id) + '\',\'' + sanitizeHTML(m.name || 'Member') + '\')">' +
          '<div class="player-avatar">' + initials + '</div>' +
          '<span class="player-name">' + sanitizeHTML(m.name || 'Member') + '</span>' +
        '</div>';
      });
    }

    html += '</div></div>';
    overlay.innerHTML = html;
    document.getElementById('app').appendChild(overlay);
    setTimeout(function() { overlay.classList.add('active'); }, 10);
  }

  function closePlayerPicker() {
    var o = document.getElementById('playerPickerOverlay');
    if (o) { o.classList.remove('active'); setTimeout(function() { o.remove(); }, 300); }
  }

  function filterPlayerList(query) {
    var q = (query || '').toLowerCase();
    document.querySelectorAll('#playerPickerList .player-picker-item').forEach(function(item) {
      var name = (item.dataset.name || '').toLowerCase();
      item.style.display = name.indexOf(q) !== -1 ? '' : 'none';
    });
  }

  function addParticipant(id, name) {
    var maxP = _selectedMatchType === 'singles' ? 1 : 3;
    if (_selectedParticipants.length >= maxP) {
      showToast('Max ' + (maxP + 1) + ' players for ' + _selectedMatchType);
      return;
    }
    _selectedParticipants.push({ id: id, name: name });
    renderParticipantChips();
    closePlayerPicker();

    var addBtn = document.getElementById('addPlayerBtn');
    if (addBtn) addBtn.style.display = _selectedParticipants.length >= maxP ? 'none' : '';
  }

  function removeParticipant(id) {
    _selectedParticipants = _selectedParticipants.filter(function(p) { return p.id !== id; });
    renderParticipantChips();

    var maxP = _selectedMatchType === 'singles' ? 1 : 3;
    var addBtn = document.getElementById('addPlayerBtn');
    if (addBtn) addBtn.style.display = _selectedParticipants.length >= maxP ? 'none' : '';
  }

  function renderParticipantChips() {
    var container = document.getElementById('participantsList');
    if (!container) return;
    if (_selectedParticipants.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = _selectedParticipants.map(function(p) {
      return '<span class="booking-participant-chip">' +
        sanitizeHTML(p.name) +
        ' <button class="booking-participant-remove" onclick="removeParticipant(\'' + sanitizeHTML(p.id) + '\')">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
      '</span>';
    }).join('');
  }

  function resetBookingOptions() {
    _selectedMatchType = 'singles';
    _selectedDuration = 2;
    _selectedParticipants = [];
    // Reset UI
    document.querySelectorAll('#matchTypeToggle .match-type-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.type === 'singles');
    });
    // Reset duration buttons (singles: show 1h+1.5h, hide 2h)
    document.querySelectorAll('#durationToggle .duration-btn').forEach(function(b) {
      var slots = parseInt(b.dataset.slots, 10);
      b.classList.toggle('active', slots === 2);
      b.style.display = MATCH_RULES.singles.durations.indexOf(slots) !== -1 ? '' : 'none';
    });
    var guestToggle = document.getElementById('guestToggle');
    var guestFields = document.getElementById('guestFields');
    var guestInput = document.getElementById('guestNameInput');
    if (guestToggle) { guestToggle.classList.remove('active'); guestToggle.setAttribute('aria-checked', 'false'); }
    if (guestFields) guestFields.style.display = 'none';
    if (guestInput) guestInput.value = '';
    var pList = document.getElementById('participantsList');
    if (pList) pList.innerHTML = '';
    var addBtn = document.getElementById('addPlayerBtn');
    if (addBtn) addBtn.style.display = '';
  }

  // ============================================
  // CONFIRM BOOKING
  // ============================================
  function confirmBooking() {
    if (!selectedSlot||!selectedSlot.date||!selectedSlot.time||!selectedSlot.court){showToast('Please select a time slot first');closeBookingModal();return;}

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedSlot.date)){showToast('Invalid date format');return;}
    // Validate time format (12h AM/PM)
    if (!/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(selectedSlot.time)){showToast('Invalid time format');return;}

    const slotDate=new Date(selectedSlot.date); const now=new Date();now.setHours(0,0,0,0);
    if (isNaN(slotDate.getTime())){showToast('Invalid date');return;}
    if (slotDate<now){showToast('Cannot book a past date');return;}

    const btn=document.querySelector('.booking-confirm-btn');
    if (btn){btn.disabled=true;btn.innerHTML='<span class="booking-spinner"></span> BOOKING...';btn.style.transform='scale(0.97)';btn.style.opacity='0.7';}

    var bookedForName = (typeof getActiveDisplayName === 'function') ? getActiveDisplayName() : '';
    var userName = MTC.storage.get('mtc-user-name', '');
    var courtId = parseInt(selectedSlot.court.replace(/\D/g, ''), 10) || 1;

    // Read booking options from UI
    var matchType = _selectedMatchType || 'singles';
    var duration = _selectedDuration || 2; // slots (2=1h, 3=1.5h, 4=2h)
    var isGuest = document.getElementById('guestToggle') && document.getElementById('guestToggle').classList.contains('active');
    var guestNameEl = document.getElementById('guestNameInput');
    var guestName = isGuest && guestNameEl ? guestNameEl.value.trim() : undefined;

    var bookingData = {
      courtId: courtId,
      courtName: 'Court ' + selectedSlot.court,
      date: selectedSlot.date,
      time: selectedSlot.time,
      userName: userName,
      bookedFor: (MTC.state.activeFamilyMember && bookedForName) ? bookedForName : undefined,
      type: 'court',
      matchType: matchType,
      duration: duration,
      isGuest: isGuest || false,
      guestName: guestName,
      participants: _selectedParticipants.length > 0 ? _selectedParticipants : undefined
    };

    function resetBtn() {
      if (btn){btn.disabled=false;btn.style.transform='';btn.style.opacity='';btn.innerHTML='CONFIRM & BOOK <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';}
    }

    // Use the real API client if available, fall back to optimistic-only for offline
    if (MTC.fn.createBooking && MTC.getToken()) {
      MTC.fn.createBooking(bookingData,
        function onSuccess() {
          var toastMsg = 'Court '+selectedSlot.court+' booked for '+selectedSlot.time+'!';
          if (bookedForName && MTC.state.activeFamilyMember) toastMsg = bookedForName + ': ' + toastMsg;
          showToast(toastMsg);
          closeBookingModal();
          document.querySelectorAll('.weekly-slot.selected').forEach(function(s){
            s.classList.remove('selected','available');s.classList.add('my-booking');
            s.innerHTML='<span class="slot-label mine-label"><svg class="mine-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><circle cx="8" cy="8" r="7"/></svg> MY COURT</span>';
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
        s.innerHTML='<span class="slot-label mine-label"><svg class="mine-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><circle cx="8" cy="8" r="7"/></svg> MY COURT</span>';
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
          if(booking.user==='You'){sc+=' my-booking';inner='<span class="slot-label mine-label"><svg class="mine-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><circle cx="8" cy="8" r="7"/></svg> MY COURT</span>';}
          else{sc+=' booked';inner='<span class="slot-label booked-label">Booked</span>';}
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

  // Booking info panel toggle (#9)
  function toggleBookingInfo() {
    var content=document.getElementById('bookingInfoContent');
    var toggle=document.querySelector('.booking-info-toggle');
    if (!content||!toggle) return;
    var open=content.classList.toggle('open');
    toggle.setAttribute('aria-expanded',open?'true':'false');
    content.setAttribute('aria-hidden',open?'false':'true');
  }

  // ICS calendar file download for events
  function downloadEventICS(dateStr, startTime, endTime, title) {
    var TIMEZONE = 'America/Toronto';
    function parseTime(t) {
      var m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!m) return { h: 9, min: 0 };
      var h = parseInt(m[1]), min = parseInt(m[2]), p = m[3].toUpperCase();
      if (p === 'PM' && h !== 12) h += 12;
      if (p === 'AM' && h === 12) h = 0;
      return { h: h, min: min };
    }
    function toICS(d, h, m) {
      var parts = d.split('-');
      return parts[0] + parts[1] + parts[2] + 'T' + String(h).padStart(2, '0') + String(m).padStart(2, '0') + '00';
    }
    var s = parseTime(startTime), e = parseTime(endTime);
    var uid = Date.now() + '-' + Math.random().toString(36).slice(2) + '@mtc.ca';
    var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Mono Tennis Club//MTC//EN\r\n' +
      'X-WR-TIMEZONE:' + TIMEZONE + '\r\nBEGIN:VEVENT\r\nUID:' + uid + '\r\n' +
      'DTSTART;TZID=' + TIMEZONE + ':' + toICS(dateStr, s.h, s.min) + '\r\n' +
      'DTEND;TZID=' + TIMEZONE + ':' + toICS(dateStr, e.h, e.min) + '\r\n' +
      'SUMMARY:' + title + '\r\nLOCATION:Mono Tennis Club\\, Mono\\, ON\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/\s+/g, '-').toLowerCase() + '.ics';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Calendar event downloaded');
  }

  // Window exports for HTML onclick handlers
  window.downloadEventICS = downloadEventICS;
  window.toggleBookingInfo = toggleBookingInfo;
  window.selectSlot = selectSlot;
  window.selectWeekDay = selectWeekDay;
  window.changeWeek = changeWeek;
  window.switchBookingView = switchBookingView;
  window.changeMonth = changeMonth;
  window.selectCalendarDay = selectCalendarDay;
  window.showEventDetail = showEventDetail;
  window.confirmBooking = confirmBooking;
  window.closeBookingModal = closeBookingModal;
  window.selectMatchType = selectMatchType;
  window.selectDuration = selectDuration;
  window.toggleGuestField = toggleGuestField;
  window.openPlayerPicker = openPlayerPicker;
  window.closePlayerPicker = closePlayerPicker;
  window.filterPlayerList = filterPlayerList;
  window.addParticipant = addParticipant;
  window.removeParticipant = removeParticipant;
  window.registerForGridEvent = registerForGridEvent;
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

    // Update schedule nav badge (today's bookings count)
    var today = new Date().toISOString().split('T')[0];
    var todayCount = (bookingsData[today] || []).length;
    var scheduleBadge = document.getElementById('navScheduleBadge');
    if (scheduleBadge) {
      if (todayCount > 0) {
        scheduleBadge.textContent = todayCount;
        scheduleBadge.style.display = 'flex';
      } else {
        scheduleBadge.style.display = 'none';
      }
    }

    // Re-render if booking system is initialized
    if (typeof initBookingSystem === 'function') {
      try { initBookingSystem(); } catch(e) { /* may not be on booking screen */ }
    }
  };

  /**
   * Update court status from Supabase API.
   * Called by auth.js after login when API data is available.
   * Merges maintenance status into MTC.config.courts so booking grid reflects closures.
   */
  window.updateCourtsFromAPI = function(apiCourts) {
    if (!Array.isArray(apiCourts)) return;
    apiCourts.forEach(function(apiCourt) {
      var configCourt = MTC.config.courts.find(function(c) { return c.id === apiCourt.id; });
      if (configCourt) {
        configCourt.status = apiCourt.status || 'available';
      }
    });
    // Store for offline access
    MTC.storage.set('mtc-api-courts', apiCourts);
    // Re-render booking grid if currently on that screen
    try { initBookingSystem(); } catch(e) { /* may not be on booking screen */ }
  };

  /**
   * Update announcements from Supabase API.
   * Called by auth.js after login when API data is available.
   */
  /**
   * Update court blocks from API.
   * Called by auth.js after login and by realtime-sync when court_blocks table changes.
   */
  window.updateCourtBlocksFromAPI = function(apiBlocks) {
    if (!Array.isArray(apiBlocks)) return;
    courtBlocksData = apiBlocks;
    // Store for offline access
    MTC.storage.set('mtc-api-court-blocks', apiBlocks);
    // Re-render booking grid if currently on that screen
    try { initBookingSystem(); } catch(e) { /* may not be on booking screen */ }
  };

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
