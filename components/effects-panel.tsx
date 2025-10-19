"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

export interface AudioEffects {
  delayEnabled: boolean
  delayTime: number
  delayFeedback: number
  volume: number
}

interface EffectsPanelProps {
  effects: AudioEffects
  onEffectsChange: (effects: AudioEffects) => void
}

export function EffectsPanel({ effects, onEffectsChange }: EffectsPanelProps) {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <h3 className="font-semibold mb-4">Effects & Controls</h3>
      <div className="flex flex-col gap-6">
        {/* Volume */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Volume</Label>
          <Slider
            value={[effects.volume]}
            onValueChange={([value]) => onEffectsChange({ ...effects, volume: value })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground text-right">{effects.volume}%</div>
        </div>

        {/* Delay Effect */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Delay Effect</Label>
            <Switch
              checked={effects.delayEnabled}
              onCheckedChange={(checked) => onEffectsChange({ ...effects, delayEnabled: checked })}
            />
          </div>

          {effects.delayEnabled && (
            <>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Delay Time</Label>
                <Slider
                  value={[effects.delayTime]}
                  onValueChange={([value]) => onEffectsChange({ ...effects, delayTime: value })}
                  min={100}
                  max={1000}
                  step={50}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground text-right">{effects.delayTime}ms</div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Feedback</Label>
                <Slider
                  value={[effects.delayFeedback]}
                  onValueChange={([value]) => onEffectsChange({ ...effects, delayFeedback: value })}
                  min={0}
                  max={90}
                  step={5}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground text-right">{effects.delayFeedback}%</div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
