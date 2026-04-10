import { twMerge } from 'tailwind-merge'

export function Footer(): React.ReactNode {
  return (
    <footer
      className={twMerge(
        'bottom-0 w-full h-15 lg:h-20 flex items-center justify-between px-5 sm:px-20 border-t-[0.5px] border-muted',
        'font-regular text-[10px] text-muted tracking-widest lg:tracking-[0.04em] lg:text-sm select-none'
      )}
    >
      <span>
        Made by{' '}
        <a
          className="text-accent"
          href="https://github.com/guilhermehfr/just-audio"
          target="_blank"
          rel="noopener noreferrer"
        >
          Guilherme Henrique
        </a>
      </span>
      <span>© 2026 Just Audio</span>
    </footer>
  )
}
