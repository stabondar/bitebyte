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
    let prompt = ""

    switch (analysisType) {
      case "food":
        prompt = `
        Analyze the food in this image and provide the following information:
        1. Identify all food items visible in the image
        2. Estimate the total calories for the entire meal
        3. Break down calories by each food item
        4. Estimate macronutrients (protein, carbs, fat) when possible
        5. Note any potential allergens present
        6. Suggest healthier alternatives if applicable

        Format your response in a clear, easy-to-read structure.
        `
        break
      case "ui":
        prompt = "Focus on UI/UX elements, design patterns, and potential improvements to the interface."
        break
      case "security":
        prompt = "Look for potential security issues, sensitive information displayed, or privacy concerns."
        break
      case "accessibility":
        prompt =
          "Evaluate accessibility features, potential barriers, and suggest improvements for users with disabilities."
        break
      default:
        prompt =
          "Describe what you see, identify any food items, and provide any relevant nutritional insights."
    }

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