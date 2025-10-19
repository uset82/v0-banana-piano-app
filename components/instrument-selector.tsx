"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Piano, Guitar } from "lucide-react"
import { cn } from "@/lib/utils"

export type Instrument = "piano" | "guitar"

interface InstrumentSelectorProps {
  currentInstrument: Instrument
  onInstrumentChange: (instrument: Instrument) => void
}

export function InstrumentSelector({ currentInstrument, onInstrumentChange }: InstrumentSelectorProps) {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <h3 className="font-semibold mb-4">Instrument</h3>
      <div className="flex flex-col gap-2">
        <Button
          variant={currentInstrument === "piano" ? "default" : "outline"}
          className={cn("justify-start gap-3 h-auto py-4", currentInstrument === "piano" && "ring-2 ring-primary")}
          onClick={() => onInstrumentChange("piano")}
        >
-          <Piano className="w-5 h-5" />
+          {Piano && <Piano className="w-5 h-5" />}
          <div className="text-left">
            <div className="font-semibold">Piano</div>
            <div className="text-xs opacity-80">Classic piano sound</div>
          </div>
        </Button>
        <Button
          variant={currentInstrument === "guitar" ? "default" : "outline"}
          className={cn("justify-start gap-3 h-auto py-4", currentInstrument === "guitar" && "ring-2 ring-primary")}
          onClick={() => onInstrumentChange("guitar")}
        >
-          <Guitar className="w-5 h-5" />
+          {Guitar && <Guitar className="w-5 h-5" />}
          <div className="text-left">
            <div className="font-semibold">Guitar</div>
            <div className="text-xs opacity-80">Acoustic guitar tone</div>
          </div>
        </Button>
      </div>
    </Card>
  )
}
