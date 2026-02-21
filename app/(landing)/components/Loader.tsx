'use client';

export default function Loader() {
  return (
    <div className="loader" id="loader">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: '#1a1f12' }}
          >
            <span
              className="text-base font-bold tracking-wide"
              style={{ color: '#1a1f12' }}
            >
              MTC
            </span>
          </div>
          <span
            className="text-xl font-bold tracking-wide"
            style={{ color: '#1a1f12' }}
          >
            Mono Tennis
          </span>
        </div>
        <div className="tennis-ball-wrapper">
          <img className="tennis-ball" src="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/loader-tennis-ball.png" alt="" />
        </div>
      </div>
    </div>
  );
}
