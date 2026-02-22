'use client';

import Link from 'next/link';
import DashboardHeader from '../components/DashboardHeader';

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
    title: 'Coach',
    initials: 'AS',
    photo: '/coach-adrian.jpeg',
    email: null,
    bio: 'Adrian brings over 40 years of experience as a player, instructor, and coach. He was a provincially ranked junior who competed nationally, and played varsity tennis at Brock University for 5 years before serving as Assistant Coach. He coached high school tennis at North Park S.S. for over 23 years, advancing his team to OFSAA 5 times. Adrian has taught at Olympia Sports Camp, Deerhurst Resort, St. Catharines Tennis Club, and White Oaks Tennis Club. His focus is helping players of all abilities improve their skills, fitness, and enjoyment of the game.',
    certifications: [],
  },
];

export default function LessonsPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Lessons" />

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
              <h3 className="font-semibold text-sm mb-1" style={{ color: '#2a2f1e' }}>Improve Your Game</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                Our coaching staff offers private lessons, group clinics, and seasonal camps for players of all ages and skill levels. Contact a coach below to get started.
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

        {/* Ready to Enroll CTA */}
        <div className="rounded-2xl border p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.12), rgba(212, 225, 87, 0.06))', borderColor: 'rgba(107, 122, 61, 0.2)' }}>
          <h3 className="font-semibold text-lg mb-2" style={{ color: '#2a2f1e' }}>Ready to Enroll?</h3>
          <p className="text-sm mb-4" style={{ color: '#6b7266' }}>
            Browse available clinics, camps, and coaching programs and sign up directly.
          </p>
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: '#6b7a3d', color: '#fff' }}
          >
            View Programs
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Note */}
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(107, 122, 61, 0.06)', border: '1px solid rgba(107, 122, 61, 0.12)' }}>
          <p className="text-xs" style={{ color: '#6b7266' }}>
            Lesson rates and seasonal schedules will be available soon. Contact a coach for current availability.
          </p>
        </div>
      </div>
    </div>
  );
}
