export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-neutral-900 px-5 flex items-center justify-between">
        <div className="h-5 w-24 rounded-full bg-neutral-800 animate-pulse" />
        <div className="h-8 w-28 rounded-full bg-neutral-800 animate-pulse" />
      </div>

      <div className="px-5 sm:px-8 lg:px-[80px] py-10">
        {/* Header + balance skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-9 w-32 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-9 w-36 rounded-full bg-neutral-800 animate-pulse" />
        </div>

        {/* Category tabs skeleton */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 w-28 rounded-full bg-neutral-800 animate-pulse" />
          ))}
        </div>

        {/* Item grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
              <div className="aspect-4/3 bg-neutral-800 animate-pulse" />
              <div className="p-4 flex flex-col gap-3">
                <div className="h-4 w-28 rounded-full bg-neutral-800 animate-pulse" />
                <div className="flex items-center justify-between">
                  <div className="h-6 w-16 rounded-full bg-neutral-800 animate-pulse" />
                  <div className="h-9 w-20 rounded-full bg-neutral-800 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
