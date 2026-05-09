export default function StorefrontNotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080807] flex items-center justify-center px-4 text-white">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/4 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-amber-300/[0.09] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>
      <div className="relative text-center">
        <p className="font-serif text-7xl text-white/15 mb-4">404</p>
        <h1 className="font-serif text-3xl text-white mb-2">Store not found</h1>
        <p className="text-sm text-white/50">
          This store doesn&apos;t exist or is no longer available.
        </p>
      </div>
    </div>
  )
}
