export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-neutral-900 px-5 flex items-center justify-between">
        <div className="h-5 w-24 rounded-full bg-neutral-800 animate-pulse" />
        <div className="h-8 w-20 rounded-full bg-neutral-800 animate-pulse" />
      </div>

      <div className="px-5 sm:px-8 lg:px-[80px] py-10">
        {/* Header skeleton */}
        <div className="h-10 w-48 rounded-full bg-neutral-800 animate-pulse mb-8" />

        {/* Top 3 podium skeleton */}
        <div className="flex items-end justify-center gap-4 mb-10">
          {[60, 80, 60].map((h, i) => (
            <div key={i} className={`w-24 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse`} style={{ height: h + "px" }} />
          ))}
        </div>

        {/* Leaderboard rows skeleton */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="h-6 w-6 rounded-full bg-neutral-800 animate-pulse shrink-0" />
              <div className="h-8 w-8 rounded-full bg-neutral-800 animate-pulse shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 w-32 rounded-full bg-neutral-800 animate-pulse" />
                <div className="h-2 w-20 rounded-full bg-neutral-800 animate-pulse" />
              </div>
              <div className="h-4 w-16 rounded-full bg-neutral-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
