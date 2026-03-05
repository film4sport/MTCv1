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
        <svg className="w-3.5 h-3.5" style={{ color: '#c4a060' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3m0-18a5.5 5.5 0 013.5 9.75V15a.5.5 0 01-.5.5h-6a.5.5 0 01-.5-.5v-3.25A5.5 5.5 0 0112 3zm-2.5 15h5" />
        </svg>
        Floodlit
      </div>
    </div>
  );
}
