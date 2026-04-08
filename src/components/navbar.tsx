export function Navbar(): React.ReactNode {
  return (
    <nav className="w-full h-15 lg:h-20 flex items-center justify-between px-5 sm:px-20 border-b-[0.5px] border-muted">
      <span className="font-bold uppercase tracking-widest lg:tracking-[0.15em] lg:text-2xl select-none">
        JUST AUDIO
      </span>
      <span
        className="w-2 h-2 lg:w-4 lg:h-4 rounded-full bg-accent shrink-0"
        aria-label="Status dot"
      />
    </nav>
  )
}
