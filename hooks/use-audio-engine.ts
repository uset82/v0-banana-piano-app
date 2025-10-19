"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Instrument } from "@/components/instrument-selector"
import type { AudioEffects } from "@/components/effects-panel"

const NOTE_FREQUENCIES: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
}

interface ActiveNote {
  oscillator: OscillatorNode
  gainNode: GainNode
}

export function useAudioEngine() {
  const [instrument, setInstrument] = useState<Instrument>("piano")
  const [effects, setEffects] = useState<AudioEffects>({
    delayEnabled: false,
    delayTime: 300,
    delayFeedback: 40,
    volume: 70,
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const delayNodeRef = useRef<DelayNode | null>(null)
  const delayGainRef = useRef<GainNode | null>(null)
  const activeOscillatorsRef = useRef<Map<string, ActiveNote>>(new Map())

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContext()
      console.log("[v0] Audio context created, state:", audioContextRef.current.state)

      // Master gain
      masterGainRef.current = audioContextRef.current.createGain()
      masterGainRef.current.connect(audioContextRef.current.destination)

      // Delay effect
      delayNodeRef.current = audioContextRef.current.createDelay(2.0)
      delayGainRef.current = audioContextRef.current.createGain()

      delayNodeRef.current.connect(delayGainRef.current)
      delayGainRef.current.connect(delayNodeRef.current)
      delayGainRef.current.connect(masterGainRef.current)
    }

    return () => {
      activeOscillatorsRef.current.forEach((note) => {
        try {
          note.oscillator.stop()
        } catch (e) {
          // Ignore errors when stopping oscillators
        }
      })
      activeOscillatorsRef.current.clear()
      audioContextRef.current?.close()
    }
  }, [])

  // Update effects
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = effects.volume / 100
    }
    if (delayNodeRef.current) {
      delayNodeRef.current.delayTime.value = effects.delayTime / 1000
    }
    if (delayGainRef.current) {
      delayGainRef.current.gain.value = effects.delayFeedback / 100
    }
  }, [effects])

  const playNote = useCallback(
    (note: string) => {
      if (!audioContextRef.current || !masterGainRef.current) {
        console.log("[v0] Audio context not ready")
        return
      }

      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === "suspended") {
        console.log("[v0] Resuming suspended audio context")
        audioContextRef.current.resume()
      }

      // Stop existing oscillator for this note
      const existingNote = activeOscillatorsRef.current.get(note)
      if (existingNote) {
        try {
          existingNote.oscillator.stop()
        } catch (e) {
          // Ignore
        }
        activeOscillatorsRef.current.delete(note)
      }

      const frequency = NOTE_FREQUENCIES[note]
      if (!frequency) return

      console.log("[v0] Playing note:", note, "frequency:", frequency)

      // Create oscillator
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      // Set waveform based on instrument
      oscillator.type = instrument === "piano" ? "sine" : "triangle"
      oscillator.frequency.value = frequency

      // ADSR envelope
      const now = audioContextRef.current.currentTime
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01) // Attack
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1) // Decay to sustain

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(masterGainRef.current)

      if (effects.delayEnabled && delayNodeRef.current) {
        gainNode.connect(delayNodeRef.current)
      }

      oscillator.start()
      activeOscillatorsRef.current.set(note, { oscillator, gainNode })
    },
    [instrument, effects.delayEnabled],
  )

  const stopNote = useCallback((note: string) => {
    const activeNote = activeOscillatorsRef.current.get(note)
    if (activeNote && audioContextRef.current) {
      const now = audioContextRef.current.currentTime
      const { oscillator, gainNode } = activeNote

      console.log("[v0] Stopping note:", note)

      try {
        gainNode.gain.cancelScheduledValues(now)
        gainNode.gain.setValueAtTime(gainNode.gain.value, now)
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2)

        oscillator.stop(now + 0.2)
      } catch (e) {
        console.log("[v0] Error stopping note:", e)
      }

      activeOscillatorsRef.current.delete(note)
    }
  }, [])

  return {
    playNote,
    stopNote,
    instrument,
    setInstrument,
    effects,
    setEffects,
  }
}
