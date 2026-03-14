'use client';

import { useState } from 'react';

/* ─── Coach Card — premium hero-style with large photo ─── */
function CoachCard({ name, title, photo, bio, highlights, email }: {
  name: string;
  title: string;
  photo: string;
  bio: string;
  highlights: string[];
  email: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const shortBio = bio.length > 160 ? bio.slice(0, 160).replace(/\s+\S*$/, '') + '...' : bio;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#faf8f3', border: '1px solid #e0dcd3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Large photo header */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover object-top"
          style={{ filter: 'brightness(0.95)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(42,47,30,0.85) 0%, rgba(42,47,30,0.3) 50%, transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-bold text-xl leading-tight text-white">{name}</h3>
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#d4e157' }}>{title}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-sm leading-relaxed mb-2" style={{ color: '#6b7266' }}>
          {expanded ? bio : shortBio}
        </p>
        {bio.length > 160 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold mb-4 hover:underline"
            style={{ color: '#6b7a3d', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? 'Show less' : 'Read full bio'}
          </button>
        )}

        <div className="space-y-1.5 mb-5 pt-3" style={{ borderTop: '1px solid #ebe7df' }}>
          {highlights.map((h) => (
            <div key={h} className="flex items-start gap-2 text-xs" style={{ color: '#5a6350' }}>
              <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {h}
            </div>
          ))}
        </div>

        <a
          href={`mailto:${email}`}
          className="flex items-center justify-center gap-2 text-sm font-semibold w-full py-2.5 rounded-xl transition-all hover:shadow-md"
          style={{ background: '#6b7a3d', color: '#fff', textDecoration: 'none' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Book a private lesson
        </a>
      </div>
    </div>
  );
}

/* ─── Program Row — inline expandable details ─── */
function ProgramRow({ prog, index, isLast }: {
  prog: { name: string; ages?: string; duration: string; schedule: string; memberPrice: string; nonMemberPrice: string; description: string };
  index: number;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const bg = index % 2 === 0 ? '#faf8f3' : '#f7f4ed';

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid #ebe7df' }}>
      {/* Row — the whole row is clickable */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 md:px-6 flex flex-col md:grid md:grid-cols-12 md:gap-0 md:items-center gap-0.5 text-left group"
        style={{ background: bg, border: 'none', cursor: 'pointer' }}
      >
        {/* Program name + expand icon together on the left */}
        <div className="md:col-span-3 flex items-center gap-1.5">
          <svg className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`} style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-semibold text-sm group-hover:underline" style={{ color: '#2a2f1e', textDecorationColor: '#6b7a3d' }}>{prog.name}</span>
          <span className="md:hidden text-xs ml-auto" style={{ color: '#6b7a3d', fontWeight: 700 }}>{prog.memberPrice}</span>
        </div>
        <div className="hidden md:block md:col-span-2 text-xs" style={{ color: '#6b7266' }}>
          {prog.ages ? `Ages ${prog.ages}` : 'All levels'} · {prog.duration}
        </div>
        <div className="md:col-span-3 text-xs hidden md:block" style={{ color: '#6b7266' }}>{prog.schedule}</div>
        <div className="hidden md:block md:col-span-2 text-sm font-bold text-right" style={{ color: '#6b7a3d' }}>{prog.memberPrice}</div>
        <div className="hidden md:block md:col-span-2 text-xs text-right" style={{ color: '#999' }}>{prog.nonMemberPrice}</div>
        {/* Mobile sub-line */}
        <div className="md:hidden text-xs mt-0.5 pl-5" style={{ color: '#999' }}>
          {prog.ages ? `Ages ${prog.ages}` : 'All levels'} · {prog.duration} · {prog.schedule}
        </div>
      </button>
      {open && (
        <div className="px-5 md:px-6 pb-4 pt-1 pl-10 md:pl-11" style={{ background: bg }}>
          <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>{prog.description}</p>
          <div className="md:hidden flex items-center gap-3 mt-2 text-xs" style={{ color: '#999' }}>
            <span>Non-member: {prog.nonMemberPrice}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachingTab() {
  const juniorPrograms = [
    {
      name: 'Munchkin Stars',
      ages: '3–4',
      duration: '30 min',
      schedule: 'Thu 4:30–5:00 PM',
      memberPrice: '$127.25',
      nonMemberPrice: '$172.25',
      description: 'A fun introduction to tennis for our youngest players. Games and activities build eye-hand coordination and court skills. Lighter balls help players hit at their own height and build confidence. Parents may assist their Munchkin.',
    },
    {
      name: 'Red Ball Tennis',
      ages: '5–6',
      duration: '1 hour',
      schedule: 'Thu 5:00–6:00 PM',
      memberPrice: '$254.25',
      nonMemberPrice: '$299.25',
      description: 'Players hit lots of balls while building familiarity with tennis rules, lines, and proper grip. The focus remains on fun — players don\'t even realize how much they\'re learning! Lighter balls give younger players more control.',
    },
    {
      name: 'Orange Ball Tennis',
      ages: '6–8',
      duration: '1 hour',
      schedule: 'Tue 4:00–5:00 PM',
      memberPrice: '$254.25',
      nonMemberPrice: '$299.25',
      description: 'Players graduate to hitting over the main net (lowered). Orange dot balls have more bounce but are still lighter and easier on young arms. A fast-paced program where players hit lots of balls while gaining confidence.',
    },
    {
      name: 'Green Ball Tennis',
      ages: '9+',
      duration: '1 hour',
      schedule: 'Tue 5:00–6:00 PM',
      memberPrice: '$254.25',
      nonMemberPrice: '$299.25',
      description: 'Players are on the full court using green dot tennis balls. This group begins point play and keeps track of their own scores. Instruction continues as players work on technique, grip, and stance.',
    },
    {
      name: 'Teen Tennis',
      ages: '12+',
      duration: '1 hour',
      schedule: 'Mon · Tue · Fri',
      memberPrice: '$254.25',
      nonMemberPrice: '$299.25',
      description: 'It\'s never too late to learn a new sport. All skill levels welcome. Multiple sessions per week: Monday 5–6 PM, Tuesday 6–7 PM, Friday 4:30–5:30 PM. A great opportunity for any teen who wants to learn or build their tennis skills.',
    },
  ];

  const adultPrograms = [
    {
      name: 'Adult Tennis 101/102',
      duration: '1 hour',
      schedule: 'Tue 8:30–9:30 PM',
      memberPrice: '$223.75',
      nonMemberPrice: '$313.75',
      description: 'A combined 101/102 group — all skill levels welcome. You\'ll receive instruction based on your ability. Burn off some steam while hitting lots of tennis balls and bringing your game to the next level.',
    },
    {
      name: 'Live Ball',
      duration: '1.5 hours',
      schedule: 'Mon · Tue · Fri',
      memberPrice: '$284.75',
      nonMemberPrice: '$374.75',
      description: 'A fun, fast-paced group where players play doubles and point play. Multiple sessions: Monday 9:30–11 AM & 6–7:30 PM, Tuesday 7–8:30 PM, Friday 5:30–7 PM. Great for competitive match practice in a social setting.',
    },
  ];

  return (
    <>
      {/* ─── 1. Coaches — premium hero cards ─── */}
      <section className="py-10 lg:py-14 px-6 lg:px-16 animate-fadeIn" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-4xl mx-auto">
          {/* Dashboard CTA — slim inline */}
          <a
            href="/dashboard/lessons"
            className="block rounded-xl px-4 py-3 text-center text-xs font-medium mb-10 transition-all hover:shadow-sm"
            style={{ background: 'rgba(107, 122, 61, 0.07)', border: '1px solid rgba(107, 122, 61, 0.15)', color: '#6b7a3d', textDecoration: 'none' }}
          >
            Already a member? View lessons and programs in your Dashboard &rarr;
          </a>

          <div className="text-center mb-8">
            <span className="section-label">// Meet the Pros</span>
            <h2 className="headline-font text-2xl md:text-3xl leading-tight mt-3 mb-2" style={{ color: '#2a2f1e' }}>
              Your Coaching Team
            </h2>
            <p className="max-w-md mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              Two experienced professionals dedicated to helping players of every age and level.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <CoachCard
              name="Mark Taylor"
              title="Head Professional"
              photo="/coach-mark.jpeg"
              bio="Tennis Canada certified professional with over 15 years of coaching experience. Competitive player in NCTA, OTA, FTQ tournaments and the Circuit Canada Series, and competed in ITF Futures events. Trained with legendary coach Bob Brett (who coached Boris Becker, Goran Ivanisevic, and Marin Cilic) in San Remo, Italy. Played a 2017 exhibition match with Denis Shapovalov. Mark coaches players of all ages and abilities, from beginners picking up a racquet for the first time to competitive tournament players."
              highlights={[
                'Tennis Canada — Club Professional 1 (2007)',
                'Tennis Canada — Coach 2 (2011)',
                'Tennis Professionals Association member',
                'ITF Futures & Circuit Canada competitor',
              ]}
              email="Taylor.mark.tennis@gmail.com"
            />
            <CoachCard
              name="Adrian Shelley"
              title="Tennis Professional"
              photo="/coach-adrian.jpeg"
              bio="Over 40 years of experience as a player, instructor, and coach. Provincially ranked junior who reached the junior nationals, then played Varsity Tennis at Brock University for 5 years and served as Assistant Coach. Tennis Coach at North Park Secondary School for 23+ years, advancing his team to OFSAA 5 times. Adrian has taught at Olympia Sports Camp, Deerhurst Resort, St. Catharines Tennis Club, and White Oaks Tennis Club. He enjoys helping players of all abilities improve their skills, fitness, and most importantly have fun."
              highlights={[
                'Brock University — 5 years Varsity Tennis + Assistant Coach',
                'North Park S.S. — 23+ years, 5 OFSAA appearances',
                'Taught at Deerhurst Resort, Olympia Sports Camp & more',
                'Coaches all ages and abilities',
              ]}
              email="Shelley.Adrian.Tennis@gmail.com"
            />
          </div>
        </div>
      </section>

      {/* ─── 2. Programs & Pricing — unified section ─── */}
      <section className="py-10 lg:py-14 px-6 lg:px-16 animate-fadeIn" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="section-label">// Spring 2026</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-3 mb-2" style={{ color: '#2a2f1e' }}>
              Programs &amp; Pricing
            </h2>
            <p className="text-sm" style={{ color: '#6b7266' }}>
              9-week session starting May 11 · Click any program for details · All prices include HST
            </p>
          </div>

          {/* Combined pricing table with inline expand */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0dcd3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {/* Table header — desktop only */}
            <div className="hidden md:grid grid-cols-12 gap-0 px-6 py-3" style={{ background: '#2a2f1e' }}>
              <div className="col-span-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#d4e157' }}>Program</div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#d4e157' }}>Ages</div>
              <div className="col-span-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#d4e157' }}>Schedule</div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: '#d4e157' }}>Member</div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: '#8a8e7a' }}>Non-member</div>
            </div>

            {/* Mobile header */}
            <div className="md:hidden px-5 py-2.5" style={{ background: '#2a2f1e' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#d4e157' }}>Tap a program for details</span>
            </div>

            {/* Junior header */}
            <div className="px-5 md:px-6 py-2" style={{ background: 'rgba(107, 122, 61, 0.1)', borderBottom: '1px solid #e0dcd3' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6b7a3d' }}>Junior Programs</span>
            </div>

            {juniorPrograms.map((prog, i) => (
              <ProgramRow key={prog.name} prog={prog} index={i} isLast={i === juniorPrograms.length - 1} />
            ))}

            {/* Adult header */}
            <div className="px-5 md:px-6 py-2" style={{ background: 'rgba(107, 122, 61, 0.1)', borderTop: '1px solid #e0dcd3', borderBottom: '1px solid #e0dcd3' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6b7a3d' }}>Adult Programs</span>
            </div>

            {adultPrograms.map((prog, i) => (
              <ProgramRow key={prog.name} prog={prog} index={i} isLast={i === adultPrograms.length - 1} />
            ))}
          </div>

          {/* Private Lessons callout — right below the table */}
          <div className="mt-5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4" style={{ background: 'rgba(42, 47, 30, 0.04)', border: '1px solid #e0dcd3' }}>
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1" style={{ color: '#2a2f1e' }}>Private &amp; Semi-Private Lessons</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6b7266' }}>
                One-on-one or small group coaching with Mark or Adrian. All ages and abilities. By appointment.
              </p>
            </div>
            <div className="flex gap-3">
              <a href="mailto:Taylor.mark.tennis@gmail.com" className="text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap" style={{ background: '#6b7a3d', color: '#fff', textDecoration: 'none' }}>
                Email Mark
              </a>
              <a href="mailto:Shelley.Adrian.Tennis@gmail.com" className="text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap" style={{ background: '#faf8f3', color: '#4a5528', textDecoration: 'none', border: '1px solid #e0dcd3' }}>
                Email Adrian
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Weekly Schedule — compact grid ─── */}
      <section className="py-10 lg:py-14 px-6 lg:px-16 animate-fadeIn" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="section-label">// Weekly Schedule</span>
            <h2 className="headline-font text-xl md:text-2xl leading-tight mt-3 mb-2" style={{ color: '#2a2f1e' }}>
              When We Play
            </h2>
            <p className="text-xs" style={{ color: '#6b7266' }}>9 weeks · May 11 – July 11, 2026</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { day: 'Monday', classes: [{ name: 'Live Ball', time: '9:30–11 AM' }, { name: 'Team Practice', time: '11 AM–1 PM' }, { name: 'Teen Tennis', time: '5–6 PM' }, { name: 'Live Ball', time: '6–7:30 PM' }] },
              { day: 'Tuesday', classes: [{ name: 'Orange Ball', time: '4–5 PM' }, { name: 'Green Ball', time: '5–6 PM' }, { name: 'Teen Tennis', time: '6–7 PM' }, { name: 'Live Ball', time: '7–8:30 PM' }, { name: 'Adult 101/102', time: '8:30–9:30 PM' }] },
              { day: 'Thursday', classes: [{ name: 'Munchkin Stars', time: '4:30–5 PM' }, { name: 'Red Ball', time: '5–6 PM' }] },
              { day: 'Friday', classes: [{ name: 'Teen Tennis', time: '4:30–5:30 PM' }, { name: 'Live Ball', time: '5:30–7 PM' }, { name: 'House League', time: '7–9 PM' }] },
            ].map((day) => (
              <div key={day.day} className="rounded-xl p-4" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <h3 className="font-bold text-sm mb-3 pb-2 flex items-center gap-2" style={{ color: '#2a2f1e', borderBottom: '1px solid #ebe7df' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6b7a3d' }} />
                  {day.day}
                </h3>
                <div className="space-y-2">
                  {day.classes.map((cls, i) => (
                    <div key={i}>
                      <div className="text-xs font-medium" style={{ color: '#2a2f1e' }}>{cls.name}</div>
                      <div className="text-[0.65rem]" style={{ color: '#999' }}>{cls.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Summer Camp + Registration CTA ─── */}
      <section className="py-10 lg:py-14 px-6 lg:px-16 animate-fadeIn" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5">
            {/* Summer Camp */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
              <div className="px-5 py-3" style={{ background: 'rgba(212, 225, 87, 0.15)', borderBottom: '1px solid #e0dcd3' }}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm" style={{ color: '#2a2f1e' }}>Summer Tennis Camp</h3>
                  <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(212, 225, 87, 0.3)', color: '#4a5528' }}>Coming soon</span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b7266' }}>
                  Camp is about fun! Campers will be running, hitting, building friendships and making memories to last a lifetime. Games and activities help build tennis skills and on-court confidence.
                </p>
                <p className="text-xs" style={{ color: '#999' }}>Ages 5+ · Dates to be announced</p>
              </div>
            </div>

            {/* Registration CTA */}
            <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: '#2a2f1e' }}>
              <div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#e8e4d9' }}>Ready to Register?</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                  Contact Suzanne Taylor, Program Coordinator, to sign up for any program or ask questions.
                </p>
              </div>
              <div className="space-y-3">
                <a
                  href="mailto:Taylor.suzanne.tennis@gmail.com"
                  className="flex items-center justify-center gap-2 text-sm font-semibold w-full py-2.5 rounded-xl transition-all hover:shadow-md"
                  style={{ background: '#d4e157', color: '#2a2f1e', textDecoration: 'none' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Suzanne to Register
                </a>
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: 'rgba(232, 228, 217, 0.08)', border: '1px solid rgba(232, 228, 217, 0.12)' }}>
                  <span className="text-xs select-all font-mono tracking-wide" style={{ color: 'rgba(232, 228, 217, 0.7)', userSelect: 'all' }}>
                    Taylor.suzanne.tennis@gmail.com
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
