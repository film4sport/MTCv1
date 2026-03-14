export default function CoachingTab() {
  const juniorPrograms = [
    {
      name: 'Munchkin Stars',
      ages: '3–4',
      duration: '30 min',
      schedule: 'Thursdays 4:30 – 5:00 PM',
      memberPrice: '$127.25',
      nonMemberPrice: '$172.25',
      description: 'A fun introduction to tennis for our youngest players. Games and activities build eye-hand coordination and court skills. Lighter balls help players hit at their own height and build confidence. Parents may assist their Munchkin.',
    },
    {
      name: 'Red Ball Tennis',
      ages: '5–6',
      duration: '1 hour',
      schedule: 'Thursdays 5:00 – 6:00 PM',
      memberPrice: '$254.25',
      nonMemberPrice: '$299.25',
      description: 'Players hit lots of balls while building familiarity with tennis rules, lines, and proper grip. The focus remains on fun — players don\'t even realize how much they\'re learning! Lighter balls give younger players more control.',
    },
    {
      name: 'Orange Ball Tennis',
      ages: '6–8',
      duration: '1 hour',
      schedule: 'Tuesdays 4:00 – 5:00 PM',
      memberPrice: '$254.25',
      nonMemberPrice: '$299.25',
      description: 'Players graduate to hitting over the main net (lowered). Orange dot balls have more bounce but are still lighter and easier on young arms. A fast-paced program where players hit lots of balls while gaining confidence.',
    },
    {
      name: 'Green Ball Tennis',
      ages: '9+',
      duration: '1 hour',
      schedule: 'Tuesdays 5:00 – 6:00 PM',
      memberPrice: '$254.25',
      nonMemberPrice: '$299.25',
      description: 'Players are on the full court using green dot tennis balls. This group begins point play and keeps track of their own scores. Instruction continues as players work on technique, grip, and stance.',
    },
    {
      name: 'Teen Tennis',
      ages: '12+',
      duration: '1 hour',
      schedule: 'Mon 5–6 PM · Tue 6–7 PM · Fri 4:30–5:30 PM',
      memberPrice: '$254.25',
      nonMemberPrice: '$299.25',
      description: 'It\'s never too late to learn a new sport. All skill levels welcome. A great opportunity for any teen who wants to learn or build their tennis skills and gain a passion for tennis.',
    },
  ];

  const adultPrograms = [
    {
      name: 'Adult Tennis 101/102',
      duration: '1 hour',
      schedule: 'Tuesdays 8:30 – 9:30 PM',
      memberPrice: '$223.75',
      nonMemberPrice: '$313.75',
      description: 'A combined 101/102 group — all skill levels welcome. You\'ll receive instruction based on your ability. Burn off some steam while hitting lots of tennis balls and bringing your game to the next level.',
    },
    {
      name: 'Live Ball',
      duration: '1.5 hours',
      schedule: 'Mon 9:30–11 AM · Mon 6–7:30 PM · Tue 7–8:30 PM · Fri 5:30–7 PM',
      memberPrice: '$284.75',
      nonMemberPrice: '$374.75',
      description: 'A fun, fast-paced group where players play doubles and point play. Great for players looking for competitive match practice in a social setting.',
    },
  ];

  return (
    <>
      {/* Dashboard CTA for logged-in members */}
      <div className="px-8 lg:px-16 pt-8" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-4xl mx-auto">
          <a
            href="/dashboard/lessons"
            className="block rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md"
            style={{ background: 'rgba(107, 122, 61, 0.1)', border: '1px solid rgba(107, 122, 61, 0.2)', color: '#6b7a3d', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            Already a member? View lessons, enroll in programs, and book coaching sessions in your Dashboard &rarr;
          </a>
        </div>
      </div>

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
                <span className="text-xs px-3 py-1 rounded-full inline-block mb-3" style={{ backgroundColor: 'rgba(107, 122, 61, 0.12)', color: '#4a5528' }}>Tennis Professional</span>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b7266' }}>
                  Over 40 years of experience as a player, instructor, and coach. Provincially ranked junior who reached the junior nationals, then played Varsity Tennis at Brock University for 5 years and served as Assistant Coach. Tennis Coach at North Park S.S. for 23+ years, advancing his team to OFSAA 5 times. Adrian has taught at Olympia Sports Camp, Deerhurst Resort, St. Catharines Tennis Club, and White Oaks Tennis Club. He enjoys helping players of all abilities improve their skills, fitness, and most importantly have fun.
                </p>
                <a href="mailto:Shelley.Adrian.Tennis@gmail.com" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: '#6b7a3d' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Shelley.Adrian.Tennis@gmail.com — Private lessons
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Schedule Grid */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// Programs</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
              Spring 2026 Tennis Programs
            </h2>
            <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              9-week programs for all ages and skill levels, starting the week of May 11.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 fade-in">
            {[
              { day: 'Monday', start: 'May 11', classes: [{ name: 'Live Ball', time: '9:30 – 11:00 AM' }, { name: 'Team Practice', time: '11:00 AM – 1:00 PM' }, { name: 'Teen Tennis', time: '5:00 – 6:00 PM' }, { name: 'Live Ball', time: '6:00 – 7:30 PM' }] },
              { day: 'Tuesday', start: 'May 12', classes: [{ name: 'Orange Ball', time: '4:00 – 5:00 PM' }, { name: 'Green Ball', time: '5:00 – 6:00 PM' }, { name: 'Teen Tennis', time: '6:00 – 7:00 PM' }, { name: 'Live Ball', time: '7:00 – 8:30 PM' }, { name: 'Adult 101/102', time: '8:30 – 9:30 PM' }] },
              { day: 'Thursday', start: 'May 14', classes: [{ name: 'Munchkin Stars', time: '4:30 – 5:00 PM' }, { name: 'Red Ball', time: '5:00 – 6:00 PM' }] },
              { day: 'Friday', start: 'May 15', classes: [{ name: 'Teen Tennis', time: '4:30 – 5:30 PM' }, { name: 'Live Ball', time: '5:30 – 7:00 PM' }, { name: 'House League', time: '7:00 – 9:00 PM' }] },
            ].map((day) => (
              <div key={day.day} className="rounded-xl p-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2" style={{ color: '#2a2f1e' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#6b7a3d' }} />
                  {day.day}
                </h3>
                <p className="text-xs mb-4" style={{ color: '#999' }}>Starts {day.start}</p>
                <div className="space-y-2.5">
                  {day.classes.map((cls, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium" style={{ color: '#2a2f1e' }}>{cls.name}</span>
                      <span style={{ color: '#6b7266' }}>{cls.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Junior Program Details */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// Junior Programs</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
              Junior Tennis Programs
            </h2>
            <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              Progressive programs designed for each age group, from first-time players to competitive teens.
            </p>
          </div>

          <div className="space-y-4 fade-in">
            {juniorPrograms.map((prog) => (
              <div key={prog.name} className="rounded-xl p-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#2a2f1e' }}>{prog.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#4a5528' }}>Ages {prog.ages}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#4a5528' }}>{prog.duration}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: '#6b7a3d' }}>{prog.memberPrice} <span className="font-normal text-xs" style={{ color: '#999' }}>member</span></div>
                    <div className="text-xs" style={{ color: '#999' }}>{prog.nonMemberPrice} non-member</div>
                  </div>
                </div>
                <p className="text-sm mb-2" style={{ color: '#6b7266' }}>{prog.schedule}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>{prog.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Adult Program Details */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// Adult Programs</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
              Adult Tennis Programs
            </h2>
            <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              From beginner instruction to competitive match play, there&apos;s a program for every level.
            </p>
          </div>

          <div className="space-y-4 fade-in">
            {adultPrograms.map((prog) => (
              <div key={prog.name} className="rounded-xl p-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#2a2f1e' }}>{prog.name}</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full mt-2 inline-block" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#4a5528' }}>{prog.duration}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: '#6b7a3d' }}>{prog.memberPrice} <span className="font-normal text-xs" style={{ color: '#999' }}>member</span></div>
                    <div className="text-xs" style={{ color: '#999' }}>{prog.nonMemberPrice} non-member</div>
                  </div>
                </div>
                <p className="text-sm mb-2" style={{ color: '#6b7266' }}>{prog.schedule}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>{prog.description}</p>
              </div>
            ))}
          </div>

          {/* Summer Camp */}
          <div className="mt-8 fade-in rounded-xl p-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold text-lg" style={{ color: '#2a2f1e' }}>Summer Tennis Camp</h3>
                <span className="text-xs px-2.5 py-1 rounded-full mt-2 inline-block" style={{ background: 'rgba(212, 225, 87, 0.2)', color: '#4a5528' }}>Ages 5+ &middot; Dates coming soon</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              Camp is about fun! Campers will be running, hitting, building friendships and making memories to last a lifetime. Games and activities help build tennis skills and on-court confidence. There&apos;s nowhere better than camp to be outside enjoying the sunshine.
            </p>
          </div>
        </div>
      </section>

      {/* Sign Up & Contact */}
      <section className="py-12 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-4xl mx-auto fade-in">
          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(107, 122, 61, 0.08)', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
            <p className="text-sm font-medium mb-3" style={{ color: '#4a5528' }}>Sign Up & Contact</p>
            <div className="space-y-2">
              <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                To register for any program or for more information, email{' '}
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
      </section>
    </>
  );
}
