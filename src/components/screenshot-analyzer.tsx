"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Upload, Sparkles, Loader2, History, Trash2, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { analyzeScreenshot, getAnalysisHistory, deleteAnalysisRecord } from "@/app/actions"
import { CameraCapture } from "@/components/camera-capture"
import type { AnalysisRecord } from "@/types"
import { formatDistanceToNow } from "date-fns"

export function ScreenshotAnalyzer() {
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisType, setAnalysisType] = useState<string>("food")
  const [history, setHistory] = useState<AnalysisRecord[]>([])
  const [activeTab, setActiveTab] = useState("upload")
  const [isLoading, setIsLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  // Load history on initial render
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const records = await getAnalysisHistory()
      setHistory(records)
    } catch (err) {
      console.error("Failed to load history:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check if file is an image
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit")
      return
    }

    setFile(selectedFile)
    setError(null)
    setCurrentRecord(null)

    // Create a preview URL
    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleCameraCapture = (capturedFile: File) => {
    setFile(capturedFile)
    setError(null)
    setCurrentRecord(null)
    setShowCamera(false)

    // Create a preview URL for the captured image
    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result as string)
    }
    reader.readAsDataURL(capturedFile)
  }

  const handleAnalyze = async () => {
    if (!file) return

    try {
      setIsAnalyzing(true)
      setError(null)

      const record = await analyzeScreenshot(file, analysisType)
      setCurrentRecord(record)

      // If the record has an imageUrl, use it for the image preview
      if (record.imageUrl) {
        setImage(record.imageUrl)
      }

      // Refresh history
      await loadHistory()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Failed to analyze the image: ${errorMessage}`)
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAnalysisRecord(id)
      // Refresh history
      await loadHistory()

      // If the current record was deleted, clear it
      if (currentRecord?.id === id) {
        setCurrentRecord(null)
      }
    } catch (err) {
      console.error("Failed to delete record:", err)
    }
  }

  const handleHistoryItemClick = (record: AnalysisRecord) => {
    setCurrentRecord(record)
    setImage(record.imageUrl)
  }

  const openCamera = () => {
    setShowCamera(true)
  }

  const closeCamera = () => {
    setShowCamera(false)
  }

  return (
    <>
      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={closeCamera} />
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>BiteByte Food Analyzer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="screenshot-upload"
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer
                    ${image ? "border-green-500 bg-green-50/10" : "border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                >
                  {image ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt="Food image preview"
                        fill
                        className="object-contain p-2"
                        unoptimized // Add this to handle blob URLs
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or HEIC (Max 10MB)</p>
                    </div>
                  )}
                  <input
                    id="screenshot-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={openCamera}
                  className="w-full sm:w-auto"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Analysis Type</label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food Analysis</SelectItem>
                    <SelectItem value="ui">UI/UX Analysis</SelectItem>
                    <SelectItem value="security">Security Check</SelectItem>
                    <SelectItem value="accessibility">Accessibility Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="history">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : history.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className={`relative cursor-pointer border rounded-md overflow-hidden ${
                        currentRecord?.id === record.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => handleHistoryItemClick(record)}
                    >
                      <div className="relative h-32 w-full">
                        <Image
                          src={record.imageUrl || "/placeholder.svg"}
                          alt={`Analysis from ${new Date(record.timestamp).toLocaleString()}`}
                          fill
                          className="object-cover"
                          unoptimized // Add this to handle blob URLs
                        />
                      </div>
                      <div className="p-2 text-xs">
                        <div className="font-medium">
                          {record.analysisType.charAt(0).toUpperCase() + record.analysisType.slice(1)}
                        </div>
                        <div className="text-muted-foreground">
                          {formatDistanceToNow(new Date(record.timestamp), { addSuffix: true })}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(record.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No analysis history yet. Upload a food photo to get started.
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && <div className="p-3 text-sm text-red-500 bg-red-100/30 rounded-md">{error}</div>}

          {currentRecord && (
            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Calorie Analysis
              </h3>
              <div className="text-sm whitespace-pre-wrap">{currentRecord.analysisResult}</div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {activeTab === "upload" && (
            <Button onClick={handleAnalyze} disabled={!image || isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Food
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  )
}