export default function ActivitiesLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-neutral-900 px-5 flex items-center justify-between">
        <div className="h-5 w-24 rounded-full bg-neutral-800 animate-pulse" />
        <div className="h-8 w-20 rounded-full bg-neutral-800 animate-pulse" />
      </div>

      <div className="px-5 sm:px-8 lg:px-[80px] py-12">
        {/* Title skeleton */}
        <div className="h-12 w-40 rounded-full bg-neutral-800 animate-pulse mb-10" />

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>

        {/* Two-column layout skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-3xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col gap-4">
              <div className="h-5 w-32 rounded-full bg-neutral-800 animate-pulse" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-12 rounded-xl bg-neutral-800 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
