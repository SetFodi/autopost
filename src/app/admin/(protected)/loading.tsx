export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-[1500px] animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-4 w-36 rounded bg-white/5" />
      <div className="mt-4 h-10 w-72 max-w-full rounded bg-white/8" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-white/5 bg-white/[0.025]"
          />
        ))}
      </div>
      <div className="mt-5 h-[32rem] rounded-3xl border border-white/5 bg-white/[0.025]" />
    </main>
  )
}
