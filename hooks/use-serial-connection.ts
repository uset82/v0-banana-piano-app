"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface SerialMessage {
  e: number // electrode index
  s: number // state (0 = release, 1 = press)
}

export function useSerialConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<SerialMessage | null>(null)
  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const bufferRef = useRef<string>("")

  const disconnect = useCallback(async () => {
    if (readerRef.current) {
      try {
        await readerRef.current.cancel()
        readerRef.current.releaseLock()
      } catch (e) {
        console.error("[v0] Error canceling reader:", e)
      }
      readerRef.current = null
    }

    if (portRef.current) {
      try {
        await portRef.current.close()
      } catch (e) {
        console.error("[v0] Error closing port:", e)
      }
      portRef.current = null
    }

    setIsConnected(false)
    bufferRef.current = ""
  }, [])

  const connect = useCallback(async () => {
    if (typeof navigator === "undefined" || !("serial" in navigator)) {
      alert("Web Serial API is not supported in your browser.")
      return
    }

    try {
      // Request port
      const port = await (navigator as any).serial.requestPort()
      await port.open({ baudRate: 115200 })

      portRef.current = port
      setIsConnected(true)

      // Read data
      const reader = port.readable.getReader()
      readerRef.current = reader

      const decoder = new TextDecoder()

      // Read loop
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break

            const text = decoder.decode(value, { stream: true })
            bufferRef.current += text

            // Process complete JSON messages
            let newlineIndex
            while ((newlineIndex = bufferRef.current.indexOf("\n")) !== -1) {
              const line = bufferRef.current.substring(0, newlineIndex).trim()
              bufferRef.current = bufferRef.current.substring(newlineIndex + 1)

              if (line) {
                try {
                  const message = JSON.parse(line) as SerialMessage
                  setLastMessage(message)
                } catch (e) {
                  console.error("[v0] Failed to parse JSON:", line, e)
                }
              }
            }
          }
        } catch (error) {
          console.error("[v0] Serial read error:", error)
        } finally {
          await disconnect()
        }
      }

      readLoop()
    } catch (error) {
      console.error("[v0] Failed to connect:", error)
      alert("Failed to connect to device. Please try again.")
    }
  }, [disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    connect,
    disconnect,
    lastMessage,
  }
}
