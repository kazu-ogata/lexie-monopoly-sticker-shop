export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200/80 space-y-3">
          <div className="w-full bg-gray-200 rounded-xl aspect-[4/5]" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function PageLoaderSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6 h-96 bg-gray-200 rounded-2xl" />
        <div className="md:col-span-6 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-12 bg-gray-200 rounded w-full" />
          <div className="h-12 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
}