import PageSkeleton from '../components/PageSkeleton';

export default function BookLoading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <PageSkeleton />
    </div>
  );
}
