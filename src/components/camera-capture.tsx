"use client"

import React, { useRef, useState, useEffect } from "react"
import { Camera, CameraIcon, XIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        // Stop any existing stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }

        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        })

        // Set video source
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsCameraActive(true)
          setError(null)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Camera access error: ${errorMessage}`)
        setIsCameraActive(false)
        console.error("Camera access error:", err)
      }
    }

    startCamera()

    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [facingMode])

  // Toggle between front and back camera
  const switchCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user")
  }

  // Take photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to the canvas
    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to data URL and store
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92)
      setCapturedImage(imageDataUrl)

      // Stop the video stream since we've captured an image
      if (video.srcObject instanceof MediaStream) {
        video.srcObject.getTracks().forEach(track => track.stop())
        setIsCameraActive(false)
      }
    }
  }

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null)
    // The camera will restart automatically via useEffect
  }

  // Confirm and process the photo
  const confirmPhoto = () => {
    if (!capturedImage) return

    // Convert data URL to blob/file
    const byteString = atob(capturedImage.split(',')[1])
    const mimeType = capturedImage.split(',')[0].split(':')[1].split(';')[0]
    const arrayBuffer = new ArrayBuffer(byteString.length)
    const uint8Array = new Uint8Array(arrayBuffer)

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i)
    }

    const blob = new Blob([arrayBuffer], { type: mimeType })
    const file = new File([blob], `bitebyte-capture-${Date.now()}.jpg`, { type: mimeType })

    // Pass the file up to the parent component
    onCapture(file)
  }

  return (
    <Card className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        {/* Show either the live camera feed or the captured image */}
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`h-full w-full object-cover ${isCameraActive ? "" : "hidden"}`}
          />
        ) : (
          <img
            src={capturedImage}
            alt="Captured food"
            className="h-full w-full object-cover"
          />
        )}

        {/* Hidden canvas for capturing photos */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Display errors if any */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <div className="text-center">
              <p className="text-lg font-medium text-white mb-2">Camera Error</p>
              <p className="text-sm text-gray-300">{error}</p>
              <Button
                variant="outline"
                className="mt-4 bg-white text-black hover:bg-gray-200"
                onClick={onClose}
              >
                Close Camera
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Camera controls */}
      <div className="p-4 bg-black flex items-center justify-between">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
        >
          <XIcon />
        </Button>

        {/* Take photo or Retake/Confirm */}
        {!capturedImage ? (
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16 border-2 border-white"
            onClick={capturePhoto}
            disabled={!isCameraActive}
          >
            <div className="rounded-full bg-white w-12 h-12" />
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-2 border-white text-white hover:bg-white/20"
              onClick={retakePhoto}
            >
              <XIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-2 border-white text-white hover:bg-white/20"
              onClick={confirmPhoto}
            >
              <CheckIcon />
            </Button>
          </div>
        )}

        {/* Switch camera button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={switchCamera}
          disabled={!isCameraActive || !!capturedImage}
        >
          <CameraIcon />
        </Button>
      </div>
    </Card>
  )
}