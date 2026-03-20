'use client';

import DashboardHeader from '../components/DashboardHeader';
import { APP_COPY } from '../../lib/site';

const coaches = [
  {
    name: 'Mark Taylor',
    title: 'Head Professional',
    initials: 'MT',
    photo: '/coach-mark.jpeg',
    email: 'Taylor.Mark.Tennis@gmail.com',
    bio: 'Mark is a competitive player in NCTA, OTA, FTQ tournaments and the Circuit Canada Series, and has competed in ITF Futures events. In 2017 he played an exhibition match with Denis Shapovalov. He trained with Bob Brett — coach of Becker, Ivanisevic, and Cilic — in San Remo, Italy. Mark coaches juniors through adults, from beginner to elite level.',
    certifications: [
      'Tennis Canada — Tennis Instructor (2007)',
      'Tennis Canada — Club Professional 1 (2007)',
      'Tennis Canada — Coach 2 (2011)',
      'Tennis Professionals Association (TPA) member',
    ],
  },
  {
    name: 'Adrian Shelley',
    title: 'Tennis Professional',
    initials: 'AS',
    photo: '/coach-adrian.jpeg',
    email: 'Shelley.Adrian.Tennis@gmail.com',
    bio: 'Adrian brings over 40 years of experience as a player, instructor, and coach. Provincially ranked junior who reached the junior nationals, then played Varsity Tennis at Brock University for 5 years and served as Assistant Coach. Tennis Coach at North Park S.S. for over 23 years, advancing his team to OFSAA 5 times. He has taught at Olympia Sports Camp, Deerhurst Resort, St. Catharines Tennis Club, and White Oaks Tennis Club. His focus is helping players of all abilities improve their skills, fitness, and enjoyment of the game.',
    certifications: [],
  },
];

const juniorPrograms = [
  { name: 'Munchkin Stars', ages: '3–4', duration: '30 min', schedule: 'Thu 4:30–5 PM', memberPrice: '$127.25', nonMemberPrice: '$172.25', description: 'Fun introduction to tennis for our youngest players. Games and activities build coordination and court skills. Parents may assist.' },
  { name: 'Red Ball Tennis', ages: '5–6', duration: '1 hr', schedule: 'Thu 5–6 PM', memberPrice: '$254.25', nonMemberPrice: '$299.25', description: 'Players build familiarity with rules, lines, and proper grip. Focus on fun — lighter balls give younger players more control.' },
  { name: 'Orange Ball Tennis', ages: '6–8', duration: '1 hr', schedule: 'Tue 4–5 PM', memberPrice: '$254.25', nonMemberPrice: '$299.25', description: 'Players graduate to hitting over the main net (lowered). Orange dot balls with more bounce. Fast-paced and confidence-building.' },
  { name: 'Green Ball Tennis', ages: '9+', duration: '1 hr', schedule: 'Tue 5–6 PM', memberPrice: '$254.25', nonMemberPrice: '$299.25', description: 'Full court with green dot balls. Point play, scorekeeping, and continued instruction on technique, grip, and stance.' },
  { name: 'Teen Tennis', ages: '12+', duration: '1 hr', schedule: 'Mon 5–6 · Tue 6–7 · Fri 4:30–5:30', memberPrice: '$254.25', nonMemberPrice: '$299.25', description: 'All skill levels welcome. Learn or build tennis skills and gain a passion for the game.' },
];

const adultPrograms = [
  { name: 'Adult Tennis 101/102', duration: '1 hr', schedule: 'Tue 8:30–9:30 PM', memberPrice: '$223.75', nonMemberPrice: '$313.75', description: 'Combined 101/102 group — all skill levels. Instruction based on your ability. Hit lots of balls and bring your game to the next level.' },
  { name: 'Live Ball', duration: '1.5 hrs', schedule: 'Mon 9:30–11 AM · Mon 6–7:30 · Tue 7–8:30 · Fri 5:30–7', memberPrice: '$284.75', nonMemberPrice: '$374.75', description: 'Fast-paced doubles and point play. Great for competitive match practice in a social setting.' },
];

export default function LessonsPage() {
  return (
    <div className="min-h-screen dashboard-gradient-bg">
      <DashboardHeader title={APP_COPY.lessons} />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-slideUp">

        {/* Intro */}
        <div className="glass-card rounded-2xl border p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(107, 122, 61, 0.1)' }}>
              <svg className="w-5 h-5" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: '#2a2f1e' }}>Spring 2026 Programs</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                9-week programs starting the week of May 11 for all ages and skill levels. Contact a coach below or email Suzanne Taylor to register.
              </p>
            </div>
          </div>
        </div>

        {/* Coach Cards */}
        {coaches.map((coach) => (
          <div key={coach.name} className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              {coach.photo ? (
                <img src={coach.photo} alt={coach.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ background: '#6b7a3d', color: '#fff' }}>
                  {coach.initials}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg" style={{ color: '#2a2f1e' }}>{coach.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                  {coach.title}
                </span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#6b7266' }}>
              {coach.bio}
            </p>

            {/* Certifications */}
            {coach.certifications.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-medium mb-2" style={{ color: '#999' }}>Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {coach.certifications.map((cert) => (
                    <span key={cert} className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#f5f2eb', color: '#4a5528' }}>
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {coach.email && (
              <a
                href={`mailto:${coach.email}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 btn-press"
                style={{ background: '#6b7a3d', color: '#fff' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact {coach.name.split(' ')[0]}
              </a>
            )}
          </div>
        ))}

        {/* Junior Programs */}
        <div className="glass-card rounded-2xl border p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold text-lg mb-5 flex items-center gap-2" style={{ color: '#2a2f1e' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(107, 122, 61, 0.1)' }}>
              <svg className="w-4 h-4" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            Junior Programs
          </h3>
          <div className="space-y-4">
            {juniorPrograms.map((prog) => (
              <div key={prog.name} className="rounded-xl p-4" style={{ background: '#faf8f3', border: '1px solid #e8e4d9' }}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{prog.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#4a5528' }}>Ages {prog.ages}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#4a5528' }}>{prog.duration}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold" style={{ color: '#6b7a3d' }}>{prog.memberPrice}</span>
                    <span className="text-[10px] ml-1" style={{ color: '#999' }}>member</span>
                  </div>
                </div>
                <p className="text-xs mb-1" style={{ color: '#6b7a3d' }}>{prog.schedule}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#6b7266' }}>{prog.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Adult Programs */}
        <div className="glass-card rounded-2xl border p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold text-lg mb-5 flex items-center gap-2" style={{ color: '#2a2f1e' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(107, 122, 61, 0.1)' }}>
              <svg className="w-4 h-4" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Adult Programs
          </h3>
          <div className="space-y-4">
            {adultPrograms.map((prog) => (
              <div key={prog.name} className="rounded-xl p-4" style={{ background: '#faf8f3', border: '1px solid #e8e4d9' }}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{prog.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#4a5528' }}>{prog.duration}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold" style={{ color: '#6b7a3d' }}>{prog.memberPrice}</span>
                    <span className="text-[10px] ml-1" style={{ color: '#999' }}>member</span>
                  </div>
                </div>
                <p className="text-xs mb-1" style={{ color: '#6b7a3d' }}>{prog.schedule}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#6b7266' }}>{prog.description}</p>
              </div>
            ))}
          </div>

          {/* Summer Camp */}
          <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(212, 225, 87, 0.08)', border: '1px solid rgba(212, 225, 87, 0.2)' }}>
            <p className="font-semibold text-sm mb-1" style={{ color: '#2a2f1e' }}>Summer Tennis Camp</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(212, 225, 87, 0.2)', color: '#4a5528' }}>Ages 5+ &middot; Dates coming soon</span>
            <p className="text-xs leading-relaxed mt-2" style={{ color: '#6b7266' }}>Camp is about fun! Running, hitting, building friendships and memories. Games and activities help build tennis skills and on-court confidence.</p>
          </div>
        </div>

        {/* Spring/Summer Schedule */}
        <div className="glass-card rounded-2xl border p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold text-lg mb-5 flex items-center gap-2" style={{ color: '#2a2f1e' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(107, 122, 61, 0.1)' }}>
              <svg className="w-4 h-4" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Weekly Schedule
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { day: 'Monday', start: 'May 11', classes: [{ name: 'Live Ball', time: '9:30 – 11:00 AM' }, { name: 'Team Practice', time: '11:00 AM – 1:00 PM' }, { name: 'Teen Tennis', time: '5:00 – 6:00 PM' }, { name: 'Live Ball', time: '6:00 – 7:30 PM' }] },
              { day: 'Tuesday', start: 'May 12', classes: [{ name: 'Orange Ball', time: '4:00 – 5:00 PM' }, { name: 'Green Ball', time: '5:00 – 6:00 PM' }, { name: 'Teen Tennis', time: '6:00 – 7:00 PM' }, { name: 'Live Ball', time: '7:00 – 8:30 PM' }, { name: 'Adult 101/102', time: '8:30 – 9:30 PM' }] },
              { day: 'Thursday', start: 'May 14', classes: [{ name: 'Munchkin Stars', time: '4:30 – 5:00 PM' }, { name: 'Red Ball', time: '5:00 – 6:00 PM' }] },
              { day: 'Friday', start: 'May 15', classes: [{ name: 'Teen Tennis', time: '4:30 – 5:30 PM' }, { name: 'Live Ball', time: '5:30 – 7:00 PM' }, { name: 'House League', time: '7:00 – 9:00 PM' }] },
            ].map((day) => (
              <div key={day.day} className="rounded-xl p-4" style={{ background: '#faf8f3', border: '1px solid #e8e4d9' }}>
                <p className="font-semibold text-sm mb-1 flex items-center gap-2" style={{ color: '#2a2f1e' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6b7a3d' }} />
                  {day.day}
                </p>
                <p className="text-[10px] mb-3" style={{ color: '#999' }}>Starts {day.start}</p>
                <div className="space-y-1.5">
                  {day.classes.map((cls, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: '#2a2f1e' }}>{cls.name}</span>
                      <span style={{ color: '#6b7266' }}>{cls.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Up & Contact */}
        <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.12), rgba(212, 225, 87, 0.06))', borderColor: 'rgba(107, 122, 61, 0.2)' }}>
          <h3 className="font-semibold text-lg mb-3" style={{ color: '#2a2f1e' }}>Sign Up & Contact</h3>
          <div className="space-y-2">
            <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              To register for any program, email{' '}
              <a href="mailto:Taylor.suzanne.tennis@gmail.com" className="font-semibold hover:underline" style={{ color: '#6b7a3d' }}>
                Suzanne Taylor
              </a>
              {', '}Program Coordinator, at{' '}
              <a href="mailto:Taylor.suzanne.tennis@gmail.com" className="font-medium hover:underline" style={{ color: '#6b7a3d' }}>
                Taylor.suzanne.tennis@gmail.com
              </a>
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              Private lessons with Mark:{' '}
              <a href="mailto:Taylor.mark.tennis@gmail.com" className="font-medium hover:underline" style={{ color: '#6b7a3d' }}>
                Taylor.mark.tennis@gmail.com
              </a>
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              Private lessons with Adrian:{' '}
              <a href="mailto:Shelley.Adrian.Tennis@gmail.com" className="font-medium hover:underline" style={{ color: '#6b7a3d' }}>
                Shelley.Adrian.Tennis@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
