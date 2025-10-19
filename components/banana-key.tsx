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
        "hover:scale-105 active:scale-95",
        "border-2",
        isActive
          ? "scale-110 shadow-2xl border-primary ring-4 ring-primary/50"
          : "shadow-lg border-border hover:border-primary/50",
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
        )}
      >
        {/* Banana Emoji */}
        <div className="text-6xl transform transition-transform duration-150">🍌</div>

        {/* Note Label */}
        <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-2xl font-bold text-white drop-shadow-lg">{note}</span>
        </div>

        {/* Electrode Number */}
        <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center">
          <span className="text-sm font-semibold text-white">{index}</span>
        </div>

        {/* Active Indicator */}
        {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
      </div>
    </Card>
  )
}
