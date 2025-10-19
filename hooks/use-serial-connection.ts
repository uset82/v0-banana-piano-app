"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface SerialMessage {
  e: number // electrode index
  s: number // state (0 = release, 1 = press)
}

export function useSerialConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<SerialMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSerialAvailable, setIsSerialAvailable] = useState(true)
  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const bufferRef = useRef<string>("")

  useEffect(() => {
    const checkSerialAvailability = async () => {
      if (typeof navigator === "undefined" || !("serial" in navigator)) {
        setIsSerialAvailable(false)
        return
      }

      // Check if we're in an iframe with restricted permissions
      if (window.self !== window.top) {
        setIsSerialAvailable(false)
        setError(
          "Serial access is not available in preview mode. Deploy this app to Vercel or run it locally to connect your hardware.",
        )
        return
      }

      // Try to check permissions policy
      try {
        const permissionStatus = await navigator.permissions.query({ name: "serial" as any })
        if (permissionStatus.state === "denied") {
          setIsSerialAvailable(false)
          setError("Serial access is denied. Please check your browser permissions.")
        }
      } catch (e) {
        // Permissions API might not support serial, that's okay
        // We'll find out when we try to connect
      }
    }

    checkSerialAvailability()
  }, [])

  const disconnect = useCallback(async () => {
    if (readerRef.current) {
      try {
        await readerRef.current.cancel()
        readerRef.current.releaseLock()
      } catch (e) {
        // Silent cleanup
      }
      readerRef.current = null
    }

    if (portRef.current) {
      try {
        await portRef.current.close()
      } catch (e) {
        // Silent cleanup
      }
      portRef.current = null
    }

    setIsConnected(false)
    bufferRef.current = ""
    setError(null)
  }, [])

  const connect = useCallback(async () => {
    setError(null)

    if (typeof navigator === "undefined" || !("serial" in navigator)) {
      const errorMsg = "Web Serial API is not supported in your browser. Please use Chrome, Edge, or Opera."
      setError(errorMsg)
      return
    }

    if (!isSerialAvailable) {
      setError(
        "Serial access is not available in this environment. Deploy this app to Vercel or run it locally to connect your hardware.",
      )
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
                  // Silent parse error
                }
              }
            }
          }
        } catch (error) {
          // Silent read error
        } finally {
          await disconnect()
        }
      }

      readLoop()
    } catch (error: any) {
      if (error.message?.includes("permissions policy")) {
        setError(
          "Serial access is blocked in this preview environment. Deploy this app to Vercel or run it locally to connect your hardware.",
        )
        setIsSerialAvailable(false)
      } else if (error.name === "NotFoundError") {
        setError("No device selected. Please try again and select your STM32 device.")
      } else {
        setError("Failed to connect to device. Make sure your STM32 is connected and try again.")
      }
    }
  }, [disconnect, isSerialAvailable])

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
    error,
    isSerialAvailable,
  }
}
