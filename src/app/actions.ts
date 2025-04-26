"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { storeScreenshot } from "@/lib/storage"
import type { AnalysisRecord } from "@/types"

export async function analyzeScreenshot(file: File, analysisType = "food"): Promise<AnalysisRecord> {
  try {
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create prompt based on analysis type
    let prompt = "Analyze the following screenshot and count the calories based on the visible food items. "

    switch (analysisType) {
      case "ui":
        prompt += "Focus on UI/UX elements, design patterns, and potential improvements to the interface."
        break
      case "security":
        prompt += "Look for potential security issues, sensitive information displayed, or privacy concerns."
        break
      case "accessibility":
        prompt +=
          "Evaluate accessibility features, potential barriers, and suggest improvements for users with disabilities."
        break
      default:
        prompt +=
          "Describe what you see, identify any apps, UI elements, and provide any relevant insights about what the user might be doing."
    }

    console.log("Starting analysis with model: gpt-4o")

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
