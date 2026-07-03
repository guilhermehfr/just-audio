import { twMerge } from 'tailwind-merge'

interface MetadataBarProps {
  title: string
  url: string
}

export function MetadataBar({ title, url }: MetadataBarProps): React.ReactNode {
  return (
    <div className={twMerge('w-full max-w-[840px] mx-auto py-2', 'flex flex-col items-start gap-1')}>
      <span className="text-sm lg:text-xl text-default font-semibold truncate w-full">
        {title}
      </span>
      <span className="text-[10px] lg:text-sm text-muted truncate w-full">
        {url}
      </span>
    </div>
  )
}
