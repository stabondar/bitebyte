"use server"

import { put, del } from "@vercel/blob"
import type { AnalysisRecord } from "@/types"

// Local storage for analysis records (in a real app, you'd use a database)
let analysisHistory: AnalysisRecord[] = []

export async function storeScreenshot(
  file: File,
  analysisType: string,
  analysisResult: string,
): Promise<AnalysisRecord> {
  try {
    // Generate a unique ID
    const id = crypto.randomUUID()
    const timestamp = Date.now()
    const filename = `screenshots/${id}-${timestamp}-${file.name.replace(/\s+/g, "-")}`

    console.log("Attempting to store file:", filename)

    // Check if BLOB_READ_WRITE_TOKEN is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("BLOB_READ_WRITE_TOKEN is not available. Using fallback storage method.")
      // Create a record without storing in Blob
      const record: AnalysisRecord = {
        id,
        // Use a data URL as fallback (not ideal for production)
        imageUrl: URL.createObjectURL(file),
        timestamp,
        analysisType,
        analysisResult,
      }

      // Add to history
      analysisHistory = [record, ...analysisHistory].slice(0, 20)
      return record
    }

    // Store the image in Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    console.log("File stored successfully:", blob.url)

    // Create a record
    const record: AnalysisRecord = {
      id,
      imageUrl: blob.url,
      timestamp,
      analysisType,
      analysisResult,
    }

    // Add to history (in a real app, you'd save to a database)
    analysisHistory = [record, ...analysisHistory].slice(0, 20) // Keep only the 20 most recent

    return record
  } catch (error) {
    console.error("Error storing screenshot:", error)
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to store screenshot: ${errorMessage}`)
  }
}

export async function getAnalysisHistory(): Promise<AnalysisRecord[]> {
  // In a real app, you'd fetch from a database
  return analysisHistory
}

export async function deleteAnalysisRecord(id: string): Promise<void> {
  try {
    // Find the record
    const record = analysisHistory.find((r) => r.id === id)
    if (!record) {
      throw new Error("Record not found")
    }

    // Only attempt to delete from Blob if it's a Blob URL
    if (record.imageUrl.includes("blob.vercel.app")) {
      try {
        // Extract the path from the URL
        const url = new URL(record.imageUrl)
        const path = url.pathname.substring(1) // Remove leading slash

        // Delete from Blob storage
        await del(path)
      } catch (e) {
        console.warn("Could not delete from Blob storage:", e)
        // Continue with removing from history even if Blob deletion fails
      }
    }

    // Remove from history
    analysisHistory = analysisHistory.filter((r) => r.id !== id)
  } catch (error) {
    console.error("Error deleting analysis record:", error)
    throw new Error("Failed to delete analysis record")
  }
}
