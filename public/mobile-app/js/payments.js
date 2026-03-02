(function() {
  'use strict';

  /* payments.js - MTC Court */
  // ============================================
  // TAB-BASED PAYMENT SYSTEM
  // Book now, pay later. Tab builds up, send one e-transfer.
  // ============================================

  // Fee constants (BOOKING_FEE, GUEST_FEE, TAB_WARNING_THRESHOLD, TAB_BLOCK_THRESHOLD, CANCEL_WINDOW_HOURS) are in config.js

  // ============================================
  // DATA STORE
  // ============================================
  const memberPaymentData = {
    currentUser: {
      name: 'Alex Thompson',
      email: 'alex.thompson@email.com',
      tab: 0,          // running total owed (positive = owes money)
      overpayment: 0,  // if they overpaid, carries forward
      flagged: false,
      flagReason: '',
      isMember: true   // false = non-member/guest, sees $10 court fee
    },
    bookings: [],
    nextBookingId: 1001
  };

  // All members for admin view
  const allMembersPayment = [
    { id: 1, name: 'Alex Thompson', email: 'alex.thompson@email.com', tab: 10, overpayment: 0, totalBookings: 8, totalPaid: 20, guestBookings: 2, programFees: 0, flagged: false },
    { id: 2, name: 'Sarah Wilson', email: 'sarah.wilson@email.com', tab: 20, overpayment: 0, totalBookings: 12, totalPaid: 30, guestBookings: 3, programFees: 20, flagged: false },
    { id: 3, name: 'James Park', email: 'james.park@email.com', tab: 0, overpayment: 0, totalBookings: 6, totalPaid: 10, guestBookings: 1, programFees: 0, flagged: false },
    { id: 4, name: 'Emily Rodriguez', email: 'emily.r@email.com', tab: 10, overpayment: 0, totalBookings: 9, totalPaid: 0, guestBookings: 1, programFees: 0, flagged: false },
    { id: 5, name: 'David Kim', email: 'david.kim@email.com', tab: 0, overpayment: 0, totalBookings: 4, totalPaid: 20, guestBookings: 0, programFees: 0, flagged: false },
    { id: 6, name: 'Lisa Thompson', email: 'lisa.t@email.com', tab: 30, overpayment: 0, totalBookings: 10, totalPaid: 10, guestBookings: 3, programFees: 10, flagged: true, flagReason: 'Tab reached $30 — booking restricted' },
    { id: 7, name: 'Mike Chen', email: 'mike.chen@email.com', tab: 10, overpayment: 0, totalBookings: 7, totalPaid: 10, guestBookings: 1, programFees: 0, flagged: false },
    { id: 8, name: 'Kelly K.', email: 'kelly.k@email.com', tab: 0, overpayment: 5, totalBookings: 15, totalPaid: 40, guestBookings: 2, programFees: 15, flagged: false }
  ];

  // Sample existing bookings for demo
  const sampleBookings = [];

  function initSampleBookings() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Upcoming bookings
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 5);

    // Past bookings
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    memberPaymentData.bookings = [
      // 3 upcoming unpaid bookings = $15 on tab
      {
        id: 'MTC-1001',
        court: 2,
        date: tomorrow.toISOString().split('T')[0],
        time: '14:00',
        duration: 1,
        fee: BOOKING_FEE,
        status: 'confirmed',
        paymentStatus: 'on-tab',   // on-tab | paid | removed | late-cancel
        bookedAt: new Date(now.getTime() - 3600000).toISOString(),
        cancelledAt: null
      },
      {
        id: 'MTC-1002',
        court: 1,
        date: dayAfter.toISOString().split('T')[0],
        time: '10:00',
        duration: 1,
        fee: BOOKING_FEE,
        status: 'confirmed',
        paymentStatus: 'on-tab',
        bookedAt: new Date(now.getTime() - 7200000).toISOString(),
        cancelledAt: null
      },
      {
        id: 'MTC-1003',
        court: 3,
        date: nextWeek.toISOString().split('T')[0],
        time: '16:00',
        duration: 1,
        fee: BOOKING_FEE,
        status: 'confirmed',
        paymentStatus: 'on-tab',
        bookedAt: new Date(now.getTime() - 86400000).toISOString(),
        cancelledAt: null
      },
      // Past bookings — already paid via e-transfer
      {
        id: 'MTC-0998',
        court: 1,
        date: yesterday.toISOString().split('T')[0],
        time: '11:00',
        duration: 1,
        fee: BOOKING_FEE,
        status: 'completed',
        paymentStatus: 'paid',
        bookedAt: new Date(now.getTime() - 172800000).toISOString(),
        cancelledAt: null
      },
      {
        id: 'MTC-0997',
        court: 2,
        date: twoDaysAgo.toISOString().split('T')[0],
        time: '09:00',
        duration: 1,
        fee: BOOKING_FEE,
        status: 'completed',
        paymentStatus: 'paid',
        bookedAt: new Date(now.getTime() - 259200000).toISOString(),
        cancelledAt: null
      },
      // Cancelled 24+ hrs ahead — removed from tab
      {
        id: 'MTC-0996',
        court: 3,
        date: lastWeek.toISOString().split('T')[0],
        time: '15:00',
        duration: 1,
        fee: BOOKING_FEE,
        status: 'cancelled',
        paymentStatus: 'removed',
        bookedAt: new Date(now.getTime() - 604800000).toISOString(),
        cancelledAt: new Date(now.getTime() - 518400000).toISOString()
      }
    ];

    // Current user tab: 3 upcoming on-tab bookings = $15
    memberPaymentData.currentUser.tab = 15;
    memberPaymentData.currentUser.overpayment = 0;
    memberPaymentData.nextBookingId = 1004;
  }

  // ============================================
  // BOOKING ACTIONS
  // ============================================
  // ============================================
  // GUEST FEE TOGGLE
  // ============================================
  let bringingGuest = false;

  function toggleGuestFee() {
    bringingGuest = !bringingGuest;
    const toggle = document.getElementById('guestToggle');
    const guestRow = document.getElementById('guestFeeRow');

    if (toggle) {
      toggle.classList.toggle('active', bringingGuest);
      toggle.setAttribute('aria-checked', bringingGuest);
    }
    if (guestRow) {
      guestRow.style.display = bringingGuest ? 'flex' : 'none';
    }
  }

  // ============================================
  // AUTO-NOTIFY ADMIN WHEN TAB LIMIT REACHED
  // ============================================
  function notifyAdminTabLimit(memberName, tabAmount) {
    // Show push notification to admin
    if (typeof showPushNotification === 'function') {
      showPushNotification(
        '\u26a0\ufe0f Tab Limit Reached',
        memberName + '\'s tab has reached $' + tabAmount + '. Bookings are now blocked until they settle up.',
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ff6b6b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        [{ label: 'View Payments', navigate: 'admin' }]
      );
    }
  }

  function createBooking(court, date, time) {
    const user = memberPaymentData.currentUser;

    // Check if flagged
    if (user.flagged) {
      showToast('Booking restricted — please settle your tab');
      return null;
    }

    // Check tab threshold
    if (user.tab >= TAB_BLOCK_THRESHOLD) {
      showToast('Your tab is $' + user.tab + ' — please send an e-transfer to continue booking');
      return null;
    }

    const bookingId = 'MTC-' + memberPaymentData.nextBookingId++;
    const guestCharge = bringingGuest ? GUEST_FEE : 0;

    // If user has overpayment credit, reduce the guest charge
    let chargeAmount = guestCharge;
    if (user.overpayment > 0 && chargeAmount > 0) {
      const applied = Math.min(user.overpayment, chargeAmount);
      user.overpayment -= applied;
      chargeAmount -= applied;
    }

    const booking = {
      id: bookingId,
      court: court,
      date: date,
      time: time,
      duration: 1,
      fee: guestCharge,
      tabCharge: chargeAmount,
      hasGuest: bringingGuest,
      status: 'confirmed',
      paymentStatus: chargeAmount > 0 ? 'on-tab' : 'paid',
      bookedAt: new Date().toISOString(),
      cancelledAt: null
    };

    memberPaymentData.bookings.unshift(booking);

    // Add guest fee to tab
    user.tab += chargeAmount;

    // Check if tab limit reached — auto-notify admin
    if (user.tab >= TAB_BLOCK_THRESHOLD) {
      user.flagged = true;
      user.flagReason = 'Tab reached $' + TAB_BLOCK_THRESHOLD + ' — booking restricted';
      notifyAdminTabLimit(user.name, user.tab);
    }

    // Reset guest toggle for next booking
    bringingGuest = false;
    const toggle = document.getElementById('guestToggle');
    const guestRow = document.getElementById('guestFeeRow');
    if (toggle) { toggle.classList.remove('active'); toggle.setAttribute('aria-checked', 'false'); }
    if (guestRow) guestRow.style.display = 'none';

    return booking;
  }

  function cancelBooking(bookingId) {
    const booking = memberPaymentData.bookings.find(function(b) { return b.id === bookingId; });
    if (!booking || booking.status !== 'confirmed') return null;

    const user = memberPaymentData.currentUser;
    const now = new Date();
    const bookingDateTime = new Date(booking.date + 'T' + booking.time + ':00');
    const hoursUntil = (bookingDateTime - now) / (1000 * 60 * 60);

    booking.status = 'cancelled';
    booking.cancelledAt = now.toISOString();

    if (hoursUntil >= CANCEL_WINDOW_HOURS) {
      // Free cancel — remove from tab
      const removeAmount = booking.tabCharge || booking.fee;
      user.tab = Math.max(0, user.tab - removeAmount);
      booking.paymentStatus = 'removed';
      return { removed: true, amount: removeAmount, hoursUntil: hoursUntil };
    } else {
      // Late cancel — stays on tab
      booking.paymentStatus = 'late-cancel';
      return { removed: false, amount: 0, hoursUntil: hoursUntil };
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  function getUpcomingBookings() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return memberPaymentData.bookings.filter(function(b) {
      return (b.date >= today && b.status === 'confirmed');
    }).sort(function(a, b) { return a.date.localeCompare(b.date) || a.time.localeCompare(b.time); });
  }

  function getPastBookings() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return memberPaymentData.bookings.filter(function(b) {
      return (b.date < today || b.status === 'cancelled' || b.status === 'completed');
    }).sort(function(a, b) { return b.date.localeCompare(a.date) || b.time.localeCompare(a.time); });
  }

  function getUnpaidTotal() {
    return memberPaymentData.currentUser.tab;
  }

  function formatBookingDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const days = MTC.config.dayNamesFull;
    const months = MTC.config.monthNamesShort;
    return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
  }

  function formatTime(timeStr) {
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    return hour > 12 ? (hour - 12) + ':00 PM' : hour + ':00 AM';
  }

  function formatPaymentTimeRange(timeStr) {
    const hour = parseInt(timeStr.split(':')[0]);
    const endHour = hour + 1;
    const startFormatted = formatTime(timeStr);
    const endFormatted = formatTime(endHour + ':00');
    return startFormatted + ' - ' + endFormatted;
  }

  // ============================================
  // RENDER MY BOOKINGS
  // ============================================
  function renderMyBookings() {
    try {
    const upcoming = getUpcomingBookings();
    const past = getPastBookings();
    const user = memberPaymentData.currentUser;

    // Balance banner
    const balanceBanner = document.getElementById('balanceBanner');
    if (balanceBanner) {
      const tab = user.tab;
      const overpay = user.overpayment;

      if (tab > 0 || overpay > 0) {
        let bannerHtml = '<div class="balance-banner-inner">';

        if (tab > 0) {
          bannerHtml += '<div class="balance-owed">';
          bannerHtml += '<div class="balance-label">YOUR TAB</div>';
          bannerHtml += '<div class="balance-amount owed">$' + tab.toFixed(2) + '</div>';
          bannerHtml += '</div>';
        }

        if (overpay > 0) {
          bannerHtml += '<div class="balance-credit">';
          bannerHtml += '<div class="balance-label">OVERPAYMENT</div>';
          bannerHtml += '<div class="balance-amount credit">+$' + overpay.toFixed(2) + '</div>';
          bannerHtml += '</div>';
        }

        if (tab > 0) {
          bannerHtml += '<div class="balance-action">';
          bannerHtml += '<div class="balance-hint">Send e-transfer to<br><strong>monotennis.payment@gmail.com</strong></div>';
          bannerHtml += '</div>';
        }

        bannerHtml += '</div>';
        balanceBanner.innerHTML = bannerHtml;
        balanceBanner.style.display = 'block';
      } else {
        balanceBanner.style.display = 'none';
      }
    }

    // Upcoming bookings
    const upcomingEl = document.getElementById('upcomingBookings');
    if (upcomingEl) {
      if (upcoming.length === 0) {
        upcomingEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div><div class="empty-state-title">NO UPCOMING BOOKINGS</div><div class="empty-state-text">Book a court and start playing!</div><button class="empty-state-btn" onclick="navigateTo(\'book\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Book a Court</button></div>';
      } else {
        let html = '';
        upcoming.forEach(function(b, i) {
          let paymentBadge = '';
          if (b.paymentStatus === 'on-tab') {
            paymentBadge = '<span class="payment-badge unpaid">$' + (b.tabCharge || b.fee) + ' ON TAB</span>';
          } else if (b.paymentStatus === 'paid') {
            paymentBadge = '<span class="payment-badge paid">PAID</span>';
          }

          html += '<div class="booking-card animate-in" style="animation-delay: ' + (i * 0.1) + 's;">';
          html += '  <div class="booking-card-header">';
          html += '    <div class="booking-card-date">' + formatBookingDate(b.date) + '</div>';
          html += '    <div class="booking-card-badges">';
          html += '      <span class="booking-card-status upcoming">Upcoming</span>';
          html += '      ' + paymentBadge;
          html += '    </div>';
          html += '  </div>';
          html += '  <div class="booking-card-details">';
          html += '    <div class="booking-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>' + formatPaymentTimeRange(b.time) + '</span></div>';
          html += '    <div class="booking-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>Court ' + b.court + '</span></div>';
          html += '  </div>';
          html += '  <div class="booking-card-footer">';
          html += '    <span class="booking-ref">' + b.id + '</span>';
          html += '    <div class="booking-card-actions">';
          html += '      <button class="booking-action-btn modify" data-action="showModifyModal" data-booking-id="' + b.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Modify</button>';
          html += '      <button class="booking-action-btn cancel" data-action="showCancelModal" data-booking-id="' + b.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>Cancel</button>';
          html += '    </div>';
          html += '  </div>';
          html += '</div>';
        });
        upcomingEl.innerHTML = html;
      }
    }

    // Past bookings
    const pastEl = document.getElementById('pastBookings');
    if (pastEl) {
      if (past.length === 0) {
        pastEl.innerHTML = '<div style="text-align:center; padding: 40px 20px; color: var(--text-muted);">No past bookings</div>';
      } else {
        let html = '';
        past.forEach(function(b) {
          const statusClass = b.status === 'completed' ? 'completed' : (b.status === 'cancelled' ? 'cancelled' : 'upcoming');
          const statusText = b.status === 'completed' ? 'Completed' : (b.status === 'cancelled' ? 'Cancelled' : b.status);

          let paymentBadge = '';
          if (b.paymentStatus === 'paid') {
            paymentBadge = '<span class="payment-badge paid">PAID</span>';
          } else if (b.paymentStatus === 'removed') {
            paymentBadge = '<span class="payment-badge credited">REMOVED FROM TAB</span>';
          } else if (b.paymentStatus === 'late-cancel') {
            paymentBadge = '<span class="payment-badge no-refund">LATE CANCEL FEE</span>';
          } else if (b.paymentStatus === 'on-tab') {
            paymentBadge = '<span class="payment-badge unpaid">ON TAB</span>';
          }

          html += '<div class="booking-card past animate-in">';
          html += '  <div class="booking-card-header">';
          html += '    <div class="booking-card-date">' + formatBookingDate(b.date) + '</div>';
          html += '    <div class="booking-card-badges">';
          html += '      <span class="booking-card-status ' + statusClass + '">' + statusText + '</span>';
          html += '      ' + paymentBadge;
          html += '    </div>';
          html += '  </div>';
          html += '  <div class="booking-card-details">';
          html += '    <div class="booking-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>' + formatPaymentTimeRange(b.time) + '</span></div>';
          html += '    <div class="booking-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>Court ' + b.court + '</span></div>';
          html += '  </div>';
          html += '  <div class="booking-card-footer">';
          html += '    <span class="booking-ref">' + b.id + '</span>';
          html += '  </div>';
          html += '</div>';
        });
        pastEl.innerHTML = html;
      }
    }

    // Re-render event booking cards (RSVPs) that live in upcomingBookings
    if (typeof renderEventBookings === 'function') renderEventBookings();
    } catch(e) { console.warn('renderMyBookings error:', e); MTC.fn.renderError(document.getElementById('upcomingBookings'), 'Could not load bookings. Please try again.'); }
  }

  // ============================================
  // UPDATED CANCEL MODAL WITH 24HR LOGIC
  // ============================================
  function showCancelModal(bookingId) {
    currentBookingToModify = bookingId;
    const booking = memberPaymentData.bookings.find(function(b) { return b.id === bookingId; });
    if (!booking) return;

    const now = new Date();
    const bookingDateTime = new Date(booking.date + 'T' + booking.time + ':00');
    const hoursUntil = (bookingDateTime - now) / (1000 * 60 * 60);
    const isFreeCancel = hoursUntil >= CANCEL_WINDOW_HOURS;

    let subtitle = '';
    let refundInfo = '';

    if (isFreeCancel) {
      subtitle = 'This booking is more than 24 hours away.';
      refundInfo = '<div class="cancel-refund-info credit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>$' + booking.fee + '.00 will be removed from your tab</div>';
    } else {
      const hoursLeft = Math.max(0, Math.floor(hoursUntil));
      subtitle = 'This booking is less than 24 hours away (' + hoursLeft + 'h remaining).';
      refundInfo = '<div class="cancel-refund-info no-refund"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>Late cancel — $' + booking.fee + '.00 stays on your tab</div>';
    }

    const modalContent = document.getElementById('cancelModalContent');
    modalContent.innerHTML = '<div class="action-modal-handle"></div>' +
      '<div class="action-modal-title">CANCEL BOOKING?</div>' +
      '<div class="action-modal-subtitle">' + subtitle + '</div>' +
      refundInfo +
      '<div class="cancel-booking-summary">' +
      '  <span>' + formatBookingDate(booking.date) + '</span>' +
      '  <span>Court ' + booking.court + ' \u2022 ' + formatTime(booking.time) + '</span>' +
      '  <span class="booking-ref">' + booking.id + '</span>' +
      '</div>' +
      '<div class="action-modal-options">' +
      '  <button class="action-modal-btn danger" onclick="confirmCancelBooking()">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>' +
      '    Yes, Cancel Booking' +
      '  </button>' +
      '  <button class="action-modal-btn neutral" onclick="closeCancelModal()">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
      '    Keep Booking' +
      '  </button>' +
      '</div>';

    document.getElementById('cancelModal').classList.add('active');
    setTimeout(function() {
      modalContent.classList.add('active');
    }, 50);
  }

  function confirmCancelBooking() {
    try {
    if (!currentBookingToModify) return;

    // Get booking before cancelling to clean up related data
    const booking = memberPaymentData.bookings.find(function(b) { return b.id === currentBookingToModify; });

    const result = cancelBooking(currentBookingToModify);
    closeCancelModal();

    if (result && result.removed) {
      showCelebrationModal('BOOKING CANCELLED', '$' + result.amount.toFixed(2) + ' removed from your tab.');
    } else {
      showToast('Booking cancelled — please cancel 24+ hrs ahead next time');
    }

    // Remove from eventBookings (My Bookings event cards)
    if (booking && typeof removeEventFromMyBookings === 'function') {
      removeEventFromMyBookings('court-' + booking.id);
    }

    // Remove from bookingsData so weekly grid reflects cancellation
    if (booking && typeof bookingsData !== 'undefined' && bookingsData[booking.date]) {
      bookingsData[booking.date] = bookingsData[booking.date].filter(function(b) {
        return !(b.time === booking.time && b.court === booking.court && b.user === 'You');
      });
    }

    // Re-render bookings and weekly grid
    setTimeout(function() {
      renderMyBookings();
      if (typeof renderWeeklyGrid === 'function') renderWeeklyGrid();
    }, 400);
    } catch(e) { console.warn('confirmCancelBooking error:', e); }
  }

  // ============================================
  // UPDATED CONFIRM BOOKING (book-first-pay-later)
  // ============================================
  function confirmBookingPayment() {
    try {
    if (!selectedSlot) {
      showToast('Please select a time slot first');
      return;
    }

    if (!selectedSlot.date || !selectedSlot.time || !selectedSlot.court) {
      showToast('Incomplete booking — please select again');
      closeBookingModal();
      selectedSlot = null;
      return;
    }

    // Validate not booking in the past
    const slotDate = new Date(selectedSlot.date + 'T12:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (slotDate < now) {
      showToast('Cannot book a past date');
      return;
    }

    // Prevent double-booking: check if user already has a confirmed booking at this date+time
    const existingBooking = memberPaymentData.bookings.find(function(b) {
      return b.status === 'confirmed' &&
             b.date === selectedSlot.date &&
             b.time === selectedSlot.time;
    });
    if (existingBooking) {
      showToast('You already have Court ' + existingBooking.court + ' booked at this time');
      return;
    }

    // Also check bookingsData for slot already taken by someone else
    const dayBookings = (typeof bookingsData !== 'undefined' && bookingsData[selectedSlot.date]) ? bookingsData[selectedSlot.date] : [];
    const slotTaken = dayBookings.find(function(b) {
      return b.time === selectedSlot.time &&
             b.court === parseInt(selectedSlot.court) &&
             b.user !== 'You';
    });
    if (slotTaken) {
      showToast('This slot was just booked by ' + slotTaken.user);
      return;
    }

    // Disable button to prevent double-tap
    const btn = document.querySelector('.booking-confirm-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'BOOKING...';
    }

    // Create the booking
    const booking = createBooking(
      parseInt(selectedSlot.court),
      selectedSlot.date,
      selectedSlot.time
    );

    if (!booking) {
      // Blocked by balance/flag
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'CONFIRM & BOOK <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      }
      return;
    }

    setTimeout(function() {
      // Mark slot as booked on grid BEFORE closing modal (closeBookingModal removes .selected)
      document.querySelectorAll('.weekly-slot.selected').forEach(function(s) {
        s.classList.remove('selected', 'available');
        s.classList.add('my-booking');
        s.innerHTML = '<span class="slot-label mine-label">\ud83c\udfbe MY COURT</span>';
      });

      // NOW close the modal
      closeBookingModal();

      // Build celebration message
      const courtTime = formatTime(selectedSlot.time);
      const courtDate = formatBookingDate(selectedSlot.date);

      showCelebrationModal(
        'COURT BOOKED!',
        'Court ' + selectedSlot.court + ' \u2022 ' + courtDate + ' at ' + courtTime + (booking.hasGuest ? '\n\n\ud83d\udc64 Guest fee ($10) added to your tab.' : '')
      );

      // Non-member: show payment popup after celebration
      let userIsMember = true;
      if (typeof memberPaymentData !== 'undefined' && memberPaymentData.currentUser) {
        userIsMember = memberPaymentData.currentUser.isMember !== false;
      }
      if (!userIsMember) {
        const guestCourt = selectedSlot.court;
        const guestTime = courtTime;
        setTimeout(function() {
          closeModal();
          setTimeout(function() {
            showGuestPaymentPopup(guestCourt, guestTime);
          }, 300);
        }, 1500);
      }

      // Add court booking to event bookings so it shows in My Bookings & Schedule
      if (typeof addEventToMyBookings === 'function') {
        addEventToMyBookings('court-' + booking.id, 'booking', {
          title: 'Court ' + booking.court + ' Booking',
          date: booking.date,
          time: formatPaymentTimeRange(booking.time),
          location: 'Court ' + booking.court
        });
      }

      // Also add to bookingsData so weekly grid shows it
      if (typeof bookingsData !== 'undefined') {
        if (!bookingsData[booking.date]) bookingsData[booking.date] = [];
        bookingsData[booking.date].push({
          time: booking.time,
          court: booking.court,
          user: 'You'
        });
      }

      // Persist booking immediately to localStorage
      if (typeof saveBookings === 'function') saveBookings();

      // Update schedule screen if it exists
      if (typeof renderScheduleBookings === 'function') renderScheduleBookings();

      // Show pro-tip on first booking
      if (typeof showBookingProTip === 'function') {
        setTimeout(function() { showBookingProTip(); }, 600);
      }

      triggerBookingNotification();

      selectedSlot = null;

      // Re-enable button
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'CONFIRM & BOOK <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      }
    }, 400);
    } catch(e) { console.warn('confirmBookingPayment error:', e); }
  }

  // ============================================
  // ADMIN: PAYMENT RECONCILIATION
  // ============================================
  function renderAdminPayments() {
    try {
    const container = document.getElementById('adminPaymentsContent');
    if (!container) return;

    const totalBookings = allMembersPayment.reduce(function(s, m) { return s + m.totalBookings; }, 0);
    const totalRevenue = allMembersPayment.reduce(function(s, m) { return s + m.totalPaid; }, 0);
    const totalOwed = allMembersPayment.reduce(function(s, m) { return s + m.tab; }, 0);
    const flaggedCount = allMembersPayment.filter(function(m) { return m.flagged; }).length;
    const totalGuestFees = allMembersPayment.reduce(function(s, m) { return s + (m.guestBookings || 0) * GUEST_FEE; }, 0);

    let html = '';

    html += '<div class="payment-summary-grid">';
    html += '  <div class="payment-summary-card">';
    html += '    <div class="payment-summary-label">COLLECTED</div>';
    html += '    <div class="payment-summary-value volt">$' + totalRevenue + '</div>';
    html += '  </div>';
    html += '  <div class="payment-summary-card">';
    html += '    <div class="payment-summary-label">OUTSTANDING</div>';
    html += '    <div class="payment-summary-value coral">$' + totalOwed + '</div>';
    html += '  </div>';
    html += '  <div class="payment-summary-card">';
    html += '    <div class="payment-summary-label">GUEST FEES</div>';
    html += '    <div class="payment-summary-value">$' + totalGuestFees + '</div>';
    html += '  </div>';
    html += '  <div class="payment-summary-card">';
    html += '    <div class="payment-summary-label">BLOCKED</div>';
    html += '    <div class="payment-summary-value ' + (flaggedCount > 0 ? 'coral' : '') + '">' + flaggedCount + '</div>';
    html += '  </div>';
    html += '</div>';

    if (flaggedCount > 0) {
      html += '<div class="reconciliation-hint" style="border-left: 3px solid var(--coral); margin-bottom: 16px;">';
      html += '  <div class="reconciliation-hint-icon">\u26a0\ufe0f</div>';
      html += '  <div class="reconciliation-hint-text"><strong>' + flaggedCount + ' member' + (flaggedCount > 1 ? 's have' : ' has') + ' reached the $' + TAB_BLOCK_THRESHOLD + ' tab limit.</strong> Their bookings are blocked until they settle up via e-transfer.</div>';
      html += '</div>';
    }

    html += '<div class="reconciliation-hint" style="margin-bottom: 16px;">';
    html += '  <div class="reconciliation-hint-icon">\u2139\ufe0f</div>';
    html += '  <div class="reconciliation-hint-text">Court bookings are <strong>free</strong> for members. Tabs accrue from <strong>guest fees ($10/guest)</strong> and <strong>program fees</strong>. At $' + TAB_BLOCK_THRESHOLD + ', bookings auto-block and you are notified.</div>';
    html += '</div>';

    html += '<div class="section-header"><div class="section-title">MEMBER BALANCES</div><span class="section-action" onclick="exportPaymentReport()">Export</span></div>';

    const sorted = allMembersPayment.slice().sort(function(a, b) {
      if (a.flagged && !b.flagged) return -1;
      if (!a.flagged && b.flagged) return 1;
      return b.tab - a.tab;
    });

    sorted.forEach(function(member) {
      const balanceClass = member.tab > 0 ? 'owed' : (member.overpayment > 0 ? 'credit' : 'clear');
      const balanceText = member.tab > 0 ? '$' + member.tab : (member.overpayment > 0 ? '+$' + member.overpayment : '$0');
      const metaParts = [member.totalBookings + ' bookings'];
      if ((member.guestBookings || 0) > 0) metaParts.push(member.guestBookings + ' guest' + (member.guestBookings > 1 ? 's' : ''));
      if ((member.programFees || 0) > 0) metaParts.push('$' + member.programFees + ' programs');
      metaParts.push('$' + member.totalPaid + ' paid');

      html += '<div class="payment-member-card' + (member.flagged ? ' flagged' : '') + '">';
      html += '  <div class="payment-member-header">';
      html += '  <div class="payment-member-info">';
      html += '      <span class="payment-member-avatar">' + getAvatar(member.name) + '</span>';
      html += '      <div>';
      html += '        <div class="payment-member-name">' + sanitizeHTML(member.name) + (member.flagged ? ' <span class="flag-icon">\ud83d\udeab</span>' : '') + '</div>';
      html += '        <div class="payment-member-meta">' + metaParts.join(' \u2022 ') + '</div>';
      html += '      </div>';
      html += '    </div>';
      html += '    <div class="payment-member-balance ' + balanceClass + '">' + balanceText + '</div>';
      html += '  </div>';
      html += '  <div class="payment-member-actions">';
      html += '    <button class="payment-action-btn mark-paid" data-action="adminMarkPaid" data-member-id="' + member.id + '">';
      html += '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>Mark Paid';
      html += '    </button>';
      if (member.flagged) {
        html += '    <button class="payment-action-btn unflag" data-action="adminUnflagMember" data-member-id="' + member.id + '">';
        html += '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18.36 5.64a9 9 0 11-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>Unblock';
        html += '    </button>';
      } else if (member.tab >= TAB_WARNING_THRESHOLD) {
        html += '    <button class="payment-action-btn flag" data-action="adminFlagMember" data-member-id="' + member.id + '">';
        html += '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>Block';
        html += '    </button>';
      }
      html += '    <button class="payment-action-btn" data-action="adminSendReminder" data-member-id="' + member.id + '" style="color: var(--text-secondary);">';
      html += '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>Remind';
      html += '    </button>';
      html += '  </div>';
      html += '</div>';
    });

    html += '<div class="reconciliation-hint">';
    html += '  <div class="reconciliation-hint-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>';
    html += '  <div class="reconciliation-hint-text">Compare this list against your bank\'s e-transfer deposits weekly. Match amounts and timestamps to identify discrepancies.</div>';
    html += '</div>';

    container.innerHTML = html;
    } catch(e) { console.warn('renderAdminPayments error:', e); }
  }

  function adminMarkPaid(memberId) {
    const member = allMembersPayment.find(function(m) { return m.id === memberId; });
    if (!member) return;

    const owed = member.tab;
    member.totalPaid += owed;
    member.tab = 0;

    if (member.flagged && member.tab < TAB_BLOCK_THRESHOLD) {
      member.flagged = false;
      member.flagReason = '';
    }

    showToast(member.name + ' marked as paid ($' + owed + ')');
    renderAdminPayments();
  }

  function adminFlagMember(memberId) {
    const member = allMembersPayment.find(function(m) { return m.id === memberId; });
    if (!member) return;

    member.flagged = true;
    member.flagReason = 'Flagged by admin — booking restricted';
    showToast(member.name + ' flagged — bookings restricted');
    renderAdminPayments();
  }

  function adminUnflagMember(memberId) {
    const member = allMembersPayment.find(function(m) { return m.id === memberId; });
    if (!member) return;

    member.flagged = false;
    member.flagReason = '';
    showToast(member.name + ' unflagged — bookings restored');
    renderAdminPayments();
  }

  function exportPaymentReport() {
    try {
    let csv = 'Name,Email,Tab,Overpayment,Total Bookings,Total Paid,Guest Bookings,Program Fees,Flagged\n';
    allMembersPayment.forEach(function(m) {
      csv += '"' + m.name + '","' + m.email + '",' + m.tab + ',' + m.overpayment + ',' +
        m.totalBookings + ',' + m.totalPaid + ',' + (m.guestBookings || 0) + ',' +
        (m.programFees || 0) + ',' + (m.flagged ? 'Yes' : 'No') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mtc-payment-report-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Payment report downloaded');
    } catch(e) { console.warn('exportPaymentReport error:', e); }
  }

  function adminSendReminder(memberId) {
    const member = allMembersPayment.find(function(m) { return m.id === memberId; });
    if (!member) return;
    showToast('Payment reminder sent to ' + member.name);
  }

  // ============================================
  // BOOKING PRO-TIP (first-time only)
  // ============================================
  function showBookingProTip() {
    // Check if dismissed permanently
    if (MTC.storage.get('mtc-protip-dismissed', null) === 'never') return;

    // Show the pro-tip
    const overlay = document.getElementById('bookingProTip');
    if (overlay) {
      overlay.classList.add('active');
    }
  }

  function dismissBookingProTip(showAgain) {
    const overlay = document.getElementById('bookingProTip');
    if (overlay) {
      overlay.classList.remove('active');
    }

    if (!showAgain) {
      // "Don't show me again"
      MTC.storage.set('mtc-protip-dismissed', 'never');
    }
  }

  // ============================================
  // INIT
  // ============================================
  function initPaymentSystem() {
    initSampleBookings();
  }

  // ============================================
  // EXPORTS
  // ============================================

  // State: memberPaymentData (read by 7+ files)
  MTC.state.memberPaymentData = memberPaymentData;
  window.memberPaymentData = memberPaymentData;

  // Functions: cross-file public API
  /** Renders court booking cards into the My Bookings screen */
  MTC.fn.renderMyBookings = renderMyBookings;
  window.renderMyBookings = renderMyBookings;

  /** @function MTC.fn.cancelBooking @param {string} bookingRef - Booking reference to cancel */
  MTC.fn.cancelBooking = cancelBooking;
  window.cancelBooking = cancelBooking;

  // Window-only exports (called from index.html onclick or generated HTML)
  window.initPaymentSystem = initPaymentSystem;
  window.showCancelModal = showCancelModal;
  window.showPaymentHistory = typeof showPaymentHistory !== 'undefined' ? showPaymentHistory : undefined;
  window.showPayTab = typeof showPayTab !== 'undefined' ? showPayTab : undefined;
  window.showEtransferModal = typeof showEtransferModal !== 'undefined' ? showEtransferModal : undefined;
  window.closeEtransferModal = typeof closeEtransferModal !== 'undefined' ? closeEtransferModal : undefined;
  window.toggleAutoDeposit = typeof toggleAutoDeposit !== 'undefined' ? toggleAutoDeposit : undefined;
  window.sendEtransfer = typeof sendEtransfer !== 'undefined' ? sendEtransfer : undefined;
  window.exportPaymentReport = exportPaymentReport;

  // Window-only exports (called from onclick in generated HTML or index.html)
  window.confirmBookingPayment = confirmBookingPayment;
  window.confirmCancelBooking = confirmCancelBooking;
  window.createBooking = createBooking;
  window.toggleGuestFee = toggleGuestFee;
  window.renderAdminPayments = renderAdminPayments;
  window.adminMarkPaid = adminMarkPaid;
  window.adminFlagMember = adminFlagMember;
  window.adminUnflagMember = adminUnflagMember;
  window.adminSendReminder = adminSendReminder;
  window.showBookingProTip = showBookingProTip;
  window.dismissBookingProTip = dismissBookingProTip;
  window.getUpcomingBookings = getUpcomingBookings;
  window.getPastBookings = getPastBookings;
  window.getUnpaidTotal = getUnpaidTotal;
  window.formatBookingDate = formatBookingDate;
  window.formatTime = formatTime;
  window.formatPaymentTimeRange = formatPaymentTimeRange;

})();
