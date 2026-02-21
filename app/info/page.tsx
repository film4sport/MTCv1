'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signUp, signIn } from '../dashboard/lib/auth';
import { sendWelcomeMessage } from '../dashboard/lib/db';
import '../(landing)/styles/landing.css';

const privacySections = [
  {
    title: 'What We Collect',
    content: 'We collect personal information you provide when registering: name and email address. We also collect booking history and payment records to manage your membership.',
  },
  {
    title: 'How We Use Your Information',
    content: 'Your information is used to manage your membership, process court bookings, communicate club news and events, and improve our services. We may use your email to send seasonal updates and event notifications.',
  },
  {
    title: 'Sharing Your Information',
    content: 'We do not sell or share your personal information with third parties. Information may be shared with club coaches for lesson scheduling, or with payment processors to handle membership fees. We may disclose information if required by law.',
  },
  {
    title: 'Your Rights Under PIPEDA',
    content: 'Under Canada\'s Personal Information Protection and Electronic Documents Act (PIPEDA), you have the right to access your personal information, request corrections, and withdraw consent for its use. To exercise these rights, contact us at info@monotennisclub.ca.',
  },
  {
    title: 'Data Security',
    content: 'We implement reasonable security measures to protect your personal information, including encrypted storage and secure access controls. However, no method of electronic transmission or storage is 100% secure.',
  },
  {
    title: 'Data Retention',
    content: 'We retain your personal information for as long as your membership is active, plus two years after cancellation for record-keeping purposes. Payment records are retained for seven years as required by tax regulations.',
  },
  {
    title: 'Contact Us',
    content: 'For privacy-related questions or concerns, contact our Privacy Officer at info@monotennisclub.ca or write to: Mono Tennis Club, 754883 Mono Centre Road, Mono, Ontario, L9W 6S3.',
  },
];

const termsSections = [
  {
    title: 'Acceptance of Terms',
    content: 'By accessing or using the Mono Tennis Club website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',
  },
  {
    title: 'Account Responsibilities',
    content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration.',
  },
  {
    title: 'Booking & Cancellation Policy',
    content: 'Court bookings can be made up to 7 days in advance. Cancellations must be made at least 24 hours before the booked time. Repeated no-shows may result in booking restrictions. Guest fees are non-refundable.',
  },
  {
    title: 'Code of Conduct',
    content: 'Members must conduct themselves in a respectful and sportsmanlike manner at all times. The club reserves the right to revoke membership for behaviour deemed detrimental to the club, its members, or its facilities.',
  },
  {
    title: 'Intellectual Property',
    content: 'All content on the Mono Tennis Club website, including text, graphics, logos, and software, is the property of Mono Tennis Club and is protected by Canadian copyright law. You may not reproduce or distribute this content without permission.',
  },
  {
    title: 'Limitation of Liability',
    content: 'Mono Tennis Club shall not be liable for any indirect, incidental, or consequential damages arising from your use of our facilities or services. All members must sign a waiver of liability before participating in club activities.',
  },
  {
    title: 'Governing Law',
    content: 'These Terms of Service are governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any disputes shall be resolved in the courts of Ontario.',
  },
  {
    title: 'Changes to Terms',
    content: 'We reserve the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated effective date. Continued use of our services after changes constitutes acceptance of the new terms.',
  },
];

const faqItems = [
  {
    question: 'How do I become a member?',
    answer: 'Register online starting March 1st. Membership includes court access, events, and booking privileges.',
  },
  {
    question: 'When is the club open?',
    answer: 'Late April through late October (weather permitting). Courts available dawn to dusk daily.',
  },
  {
    question: 'Do I need my own equipment?',
    answer:
      'Bring your own racquet and balls. Wear proper tennis shoes (non-marking soles). Clubhouse has water and washroom facilities.',
  },
  {
    question: 'Programs for beginners?',
    answer:
      'Absolutely! Social round robins are perfect for beginners. We also offer coaching programs and clinics.',
  },
  {
    question: 'How do I book a court?',
    answer: 'Use our online booking system. Select your date/time and confirm. Book up to 7 days in advance.',
  },
  {
    question: 'Can I bring guests?',
    answer: 'Yes! Guest fees apply. Guests must be accompanied by a member and follow club rules.',
  },
];

const clubRules = [
  'Courts must be booked online using the Club\'s booking system.',
  'The Club is for members\' use; guests are permitted when accompanied by a member.',
  'Tennis courts are for the exclusive use of tennis — no other sports are permitted.',
  'Children under 12 with a family membership must be accompanied by a parent/guardian or Club Pro.',
  'Non-marking shoes are required on courts. No street shoes. Proper sports attire is required.',
  'The last member to leave is responsible for locking the front gate and clubhouse.',
  'No play on courts that are slippery from rain, frost, or snow.',
  'Members must remain respectful at all times. Disrespectful behavior may result in membership cancellation.',
  'Government-mandated health rules adopted by the Board supersede all other club rules.',
];

const constitutionArticles = [
  {
    title: 'Article 1 — Name',
    content: 'The organization is called the Mono Tennis Club, located at 754483 Mono Centre Road, Mono, Ontario L9W 5W9, beside the Mono Community Centre.',
  },
  {
    title: 'Article 2 — Purpose',
    content: 'The purpose of the Club is to promote the game of tennis in Mono by organizing tournaments, clinic round robins, competitive teams, coaching, kids camps, house leagues and more. The Club shall operate as a not-for-profit organization.',
  },
  {
    title: 'Article 3 — Membership',
    content: 'Court access requires either full Club membership or non-club membership through the Town\'s Recreation Department. Members must pay fees and complete registration before playing. Adults are 18+ at calendar year start; juniors are 17 or younger. Only paid-up Club members are permitted to play on Club teams.',
  },
  {
    title: 'Article 4 — Executive Officers',
    content: 'The Board comprises five Executive Officers (President, Vice-President, Secretary, Treasurer, Past President) plus Members-At-Large, elected annually at the AGM. No term limits apply. The Board oversees all Club activities, maintenance, and must prioritize transparency in decision-making.',
  },
  {
    title: 'Article 5 — Activity Coordinators',
    content: 'Activity Coordinators are appointed by the Executive to organize specific club programs including tournaments, round robins, junior programs, coaching, and social events. Coordinators report to the Executive and serve at its pleasure.',
  },
  {
    title: 'Article 6 — Meetings',
    content: 'Board meetings occur regularly April through October; off-season meetings as needed. The AGM is held in September or October. Members vote in person or by proxy. AGM notice and nominations must be sent a minimum of 21 days in advance. Quorum requires four Board members. Constitutional amendments require a two-thirds majority of members attending in person or by proxy.',
  },
  {
    title: 'Article 7 — Finances & Budget',
    content: 'Club funds support facility improvements, programs, and tennis promotion. Commitments under $1,000 are at individual Board member discretion with President consultation. Commitments $1,000–$5,000 require Board majority. Commitments exceeding $5,000 require a membership vote. The fiscal year runs September 1 to August 31 unless the Board specifies otherwise.',
  },
  {
    title: 'Article 8 — Solicitation',
    content: 'Members cannot canvass, solicit, or exhibit services or products on premises or at Club events without Executive authorization. Members cannot use the membership list for solicitation or canvassing for any product, service, or political party.',
  },
];

const waiverText = `MONO TENNIS CLUB — WAIVER AND RELEASE OF LIABILITY, ASSUMPTION OF RISK AND INDEMNITY AGREEMENT

PLEASE READ CAREFULLY BEFORE SIGNING

In consideration of being permitted to participate in the activities of the Mono Tennis Club ("the Club"), I hereby agree as follows:

1. RELEASE OF LIABILITY: I hereby release, waive, discharge, and covenant not to sue the Mono Tennis Club, its officers, directors, employees, volunteers, agents, and representatives (collectively "the Releasees") from any and all liability, claims, demands, actions, or causes of action whatsoever arising out of or related to any loss, damage, or injury, including death, that may be sustained by me, or to any property belonging to me, while participating in any activity organized by the Club, or while on Club premises, regardless of whether such loss, damage, or injury is caused by the negligence of the Releasees or otherwise.

2. ASSUMPTION OF RISK: I am aware that participation in tennis and related activities involves risks and dangers, including but not limited to the risk of serious physical injury, permanent disability, and death. I hereby freely and voluntarily assume and accept any and all risks of injury or death while participating in Club activities. I acknowledge that tennis activities carry inherent risks including, but not limited to: falls, collisions with other players or fixed objects, injuries from tennis balls or racquets, muscle strains and sprains, heat-related illness, and cardiac events.

3. INDEMNITY: I agree to indemnify and hold harmless the Releasees from any and all claims, actions, suits, procedures, costs, expenses, damages and liabilities, including attorney's fees, brought as a result of my involvement in Club activities and to reimburse them for any such expenses incurred.

4. GOVERNING LAW: This Agreement shall be governed by and construed in accordance with the laws of the Province of Ontario and the laws of Canada applicable therein.

5. SEVERABILITY: If any term or provision of this Agreement shall be held illegal, unenforceable, or in conflict with any law governing this Agreement, the validity of the remaining portions shall not be affected thereby.

By clicking "I Agree" below, I acknowledge that I have read this Agreement, fully understand its terms, and understand that I am giving up substantial rights, including my right to sue. I acknowledge that I am signing this Agreement freely and voluntarily, and intend my acceptance to be a complete and unconditional release of all liability to the greatest extent allowed by law.`;

const acknowledgementText = `MONO TENNIS CLUB — ACKNOWLEDGEMENT AGREEMENT

By becoming a member of the Mono Tennis Club, I acknowledge and agree to the following:

1. CLUB RULES: I have read, understood, and agree to abide by all Club rules and regulations as posted and as amended from time to time by the Board of Directors. I understand that failure to comply may result in suspension or termination of my membership.

2. COURT ETIQUETTE: I will conduct myself in a sportsmanlike manner at all times, respect other members and guests, and follow proper court etiquette including timely completion of booked sessions, appropriate attire, and non-marking footwear.

3. FACILITY CARE: I will treat the Club's facilities, courts, and equipment with care and respect. I will report any damage or maintenance issues to the Board. I understand that I may be held financially responsible for any damage I cause through negligence or misuse.

4. GUEST POLICY: I understand that guests must be accompanied by a member at all times, that guest fees apply, and that I am responsible for my guests' conduct and adherence to Club rules.

5. COMMUNICATION: I agree to receive Club communications regarding schedules, events, rule changes, and other Club-related matters via the in-app messaging system and email provided during registration.

6. PHOTOGRAPHY & MEDIA: I consent to the use of photographs or videos taken during Club events and activities for Club promotional purposes, unless I notify the Board in writing of my objection.

7. PRIVACY: I acknowledge that the Club collects and uses my personal information in accordance with its Privacy Policy and in compliance with PIPEDA. I consent to the collection and use of my information as described therein.

8. CONSTITUTION: I have read and agree to be bound by the Club's Constitution, which governs the operation, membership, and administration of the Mono Tennis Club.

By clicking "I Agree" below, I confirm that I have read and understood this Acknowledgement Agreement and voluntarily agree to its terms as a condition of my membership in the Mono Tennis Club.`;

const membershipTypes = [
  { key: 'adult', label: 'Adult (Single)', price: 100 },
  { key: 'family', label: 'Family', price: 200 },
  { key: 'student', label: 'Student (18 & under)', price: 50 },
  { key: 'guest', label: 'Guest Pass', price: 10 },
];

// Signup flow excludes Guest Pass (guests don't need accounts)
const signupMembershipTypes = membershipTypes.filter(m => m.key !== 'guest');

function InfoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const waiverRef = useRef<HTMLDivElement>(null);
  const ackRef = useRef<HTMLDivElement>(null);
  const tab = searchParams.get('tab') || 'membership';
  const [activeTab, setActiveTab] = useState(tab);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [activeConstitution, setActiveConstitution] = useState<number | null>(null);
  const [activePrivacy, setActivePrivacy] = useState<number | null>(null);
  const [activeTerms, setActiveTerms] = useState<number | null>(null);

  // Signup flow state
  const [signupStep, setSignupStep] = useState(0);
  const [signupData, setSignupData] = useState({ membershipType: '', name: '', email: '', password: '' });
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverScrolled, setWaiverScrolled] = useState(false);
  const [ackScrolled, setAckScrolled] = useState(false);
  const [existingProfile, setExistingProfile] = useState<{ name: string; email: string; role?: string; status?: string } | null>(null);

  // Load existing profile from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mtc-current-user');
      if (stored) setExistingProfile(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [signupStep]);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  // Auto-detect if waiver/ack content fits without scrolling (large screens)
  useEffect(() => {
    if (signupStep === 3) {
      const checkFit = () => {
        if (waiverRef.current) {
          const { scrollHeight, clientHeight } = waiverRef.current;
          if (scrollHeight <= clientHeight + 10) setWaiverScrolled(true);
        }
        if (ackRef.current) {
          const { scrollHeight, clientHeight } = ackRef.current;
          if (scrollHeight <= clientHeight + 10) setAckScrolled(true);
        }
      };
      // Check after render
      requestAnimationFrame(checkFit);
    }
  }, [signupStep]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    pageRef.current?.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab, signupStep]);

  // Tab-specific document titles for SEO (Google sees each ?tab= as a unique URL)
  useEffect(() => {
    const titles: Record<string, string> = {
      about: 'About Us — History, Facilities & Board | Mono Tennis Club',
      membership: 'Membership — Fees, Benefits & How to Join | Mono Tennis Club',
      coaching: 'Coaching — Lessons, Camps & Programs | Mono Tennis Club',
      faq: 'FAQ & Directions — Find Us | Mono Tennis Club',
      rules: 'Club Rules & Constitution | Mono Tennis Club',
      privacy: 'Privacy Policy | Mono Tennis Club',
      terms: 'Terms of Service | Mono Tennis Club',
    };
    document.title = titles[activeTab] || 'Club Info | Mono Tennis Club';

    const descriptions: Record<string, string> = {
      about: 'Learn about Mono Tennis Club — our history since 1980, 4 courts, clubhouse facilities, and volunteer Board of Directors in Mono, Ontario.',
      membership: 'Join Mono Tennis Club — membership fees from $50/year, family plans, guest passes, and online registration for the Caledon-Dufferin tennis community.',
      coaching: 'Tennis coaching at Mono Tennis Club — lessons with Mark Taylor, summer camps for juniors, clinics for all levels in Mono, Ontario.',
      faq: 'Frequently asked questions about Mono Tennis Club — hours, equipment, booking, guest policy, and directions to 754883 Mono Centre Road.',
      rules: 'Mono Tennis Club constitution, court rules, regulations, and member code of conduct.',
      privacy: 'Mono Tennis Club privacy policy — how we collect, use, and protect your personal information under PIPEDA.',
      terms: 'Mono Tennis Club terms of service — membership agreement, liability, and usage policies.',
    };
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', descriptions[activeTab] || '');
  }, [activeTab]);

  // FAQPage JSON-LD for Google rich results (injected when FAQ tab active)
  useEffect(() => {
    if (activeTab !== 'faq') return;
    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld';
    script.textContent = JSON.stringify(faqJsonLd);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [activeTab]);

  const switchTab = (newTab: string) => {
    setActiveTab(newTab);
    setFaqSearch('');
    setSignupStep(0);
    router.push(`/info?tab=${newTab}`, { scroll: false });
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const toggleConstitution = (index: number) => {
    setActiveConstitution(activeConstitution === index ? null : index);
  };

  const handleWaiverScroll = () => {
    if (waiverRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = waiverRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setWaiverScrolled(true);
      }
    }
  };

  const handleAckScroll = () => {
    if (ackRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = ackRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setAckScrolled(true);
      }
    }
  };

  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const completeSignup = async () => {
    setSignupError('');
    setSignupLoading(true);

    try {
      // Create Supabase auth user + profile
      const { user, error } = await signUp(signupData.email, signupData.password, signupData.name, signupData.membershipType);
      if (error || !user) {
        setSignupError(error || 'Signup failed. Please try again.');
        setSignupLoading(false);
        return;
      }

      // Sign in immediately to establish Supabase session (so middleware allows dashboard access)
      const loggedInUser = await signIn(signupData.email, signupData.password);
      if (!loggedInUser) {
        // Auth user was created but profile may not exist yet — still show success
        console.error('[MTC] signIn after signUp returned null — profile may not be ready yet');
      }

      // Send welcome message with gate code (non-blocking)
      sendWelcomeMessage(user.id, user.name).catch(err => console.error('[MTC] welcome message:', err));

      // Cache user for instant dashboard access
      localStorage.setItem('mtc-current-user', JSON.stringify(loggedInUser || user));

      setSignupLoading(false);
      setSignupStep(5);
    } catch {
      setSignupError('Something went wrong. Please try again.');
      setSignupLoading(false);
    }
  };

  const getMembershipPrice = () => {
    const found = membershipTypes.find((m) => m.key === signupData.membershipType);
    return found ? found.price : 0;
  };

  const getMembershipLabel = () => {
    const found = membershipTypes.find((m) => m.key === signupData.membershipType);
    return found ? found.label : '';
  };

  const heroTitles: Record<string, { title: string; subtitle: string }> = {
    about: {
      title: 'About Us',
      subtitle: 'Learn about Mono Tennis Club, our mission, facilities, and community.',
    },
    membership: {
      title: 'Membership & News',
      subtitle: 'Everything you need to know about joining Mono Tennis Club, our facilities, fees, and the latest club news.',
    },
    rules: {
      title: 'Rules & Constitution',
      subtitle: 'Club rules, regulations, and our constitution governing the operation of Mono Tennis Club.',
    },
    coaching: {
      title: 'Coaching & Camps',
      subtitle: 'Meet our coaching staff and learn about programs for players of all ages and skill levels.',
    },
    faq: {
      title: 'FAQ & Directions',
      subtitle: 'Find answers to common questions and directions to the club.',
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'How Mono Tennis Club collects, uses, and protects your personal information.',
    },
    terms: {
      title: 'Terms of Service',
      subtitle: 'The terms and conditions governing your use of Mono Tennis Club services.',
    },
  };

  const currentHero = heroTitles[activeTab] || heroTitles.membership;

  return (
    <div ref={pageRef} style={{ backgroundColor: '#f5f2eb', minHeight: '100vh' }}>
      {/* Header / Nav Bar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 lg:px-16 py-4" style={{ backgroundColor: 'rgba(26, 31, 18, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(232, 228, 217, 0.08)' }}>
        <a href="/" className="headline-font text-xl font-bold tracking-wide" style={{ color: '#e8e4d9', textDecoration: 'none' }}>
          <span>M</span><span>T</span><span>C</span>
        </a>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: '#d4e157' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </a>
      </nav>

      {/* Hero Banner */}
      <section className="py-16 lg:py-24 px-8 lg:px-16 text-center fade-in" style={{ backgroundColor: '#f5f2eb' }}>
        <span className="section-label">// Club Information</span>
        <h1 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#2a2f1e' }}>
          {currentHero.title}
        </h1>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
          {currentHero.subtitle}
        </p>
      </section>

      {/* Tab Navigation */}
      <div className="sticky top-[61px] z-40 px-8 lg:px-16 py-3" style={{ backgroundColor: '#f5f2eb', borderBottom: '1px solid #e0dcd3' }}>
        <div className="max-w-7xl mx-auto flex justify-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {[
            { key: 'about', label: 'About' },
            { key: 'membership', label: 'Membership' },
            { key: 'coaching', label: 'Coaching' },
            { key: 'faq', label: 'FAQ' },
            { key: 'rules', label: 'Rules' },
            { key: 'privacy', label: 'Privacy' },
            { key: 'terms', label: 'Terms' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0"
              style={
                activeTab === t.key
                  ? { backgroundColor: '#6b7a3d', color: '#fff' }
                  : { backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* =================== ABOUT TAB =================== */}
      {activeTab === 'about' && (
        <>
          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="relative fade-in-left">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                    <img src="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/gallery-05-serve.png" alt="Tennis serve at Mono Tennis Club" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="hidden lg:grid grid-cols-2 gap-3 mt-3">
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img src="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/gallery-01-community.jpeg" alt="Mono Tennis Club Community" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img src="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/MTC%20logo.jpg" alt="Mono Tennis Club Logo" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                </div>

                <div className="fade-in-right">
                  <span className="section-label">// About Us</span>
                  <h2 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#2a2f1e' }}>
                    Mono Tennis Club — Empowering Your Tennis Journey with{' '}
                    <span style={{ color: '#6b7a3d' }}>Passion, Community,</span> and Dedication.
                  </h2>
                  <p className="leading-relaxed mb-6" style={{ color: '#6b7266' }}>
                    Welcome to Mono Tennis Club, a not-for-profit community tennis club located in the heart of Mono, Ontario.
                    We promote the game of tennis by organizing tournaments, clinic round robins, competitive teams, coaching,
                    kids camps, house leagues and more.
                  </p>
                  <p className="leading-relaxed mb-8" style={{ color: '#6b7266' }}>
                    Whether you&apos;re a beginner picking up a racket for the first time or a seasoned player looking for
                    competitive matches, Mono Tennis Club is your trusted partner in achieving your full potential and making
                    lasting memories on the court.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {['Parking', 'Wheelchair Accessible', 'Clubhouse', 'Pro Courts'].map((tag) => (
                      <span key={tag} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(107, 122, 61, 0.12)', color: '#4a5528' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Board of Directors */}
          <section className="py-12 lg:py-16 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
            <div className="max-w-7xl mx-auto fade-in">
              <div className="text-center mb-8">
                <span className="section-label">// Leadership</span>
                <h2 className="headline-font text-2xl md:text-3xl leading-tight mt-3" style={{ color: '#2a2f1e' }}>
                  Board of Directors
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { name: 'Patti Powell', role: 'President' },
                  { name: 'Peter Gibson', role: 'Past President' },
                  { name: 'Jan Howard', role: 'Treasurer' },
                  { name: 'Kelly Kamstra-Lloyd', role: 'Member at Large' },
                  { name: 'Patrick Minshall', role: 'Member at Large' },
                  { name: 'Phil Primmer', role: 'Member at Large' },
                  { name: 'Michael Horton', role: 'Member at Large' },
                ].map((member) => (
                  <div key={member.name} className="rounded-xl p-4 text-center" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#2a2f1e' }}>{member.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7266' }}>{member.role}</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs mt-4" style={{ color: '#999' }}>
                Vice-President and Secretary positions are currently open.
              </p>
            </div>
          </section>

        </>
      )}

      {/* =================== MEMBERSHIP TAB =================== */}
      {activeTab === 'membership' && (
        <>
          {/* Existing Member Profile Banner */}
          {existingProfile && signupStep === 0 && (
            <section className="py-8 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
              <div className="max-w-3xl mx-auto">
                <div className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.12), rgba(212, 225, 87, 0.06))', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6b7a3d', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                    {existingProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-base" style={{ color: '#2a2f1e' }}>{existingProfile.name}</h4>
                    <p className="text-sm" style={{ color: '#6b7266' }}>
                      {existingProfile.status === 'paused' ? 'Paused' : 'Active'} Member
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#999' }}>{existingProfile.email}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={existingProfile.status === 'paused'
                    ? { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#92400e' }
                    : { backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }
                  }>
                    {existingProfile.status === 'paused' ? 'Paused' : 'Active'}
                  </span>
                </div>
              </div>
            </section>
          )}

          {signupStep === 0 ? (
            <>
              <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-12 fade-in">
                    <span className="section-label">// Membership</span>
                    <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                      How to Join
                    </h2>
                    <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                      Mono Tennis Club is a not-for-profit community club that has been promoting tennis in Mono since 1980. Registration opens March 1st each year for the May–October season.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 fade-in">
                    <div className="rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                        <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-xl mb-4" style={{ color: '#2a2f1e' }}>How to Join</h3>
                      <ul className="space-y-3 text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                        {['Registration opens March 1st each year', 'Pay by Interac e-transfer or credit/debit card', 'Guest passes available for $10 per visit', 'All members must sign a waiver'].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                        <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-xl mb-4" style={{ color: '#2a2f1e' }}>Membership Fees</h3>
                      <div className="space-y-3">
                        {membershipTypes.map((fee, i) => (
                          <div key={i} className="flex items-center justify-between py-2" style={i < 3 ? { borderBottom: '1px solid #e0dcd3' } : {}}>
                            <span className="text-sm" style={{ color: '#6b7266' }}>{fee.label}</span>
                            <span className="font-semibold text-sm" style={{ color: '#4a5528' }}>${fee.price}{fee.key === 'guest' ? ' / visit' : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-12 fade-in">
                    <button
                      onClick={() => setSignupStep(1)}
                      className="px-10 py-4 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                      style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
                    >
                      Join Now
                    </button>
                  </div>
                </div>
              </section>

              {/* Season & Facilities */}
              <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-12 fade-in">
                    <span className="section-label">// Facilities</span>
                    <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                      Season &amp; Facilities
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in">
                    {[
                      { icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', title: 'Season', desc: 'May through October' },
                      { icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', title: '4 Courts', desc: 'Courts 1 & 2 have lights' },
                      { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', title: 'Clubhouse', desc: 'Washrooms & facilities' },
                      { icon: 'M5 13l4 4L19 7', title: 'Accessible', desc: 'Wheelchair accessible & free parking' },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl p-6 text-center" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                          <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                        </div>
                        <h4 className="font-bold mb-2" style={{ color: '#2a2f1e' }}>{item.title}</h4>
                        <p className="text-sm" style={{ color: '#6b7266' }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 rounded-xl p-8 fade-in" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                        <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1" style={{ color: '#2a2f1e' }}>Location</h4>
                        <address className="not-italic text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                          754883 Mono Centre Road, Mono, Ontario, L9W 6S3
                        </address>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* News & Updates */}
              <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-12 fade-in">
                    <span className="section-label">// News</span>
                    <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                      News &amp; Updates
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8 fade-in">
                    {[
                      { badge: 'Announcement', date: 'March 2026', title: 'Registration Opens March 1st', desc: 'The 2026 season registration opens on March 1st. Pay online via Interac e-transfer or credit/debit card. Early bird discounts may apply.' },
                      { badge: 'Newsletter', date: 'April 2026', title: 'Spring Newsletter', desc: 'Get the latest updates on the upcoming season, new programs, coaching staff changes, and social events planned for the summer.' },
                      { badge: 'Fundraiser', date: 'Ongoing', title: 'Court Resurfacing Fund', desc: 'Help us maintain and improve our courts. Donations go toward resurfacing and upgrading our facilities for future seasons.' },
                    ].map((news, i) => (
                      <div key={i} className="rounded-xl p-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }}>
                            {news.badge}
                          </span>
                          <span className="text-xs" style={{ color: '#999' }}>{news.date}</span>
                        </div>
                        <h3 className="font-bold text-lg mb-3" style={{ color: '#2a2f1e' }}>{news.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>{news.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : (
            /* =================== SIGNUP FLOW =================== */
            <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
              <div className="max-w-2xl mx-auto">
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-12">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                        style={
                          signupStep >= step
                            ? { backgroundColor: '#6b7a3d', color: '#fff' }
                            : { backgroundColor: '#faf8f3', color: '#999', border: '1px solid #e0dcd3' }
                        }
                      >
                        {signupStep > step ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step
                        )}
                      </div>
                      {step < 5 && (
                        <div className="w-8 h-0.5" style={{ backgroundColor: signupStep > step ? '#6b7a3d' : '#e0dcd3' }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step 1: Select Membership Type */}
                {signupStep === 1 && (
                  <div className="fade-in">
                    <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Select Membership Type</h3>
                    <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Choose the membership that best fits your needs.</p>
                    <div className="grid gap-4">
                      {signupMembershipTypes.map((m) => (
                        <button
                          key={m.key}
                          onClick={() => { setSignupData({ ...signupData, membershipType: m.key }); setSignupStep(2); }}
                          className="flex items-center justify-between p-5 rounded-xl text-left transition-all hover:scale-[1.02]"
                          style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}
                        >
                          <div>
                            <span className="font-semibold text-base" style={{ color: '#2a2f1e' }}>{m.label}</span>
                          </div>
                          <span className="font-bold text-xl" style={{ color: '#4a5528' }}>${m.price}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setSignupStep(0)} className="mt-6 text-sm hover:underline mx-auto block" style={{ color: '#999' }}>
                      Cancel
                    </button>
                  </div>
                )}

                {/* Step 2: Your Information */}
                {signupStep === 2 && (
                  <div className="fade-in">
                    <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Your Information</h3>
                    <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Tell us a bit about yourself.</p>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Full Name</label>
                        <input
                          type="text"
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          maxLength={80}
                          placeholder="Enter your full name"
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                          style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Email</label>
                        <input
                          type="email"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          maxLength={100}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                          style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Password</label>
                        <input
                          type="password"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          maxLength={100}
                          placeholder="Min. 8 chars, uppercase, lowercase & number"
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                          style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                        />
                      </div>
                    </div>
                    {signupError && signupStep === 2 && (
                      <p className="text-sm mt-4 text-center" style={{ color: '#ef4444' }}>{signupError}</p>
                    )}
                    <div className="flex items-center gap-4 mt-8">
                      <button
                        onClick={() => setSignupStep(1)}
                        className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                        style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
                          if (!emailRegex.test(signupData.email)) {
                            setSignupError('Please enter a valid email address');
                            return;
                          }
                          const pwd = signupData.password;
                          if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
                            setSignupError('Password must be at least 8 characters with uppercase, lowercase, and a number');
                            return;
                          }
                          setSignupError('');
                          setSignupStep(3);
                        }}
                        disabled={!signupData.name.trim() || !signupData.email.trim() || signupData.password.length < 8}
                        className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                        style={
                          signupData.name.trim() && signupData.email.trim() && signupData.password.length >= 8
                            ? { backgroundColor: '#6b7a3d', color: '#fff' }
                            : { backgroundColor: '#e0dcd3', color: '#999', cursor: 'not-allowed' }
                        }
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Waiver */}
                {signupStep === 3 && (
                  <div className="fade-in">
                    <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Waiver & Acknowledgement</h3>
                    <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Please read both documents carefully. Scroll to the bottom of each to proceed.</p>

                    {/* Waiver */}
                    <p className="text-xs font-semibold mb-2" style={{ color: '#4a5528' }}>1. Waiver & Release of Liability</p>
                    <div
                      ref={waiverRef}
                      onScroll={handleWaiverScroll}
                      className="rounded-xl p-6 text-sm leading-relaxed overflow-y-auto"
                      style={{ backgroundColor: '#faf8f3', border: `1px solid ${waiverScrolled ? '#6b7a3d' : '#e0dcd3'}`, color: '#555', maxHeight: '280px', whiteSpace: 'pre-wrap' }}
                    >
                      {waiverText}
                    </div>
                    {!waiverScrolled && (
                      <p className="text-xs text-center mt-2" style={{ color: '#6b7a3d' }}>
                        ↓ Scroll to the bottom of the waiver
                      </p>
                    )}
                    {waiverScrolled && (
                      <p className="text-xs text-center mt-2 flex items-center justify-center gap-1" style={{ color: '#6b7a3d' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Waiver read
                      </p>
                    )}

                    {/* Acknowledgement Agreement */}
                    <p className="text-xs font-semibold mb-2 mt-6" style={{ color: '#4a5528' }}>2. Acknowledgement Agreement</p>
                    <div
                      ref={ackRef}
                      onScroll={handleAckScroll}
                      className="rounded-xl p-6 text-sm leading-relaxed overflow-y-auto"
                      style={{ backgroundColor: '#faf8f3', border: `1px solid ${ackScrolled ? '#6b7a3d' : '#e0dcd3'}`, color: '#555', maxHeight: '280px', whiteSpace: 'pre-wrap' }}
                    >
                      {acknowledgementText}
                    </div>
                    {!ackScrolled && (
                      <p className="text-xs text-center mt-2" style={{ color: '#6b7a3d' }}>
                        ↓ Scroll to the bottom of the acknowledgement
                      </p>
                    )}
                    {ackScrolled && (
                      <p className="text-xs text-center mt-2 flex items-center justify-center gap-1" style={{ color: '#6b7a3d' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Acknowledgement read
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-6">
                      <button
                        onClick={() => setSignupStep(2)}
                        className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                        style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
                      >
                        Back
                      </button>
                      <button
                        onClick={() => { setWaiverAccepted(true); setSignupStep(4); }}
                        disabled={!waiverScrolled || !ackScrolled}
                        className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                        style={
                          waiverScrolled && ackScrolled
                            ? { backgroundColor: '#6b7a3d', color: '#fff' }
                            : { backgroundColor: '#e0dcd3', color: '#999', cursor: 'not-allowed' }
                        }
                      >
                        I Agree
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: E-Transfer Payment */}
                {signupStep === 4 && (
                  <div className="fade-in">
                    <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Payment via E-Transfer</h3>
                    <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Send an Interac e-transfer to complete your registration.</p>

                    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
                      <div className="text-sm mb-2" style={{ color: '#6b7266' }}>Amount Due</div>
                      <div className="headline-font text-4xl font-bold mb-6" style={{ color: '#4a5528' }}>${getMembershipPrice()}</div>
                      <div className="text-xs mb-6 px-3 py-1.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(107, 122, 61, 0.12)', color: '#4a5528' }}>
                        {getMembershipLabel()}
                      </div>

                      <div className="rounded-lg p-5 mb-6" style={{ backgroundColor: '#edeae3', border: '1px solid #e0dcd3' }}>
                        <div className="text-sm mb-1" style={{ color: '#6b7266' }}>Send Interac e-transfer to:</div>
                        <div className="font-bold text-lg" style={{ color: '#2a2f1e' }}>monotennis.payment@gmail.com</div>
                      </div>

                    </div>

                    {signupError && (
                      <p className="text-sm mt-4 text-center" style={{ color: '#ef4444' }}>{signupError}</p>
                    )}
                    <div className="flex items-center gap-4 mt-8">
                      <button
                        onClick={() => setSignupStep(3)}
                        className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                        style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
                      >
                        Back
                      </button>
                      <button
                        onClick={completeSignup}
                        disabled={signupLoading}
                        className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
                      >
                        {signupLoading ? 'Creating Account...' : "I've Sent the E-Transfer"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Confirmation */}
                {signupStep === 5 && (
                  <div className="fade-in text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)' }}>
                      <svg className="w-8 h-8" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="headline-font text-2xl mb-3" style={{ color: '#2a2f1e' }}>
                      Welcome to Mono Tennis Club, {signupData.name.split(' ')[0]}!
                    </h3>
                    <p className="text-sm mb-10" style={{ color: '#6b7266' }}>
                      Your profile has been created. We&apos;ll confirm your payment and activate your membership shortly.
                    </p>

                    <div className="rounded-xl p-6 text-left" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
                      <h4 className="font-semibold text-sm mb-4" style={{ color: '#999' }}>Your Profile</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Name', value: signupData.name },
                          { label: 'Email', value: signupData.email },
                          { label: 'Membership', value: getMembershipLabel() },
                          { label: 'Waiver', value: 'Signed' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between py-2" style={i < 3 ? { borderBottom: '1px solid #e0dcd3' } : {}}>
                            <span className="text-sm" style={{ color: '#999' }}>{row.label}</span>
                            <span className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                      <a href="/dashboard" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                        Go to Dashboard
                      </a>
                      <a href="/" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#faf8f3', color: '#6b7a3d', border: '1px solid #e0dcd3' }}>
                        Back to Home
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* =================== RULES TAB =================== */}
      {activeTab === 'rules' && (
        <>
          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 fade-in">
                <span className="section-label">// Club Rules</span>
                <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                  Rules &amp; Regulations
                </h2>
                <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                  All members and guests must follow these rules to ensure a safe and enjoyable experience for everyone.
                </p>
              </div>

              <div className="space-y-4 fade-in">
                {clubRules.map((rule, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-xl" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }}>
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed pt-1" style={{ color: '#555' }}>{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 fade-in">
                <span className="section-label">// Constitution</span>
                <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                  Club Constitution
                </h2>
                <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                  The governing document of the Mono Tennis Club, outlining its structure, purpose, and operations.
                </p>
              </div>

              <div className="space-y-3 fade-in">
                {constitutionArticles.map((article, i) => (
                  <div key={i} className={`faq-item${activeConstitution === i ? ' active' : ''}`} style={{ borderColor: '#e0dcd3' }}>
                    <button className="faq-question" onClick={() => toggleConstitution(i)} style={{ color: '#2a2f1e' }}>
                      {article.title}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="faq-answer" style={{ maxHeight: activeConstitution === i ? '300px' : '0', color: '#555' }}>
                      <p>{article.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* =================== COACHING TAB =================== */}
      {activeTab === 'coaching' && (
        <>
          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 fade-in">
                <span className="section-label">// Head Professional</span>
                <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                  Mark Taylor
                </h2>
                <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                  Tennis Canada certified professional coaching players of all ages and skill levels.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 fade-in">
                <div className="rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                    <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-xl mb-4" style={{ color: '#2a2f1e' }}>Certifications</h3>
                  <ul className="space-y-3 text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                    {['Tennis Canada — Tennis Instructor (2007)', 'Tennis Canada — Club Professional 1 (2007)', 'Tennis Canada — Coach 2 (2011)', 'Tennis Professionals Association (TPA) member'].map((cert, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                    <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-xl mb-4" style={{ color: '#2a2f1e' }}>Playing & Coaching Background</h3>
                  <ul className="space-y-3 text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                    {['Competitive player in NCTA, OTA, FTQ tournaments and Circuit Canada Series', 'Competed in ITF Futures events', '2017 exhibition match with Denis Shapovalov', 'Trained with Bob Brett (coach of Becker, Ivanisevic, Cilic) in San Remo, Italy', 'Coaches juniors through adults, beginner to elite level'].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
            <div className="max-w-4xl mx-auto fade-in">
              <div className="rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                    <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2" style={{ color: '#2a2f1e' }}>Adrian Shelley</h3>
                    <span className="text-xs px-3 py-1 rounded-full inline-block mb-3" style={{ backgroundColor: 'rgba(107, 122, 61, 0.12)', color: '#4a5528' }}>Assistant Coach</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                      Adrian assists with club programs, clinics, and round robins. Available for private and group lessons during the season.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 fade-in">
                <span className="section-label">// Programs</span>
                <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                  Summer Tennis Camp
                </h2>
              </div>

              <div className="fade-in rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#999' }}>Dates</span>
                    <p className="font-semibold mt-1" style={{ color: '#2a2f1e' }}>July 28 – Aug 1, 2026</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#999' }}>Daily Schedule</span>
                    <p className="font-semibold mt-1" style={{ color: '#2a2f1e' }}>8:30 AM – 3:30 PM</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7266' }}>
                  Make memories, build skills, gain confidence, and have fun! Our summer camp is perfect for young players looking to improve their game in a supportive, energetic environment.
                </p>
                <div className="rounded-lg p-5" style={{ backgroundColor: 'rgba(107, 122, 61, 0.08)', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
                  <p className="text-sm font-medium mb-1" style={{ color: '#4a5528' }}>Register for Coaching & Camps</p>
                  <p className="text-sm" style={{ color: '#6b7266' }}>
                    To register for classes and summer camps,{' '}
                    <a href="/dashboard/events" className="font-semibold hover:underline" style={{ color: '#6b7a3d' }}>
                      log in to your member dashboard
                    </a>
                    {' '}and visit the Lessons tab. For questions,{' '}
                    <a href="/dashboard/messages" className="font-semibold hover:underline" style={{ color: '#6b7a3d' }}>
                      message Coach Mark
                    </a>
                    {' '}through the dashboard
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* =================== FAQ TAB =================== */}
      {activeTab === 'faq' && (
        <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              <div className="fade-in-left">
                <h3 className="font-semibold text-lg mb-6" style={{ color: '#2a2f1e' }}>Frequently Asked Questions</h3>

                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search FAQ..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                    style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                  />
                </div>

                {(() => {
                  const filtered = faqItems.filter((item) => {
                    if (!faqSearch.trim()) return true;
                    const term = faqSearch.toLowerCase();
                    return item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term);
                  });
                  if (filtered.length === 0) {
                    return (
                      <p className="text-center py-8" style={{ color: '#999' }}>
                        No results found for &ldquo;{faqSearch}&rdquo;
                      </p>
                    );
                  }
                  return filtered.map((item) => {
                    const originalIndex = faqItems.indexOf(item);
                    return (
                      <div key={originalIndex} className={`faq-item${activeFaq === originalIndex ? ' active' : ''}`} style={{ borderColor: '#e0dcd3' }}>
                        <button className="faq-question" onClick={() => toggleFaq(originalIndex)} style={{ color: '#2a2f1e' }}>
                          {item.question}
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <div className="faq-answer" style={{ maxHeight: activeFaq === originalIndex ? '200px' : '0', color: '#555' }}>
                          <p>{item.answer}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="fade-in-right">
                <h3 className="font-semibold text-lg mb-6" style={{ color: '#2a2f1e' }}>Find Us</h3>
                <div className="rounded-2xl overflow-hidden shadow-lg h-[400px] lg:h-full lg:min-h-[450px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2871.8904!2d-80.0731!3d43.9981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882a7a2e7e8e8e8d%3A0x8e8e8e8e8e8e8e8e!2s754883%20Mono%20Centre%20Rd%2C%20Mono%2C%20ON%20L9W%206S3!5e0!3m2!1sen!2sca!4v1234567890"
                    width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade" title="Mono Tennis Club Location"
                  />
                </div>
                <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(107, 122, 61, 0.1)' }}>
                  <p className="text-sm" style={{ color: '#555' }}>
                    <strong style={{ color: '#2a2f1e' }}>754883 Mono Centre Road</strong>
                    <br />Mono, Ontario L9W 6S3
                    <br />
                    <a href="mailto:info@monotennisclub.ca" className="hover:underline" style={{ color: '#6b7a3d' }}>
                      info@monotennisclub.ca
                    </a>
                  </p>
                  <p className="text-sm mt-3 flex items-center gap-2" style={{ color: '#6b7a3d' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Just <strong>~1 hour</strong> north of Toronto — an easy drive up Highway 10</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================== PRIVACY TAB =================== */}
      {activeTab === 'privacy' && (
        <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 fade-in">
              <span className="section-label">// Privacy Policy</span>
              <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                Your Privacy Matters
              </h2>
              <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                Mono Tennis Club is committed to protecting your personal information in accordance with PIPEDA.
              </p>
              <p className="text-xs mt-3" style={{ color: '#999' }}>Last updated: February 2026</p>
            </div>

            <div className="space-y-3 fade-in">
              {privacySections.map((section, i) => (
                <div key={i} className={`faq-item${activePrivacy === i ? ' active' : ''}`} style={{ borderColor: '#e0dcd3' }}>
                  <button className="faq-question" onClick={() => setActivePrivacy(activePrivacy === i ? null : i)} style={{ color: '#2a2f1e' }}>
                    {section.title}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="faq-answer" style={{ maxHeight: activePrivacy === i ? '300px' : '0', color: '#555' }}>
                    <p>{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================== TERMS TAB =================== */}
      {activeTab === 'terms' && (
        <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 fade-in">
              <span className="section-label">// Terms of Service</span>
              <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                Terms &amp; Conditions
              </h2>
              <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                Please review the following terms governing the use of Mono Tennis Club services and facilities.
              </p>
              <p className="text-xs mt-3" style={{ color: '#999' }}>Last updated: February 2026</p>
            </div>

            <div className="space-y-3 fade-in">
              {termsSections.map((section, i) => (
                <div key={i} className={`faq-item${activeTerms === i ? ' active' : ''}`} style={{ borderColor: '#e0dcd3' }}>
                  <button className="faq-question" onClick={() => setActiveTerms(activeTerms === i ? null : i)} style={{ color: '#2a2f1e' }}>
                    {section.title}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="faq-answer" style={{ maxHeight: activeTerms === i ? '300px' : '0', color: '#555' }}>
                    <p>{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to Home CTA */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 fade-in rounded-2xl p-10 lg:p-14" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.15), rgba(212, 225, 87, 0.08))', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
            <div>
              <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl text-center md:text-left" style={{ color: '#2a2f1e' }}>
                Ready to Play?
              </h2>
              <p className="mt-3 text-sm text-center md:text-left" style={{ color: '#6b7266' }}>
                Join Mono Tennis Club and get access to courts, events, and more.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/info?tab=membership" className="px-8 py-3 rounded-full text-sm font-medium transition-all hover:opacity-90 hover:shadow-lg" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                Become a Member
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 lg:px-16 text-center" style={{ backgroundColor: '#1a1f12', borderTop: '1px solid rgba(232, 228, 217, 0.08)' }}>
        <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.4)' }}>
          &copy; Mono Tennis Club 2026
        </p>
      </footer>
    </div>
  );
}

export default function InfoPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: '#f5f2eb', minHeight: '100vh' }} />}>
      <InfoPageContent />
    </Suspense>
  );
}
