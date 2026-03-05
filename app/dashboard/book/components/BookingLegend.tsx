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
        <span className="w-5 h-3 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }} />
        Lesson
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }} />
        Program
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-3 rounded" style={{ background: '#f0ede6', border: '1px solid #e0dcd3' }} />
        Closed
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-3 rounded" style={{ background: 'rgba(212, 225, 87, 0.15)', border: '1px solid rgba(212, 225, 87, 0.4)' }} />
        Club Event
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs leading-none">💡</span>
        Floodlit
      </div>
    </div>
  );
}
