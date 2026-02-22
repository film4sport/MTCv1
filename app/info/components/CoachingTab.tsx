export default function CoachingTab() {
  return (
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
  );
}
