'use client'

import { ClipboardPaste, Play } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled: boolean
  error: string
}

export function SearchInput({ value, onChange, onSubmit, disabled, error }: SearchInputProps): React.ReactNode {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)

  const updateShadows = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    setShowLeftShadow(el.scrollLeft > 0)
    setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth)
  }, [])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    updateShadows()
    el.addEventListener('scroll', updateShadows)
    return () => el.removeEventListener('scroll', updateShadows)
  }, [updateShadows])

  useEffect(() => {
    updateShadows()
  }, [value, updateShadows])

  return (
    <>
      <div className="flex items-center justify-between h-[50px] lg:h-12 bg-surface border border-muted rounded-lg px-2">
        <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
          <ClipboardPaste className="w-5 h-5 lg:w-7 lg:h-7 text-default shrink-0" strokeWidth={1} />
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste the youtube video url..."
              className="bg-transparent text-default text-sm lg:text-xl outline-none placeholder:text-muted w-full"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              disabled={disabled}
            />
            {showLeftShadow && (
              <div className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-surface to-transparent pointer-events-none z-10" />
            )}
            {showRightShadow && (
              <div className="absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-surface to-transparent pointer-events-none z-10" />
            )}
          </div>
        </div>
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="w-8 h-8 lg:w-10 lg:h-10 bg-accent rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-3 h-3 lg:w-[15px] lg:h-[15px] text-base" fill="currentColor" />
        </button>
      </div>

      {error && (
        <p className="text-accent text-sm">{error}</p>
      )}
    </>
  )
}
