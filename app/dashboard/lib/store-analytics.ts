/**
 * Pure computation functions for dashboard analytics.
 * Extracted from store.tsx to reduce AppProvider size and improve testability.
 * No React dependencies -- these are plain functions on plain data.
 */
import type { Booking, User, CoachingProgram, AdminAnalytics } from './types';

/** Membership fee lookup (annual, CAD). */
export const MEMBERSHIP_FEES: Record<string, number> = { adult: 120, family: 240, junior: 55 };

/**
 * Compute all dashboard analytics from current state.
 * Pure function -- no side effects, no React state access.
 */
export function computeAnalytics(
  bookings: Booking[],
  members: User[],
  programs: CoachingProgram[],
): AdminAnalytics {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const today = now.toISOString().slice(0, 10);
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

  // --- Bookings this month vs last month ---
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
    const fee = MEMBERSHIP_FEES[(m.membershipType as string) || 'adult'] || MEMBERSHIP_FEES.adult;
    return sum + fee;
  }, 0);
  const programRevenue = programs.reduce((sum, p) => sum + (p.fee * (p.enrolledMembers?.length || 0)), 0);
  const totalRevenue = membershipRevenue + programRevenue;
  const revenueBreakdown = [
    { category: 'Memberships', amount: membershipRevenue, percentage: totalRevenue > 0 ? Math.round((membershipRevenue / totalRevenue) * 100) : 0 },
    ...(programRevenue > 0 ? [{ category: 'Programs', amount: programRevenue, percentage: Math.round((programRevenue / totalRevenue) * 100) }] : []),
  ];

  // --- Revenue this month ---
  const newMembersThisMonth = members.filter(m => {
    if (!m.memberSince) return false;
    const d = new Date(m.memberSince);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const revenueThisMonth = newMembersThisMonth.reduce((sum, m) => sum + (MEMBERSHIP_FEES[(m.membershipType as string) || 'adult'] || MEMBERSHIP_FEES.adult), 0) + programRevenue;
  const revenueLastMonth = 0; // Would need historical data
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
    const rev = newMembers.reduce((s, mem) => s + (MEMBERSHIP_FEES[(mem.membershipType as string) || 'adult'] || MEMBERSHIP_FEES.adult), 0);
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
}
