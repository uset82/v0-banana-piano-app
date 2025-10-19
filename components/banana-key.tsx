"use client"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface BananaKeyProps {
  note: string
  index: number
  isActive: boolean
  gradient: string
  onPress: () => void
  onRelease: () => void
}

export function BananaKey({ note, index, isActive, gradient, onPress, onRelease }: BananaKeyProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden cursor-pointer select-none transition-all duration-150",
        "sm:hover:scale-105 sm:active:scale-95",
        "border sm:border-2",
        "w-full",
        isActive
          ? "sm:scale-110 shadow-2xl border-primary ring-4 ring-accent/60"
          : "shadow-lg border-border sm:hover:border-primary/50",
        "py-2 sm:py-6",
      )}
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={onRelease}
      onTouchStart={(e) => {
        e.preventDefault()
        onPress()
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
        onRelease()
      }}
    >
      <div
        className={cn(
          "aspect-[3/4] flex flex-col items-center justify-center gap-3 p-6",
          "bg-gradient-to-br",
          gradient,
          isActive && "brightness-125",
          "aspect-[2/5] sm:aspect-[3/4] p-2 sm:p-6 glossy",
        )}
      >
        {/* Banana Emoji */}
        <div className="text-6xl transform transition-transform duration-150">🍌</div>

        {/* Note Label */}
        <div className="bg-white/30 text-foreground/90 sm:bg-white/40 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-white/30 shadow-sm">
          <span className="text-xs sm:text-2xl font-bold text-white drop-shadow-lg">{note}</span>
        </div>

        {/* Electrode Number */}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-white/35 backdrop-blur-sm w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border border-white/30">
          <span className="text-[10px] sm:text-sm font-semibold text-white">{index}</span>
        </div>

        {/* Active Indicator */}
        {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
      </div>
    </Card>
  )
}
