export function WaveformSpinner(): React.ReactNode {
  const bars = [0, 1, 2, 3, 4, 5, 6]

  return (
    <div className="w-full max-w-[840px] mx-auto flex items-center justify-center h-[70px] lg:h-[130px] gap-[3px] lg:gap-2">
      {bars.map(i => (
        <div
          key={i}
          className="w-[2px] lg:w-[6px] rounded-full bg-default/40"
          style={{
            height: '40%',
            animation: 'wave-bounce 1s ease-in-out infinite',
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave-bounce {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}
