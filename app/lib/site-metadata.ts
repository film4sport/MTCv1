import { CDN_IMAGE_BASE, CLUB_NAME, SITE_URL } from './site';

export const SITE_METADATA = {
  siteUrl: SITE_URL,
  cdnImageBase: CDN_IMAGE_BASE,
  organizationName: CLUB_NAME,
  landingTitle: `${CLUB_NAME} | Premier Tennis in Caledon, Dufferin & Mono, Ontario`,
  landingDescription:
    `${CLUB_NAME} is a not-for-profit community tennis club in Mono, Ontario — serving Orangeville, Caledon, Shelburne, Bolton, Brampton, Dufferin County, and the GTA since 1980. 4 outdoor courts, tournaments, summer camps, coaching, and social round robins for all skill levels.`,
  landingOgDescription:
    `Join ${CLUB_NAME} — the heart of community tennis in Mono, Caledon, and Dufferin County since 1980. Tournaments, camps, social events, and beautiful courts in an amazing natural setting.`,
  infoTitle: `Club Info — Membership, FAQ & About | ${CLUB_NAME}`,
  infoDescription:
    `Everything you need to know about ${CLUB_NAME}: membership fees, facilities, club history since 1980, FAQ, directions to 754483 Mono Centre Rd, and how to join the Caledon-Dufferin tennis community.`,
  loginTitle: `Member Login | ${CLUB_NAME}`,
  loginDescription:
    `Log in to your ${CLUB_NAME} member dashboard to book courts, view schedules, and manage your membership.`,
  signupTitle: `Join ${CLUB_NAME} — Become a Member`,
  signupDescription:
    `Register for ${CLUB_NAME} membership. Season runs May through October with 4 courts, coaching, tournaments, and a welcoming community in Mono, Ontario. Fees from $55/year.`,
  heroImage: `${CDN_IMAGE_BASE}/hero-aerial-court.png`,
} as const;

export const INFO_TAB_METADATA = {
  about: {
    heroTitle: 'About Us',
    heroSubtitle: `Learn about ${CLUB_NAME}, our mission, facilities, news, and community.`,
    documentTitle: `About Us — History, Facilities & Board | ${CLUB_NAME}`,
    description: `Learn about ${CLUB_NAME} — our history since 1980, 4 courts, clubhouse facilities, and volunteer Board of Directors in Mono, Ontario.`,
  },
  membership: {
    heroTitle: 'Membership',
    heroSubtitle: `Everything you need to know about joining ${CLUB_NAME}, fees, and how to register.`,
    documentTitle: `Membership — Fees, Benefits & How to Join | ${CLUB_NAME}`,
    description: `Join ${CLUB_NAME} — membership fees from $55/year, family plans, guest passes, and online registration for the Caledon-Dufferin tennis community.`,
  },
  rules: {
    heroTitle: 'Rules & Constitution',
    heroSubtitle: `Club rules, regulations, and our constitution governing the operation of ${CLUB_NAME}.`,
    documentTitle: `Club Rules & Constitution | ${CLUB_NAME}`,
    description: `${CLUB_NAME} constitution, court rules, regulations, and member code of conduct.`,
  },
  coaching: {
    heroTitle: 'Coaching & Camps',
    heroSubtitle: 'Meet our coaching staff and learn about programs for players of all ages and skill levels.',
    documentTitle: `Coaching — Lessons, Camps & Programs | ${CLUB_NAME}`,
    description: `Tennis coaching at ${CLUB_NAME} — lessons with Mark Taylor, summer camps for juniors, clinics for all levels in Mono, Ontario.`,
  },
  faq: {
    heroTitle: 'FAQ & Directions',
    heroSubtitle: "All the A's to Your Q's",
    documentTitle: `FAQ & Directions — Find Us | ${CLUB_NAME}`,
    description: `Frequently asked questions about ${CLUB_NAME} — hours, equipment, booking, guest policy, and directions to 754483 Mono Centre Rd.`,
  },
  privacy: {
    heroTitle: 'Privacy Policy',
    heroSubtitle: `How ${CLUB_NAME} collects, uses, and protects your personal information.`,
    documentTitle: `Privacy Policy | ${CLUB_NAME}`,
    description: `${CLUB_NAME} privacy policy — how we collect, use, and protect your personal information under PIPEDA.`,
  },
  terms: {
    heroTitle: 'Terms of Service',
    heroSubtitle: `The terms and conditions governing your use of ${CLUB_NAME} services.`,
    documentTitle: `Terms of Service | ${CLUB_NAME}`,
    description: `${CLUB_NAME} terms of service — membership agreement, liability, and usage policies.`,
  },
} as const;
