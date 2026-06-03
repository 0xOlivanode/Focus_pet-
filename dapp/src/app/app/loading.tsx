export default function AppLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-neutral-900 px-5 flex items-center justify-between">
        <div className="h-5 w-24 rounded-full bg-neutral-800 animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-8 w-20 rounded-full bg-neutral-800 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 px-5 sm:px-8 lg:px-[80px] py-8 flex flex-col gap-6">
        {/* Pet card skeleton */}
        <div className="w-full max-w-sm mx-auto lg:mx-0 rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden">
          <div className="aspect-square bg-neutral-800 animate-pulse" />
          <div className="p-5 flex flex-col gap-3">
            <div className="h-4 w-32 rounded-full bg-neutral-800 animate-pulse" />
            <div className="h-3 w-full rounded-full bg-neutral-800 animate-pulse" />
            <div className="h-3 w-3/4 rounded-full bg-neutral-800 animate-pulse" />
          </div>
        </div>

        {/* Timer skeleton */}
        <div className="h-24 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse" />

        {/* Stats row skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
