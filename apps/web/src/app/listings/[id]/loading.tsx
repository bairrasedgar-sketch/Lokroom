export default function LoadingListing() {
  return (
    <section className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="h-7 w-72 bg-gray-200 rounded" />
      <div className="aspect-[4/3] bg-gray-100 rounded" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          <div className="h-5 bg-gray-100 rounded w-32" />
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>
        <div className="space-y-3">
          <div className="h-24 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    </section>
  );
}
