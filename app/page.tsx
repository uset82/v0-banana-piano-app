"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { BananaKey } from "@/components/banana-key"
import { SerialConnection } from "@/components/serial-connection"
import { InstrumentSelector } from "@/components/instrument-selector"
import { EffectsPanel } from "@/components/effects-panel"
import { useAudioEngine } from "@/hooks/use-audio-engine"
import { useSerialConnection } from "@/hooks/use-serial-connection"
import { Music2 } from "lucide-react"

const NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"] as const
const BANANA_COLORS = [
  "from-yellow-300 to-yellow-500",
  "from-amber-300 to-amber-500",
  "from-yellow-400 to-orange-400",
  "from-yellow-300 to-amber-400",
  "from-amber-400 to-yellow-500",
  "from-yellow-400 to-amber-500",
  "from-amber-300 to-yellow-400",
]

export default function BananaPianoPage() {
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set())
  const { playNote, stopNote, instrument, setInstrument, effects, setEffects } = useAudioEngine()
  const { isConnected, connect, disconnect, lastMessage } = useSerialConnection()

  // Handle incoming serial messages
  useEffect(() => {
    if (lastMessage) {
      const { e: electrode, s: state } = lastMessage
      if (electrode >= 0 && electrode < 7) {
        if (state === 1) {
          // Press
          setActiveKeys((prev) => new Set(prev).add(electrode))
          playNote(NOTES[electrode])
        } else if (state === 0) {
          // Release
          setActiveKeys((prev) => {
            const next = new Set(prev)
            next.delete(electrode)
            return next
          })
          stopNote(NOTES[electrode])
        }
      }
    }
  }, [lastMessage, playNote, stopNote])

  const handleKeyPress = (index: number) => {
    setActiveKeys((prev) => new Set(prev).add(index))
    playNote(NOTES[index])
  }

  const handleKeyRelease = (index: number) => {
    setActiveKeys((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
    stopNote(NOTES[index])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music2 className="w-12 h-12 text-primary" />
            <h1 className="text-6xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Banana Piano
            </h1>
          </div>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
            Turn bananas into a musical instrument. Connect your STM32 microcontroller and start playing!
          </p>
        </header>

        {/* Connection Status */}
        <div className="mb-8">
          <SerialConnection isConnected={isConnected} onConnect={connect} onDisconnect={disconnect} />
        </div>

        {/* Main Piano Interface */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Piano Keys */}
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-2">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold mb-4 text-center">Your Banana Keyboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                {NOTES.map((note, index) => (
                  <BananaKey
                    key={note}
                    note={note}
                    index={index}
                    isActive={activeKeys.has(index)}
                    gradient={BANANA_COLORS[index]}
                    onPress={() => handleKeyPress(index)}
                    onRelease={() => handleKeyRelease(index)}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                {isConnected
                  ? "Touch your bananas to play notes!"
                  : "Click or tap the bananas to test sounds, or connect your device to play with real bananas!"}
              </p>
            </div>
          </Card>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            <InstrumentSelector currentInstrument={instrument} onInstrumentChange={setInstrument} />
            <EffectsPanel effects={effects} onEffectsChange={setEffects} />
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-12 p-6 bg-card/30 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-3">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground mb-2">1. Hardware Setup</div>
              <p>Connect 7 bananas to your STM32 NUCLEO-F767ZI using capacitive touch sensors</p>
            </div>
            <div>
              <div className="font-medium text-foreground mb-2">2. Serial Connection</div>
              <p>Click "Connect Device" and select your STM32 from the USB serial ports</p>
            </div>
            <div>
              <div className="font-medium text-foreground mb-2">3. Play Music</div>
              <p>Touch the bananas to trigger notes and create your own fruity melodies!</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
