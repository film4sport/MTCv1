export default function BookingLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.7rem]" style={{ color: '#9ca3a0' }}>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-3 rounded border border-dashed" style={{ borderColor: '#d4d0c7' }} />
        Available
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-3 rounded" style={{ background: '#6b7a3d' }} />
        My Booking
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-3 rounded" style={{ background: 'rgba(96, 165, 250, 0.12)', border: '1px solid rgba(96, 165, 250, 0.3)' }} />
        Lesson
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-3 rounded" style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)' }} />
        Program
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-3 rounded" style={{ background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.4)' }} />
        Club Event
      </div>
    </div>
  );
}
