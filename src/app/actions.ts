"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { storeScreenshot } from "@/lib/storage"
import type { AnalysisRecord } from "@/types"

export async function analyzeScreenshot(file: File): Promise<AnalysisRecord> {
  // Always use "food" as the analysis type
  const analysisType = "food";
  try {
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create prompt for food analysis
    const prompt = `
    Analyze the food in this image and provide ONLY the following information in a concise format:
    1. What is this dish/food? (1-2 sentence description)
    2. Approximate weight (in grams)
    3. Total calories count

    Keep your response brief and to-the-point, without additional information.
    `

    console.log(`Starting ${analysisType} analysis with model: gpt-4o`)

    // Generate analysis using OpenAI's vision capabilities with gpt-4o model
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              image: buffer,
            },
          ],
        },
      ],
    })

    console.log("Analysis completed successfully, storing result")

    // Store the screenshot and analysis
    const record = await storeScreenshot(file, analysisType, text)

    return record
  } catch (error) {
    console.error("Error analyzing screenshot:", error)
    throw new Error(`Failed to analyze screenshot: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Re-export the functions with async wrappers
import { getAnalysisHistory as getHistory, deleteAnalysisRecord as deleteRecord } from "@/lib/storage"

export async function getAnalysisHistory() {
  return await getHistory()
}

export async function deleteAnalysisRecord(id: string) {
  return await deleteRecord(id)
}