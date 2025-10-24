"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Usb, MouseOff as UsbOff, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SerialConnectionProps {
  isConnected: boolean
  onConnect: () => Promise<void>
  onDisconnect: () => void
  error?: string | null
  isSerialAvailable?: boolean
}

export function SerialConnection({
  isConnected,
  onConnect,
  onDisconnect,
  error,
  isSerialAvailable = true,
}: SerialConnectionProps) {
  const isWebSerialSupported = typeof navigator !== "undefined" && "serial" in navigator

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isConnected ? <Usb className="w-6 h-6 text-accent" /> : <UsbOff className="w-6 h-6 text-muted-foreground" />}
          <div>
            <h3 className="font-semibold">{isConnected ? "Connected to STM32" : "Not Connected"}</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected ? "Receiving data from your banana piano" : "Connect your STM32 microcontroller via USB"}
            </p>
          </div>
        </div>
        <Button
          onClick={isConnected ? onDisconnect : onConnect}
          variant={isConnected ? "outline" : "default"}
          disabled={!isWebSerialSupported || !isSerialAvailable}
        >
          {isConnected ? "Disconnect" : "Connect Device"}
        </Button>
      </div>

      {error && (
        <Alert className="mt-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isWebSerialSupported && (
        <Alert className="mt-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Web Serial API is not supported in your browser. Please use Chrome, Edge, or Opera.
          </AlertDescription>
        </Alert>
      )}

      {isWebSerialSupported && !isConnected && !error && isSerialAvailable && (
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Ready to Connect</AlertTitle>
          <AlertDescription>
            Click "Connect Device" to select your STM32 microcontroller from the available USB serial ports.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
