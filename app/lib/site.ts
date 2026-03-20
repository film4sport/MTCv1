import siteContent from './site-content.json';

export const CLUB_NAME = siteContent.clubName;
export const SUPPORT_EMAIL = siteContent.supportEmail;
export const SUPPORT_EMAIL_MAILTO = `mailto:${SUPPORT_EMAIL}`;
export const PAYMENT_EMAIL = siteContent.paymentEmail;
export const PAYMENT_EMAIL_MAILTO = `mailto:${PAYMENT_EMAIL}`;
export const MEMBERSHIP_SEASON_YEAR = siteContent.membershipSeasonYear;
export const SITE_URL = siteContent.siteUrl;
export const CDN_IMAGE_BASE = siteContent.cdnImageBase;

export const APP_ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  dashboardProfile: '/dashboard/profile',
  dashboardBook: '/dashboard/book',
  dashboardSchedule: '/dashboard/schedule',
  dashboardEvents: '/dashboard/events',
  dashboardPartners: '/dashboard/partners',
  dashboardMessages: '/dashboard/messages',
  dashboardSettings: '/dashboard/settings',
  dashboardLessons: '/dashboard/lessons',
  dashboardCaptain: '/dashboard/captain',
  dashboardAdmin: '/dashboard/admin',
  mobileApp: '/mobile-app/index.html',
  info: '/info',
  infoTab(tab: string, hash?: string) {
    return `/info?tab=${tab}${hash ? `#${hash}` : ''}`;
  },
} as const;

export const APP_COPY = {
  backToHome: 'Back to Home',
  becomeMember: 'Become a Member',
  memberLogin: 'Member Login',
  goToDashboard: 'Go to Dashboard',
  home: 'Home',
  bookCourt: 'Book Court',
  schedule: 'Schedule',
  clubEvents: 'Club Events',
  partners: 'Partners',
  findPartners: 'Find Partners',
  messages: 'Messages',
  settings: 'Settings',
  lessons: 'Lessons',
  myTeam: 'My Team',
  adminPanel: 'Admin Panel',
} as const;
