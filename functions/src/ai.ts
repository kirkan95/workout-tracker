import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

export const AI_CONFIG = { provider: 'gemini', model: 'gemini-2.5-flash' } as const

// All model-specific code lives here — swapping providers = changing this file only.
function makeClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: AI_CONFIG.model,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          schedule: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                date:     { type: SchemaType.STRING },
                type:     { type: SchemaType.STRING },
                exercises: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      id:       { type: SchemaType.STRING },
                      sets:     { type: SchemaType.INTEGER },
                      repRange: { type: SchemaType.STRING },
                      weight:   { type: SchemaType.NUMBER },
                    },
                    required: ['id', 'sets', 'repRange'],
                  },
                },
                cardioDuration: { type: SchemaType.INTEGER },
                cardioEffort:   { type: SchemaType.STRING },
                note:           { type: SchemaType.STRING },
              },
              required: ['date', 'type'],
            },
          },
          durationConflict: { type: SchemaType.BOOLEAN },
        },
        required: ['schedule', 'durationConflict'],
      },
    },
  })
}

export interface AIResult {
  text: string
  inputTokens: number
  outputTokens: number
}

export async function callAI(prompt: string, apiKey: string): Promise<AIResult> {
  const model = makeClient(apiKey)
  const result = await model.generateContent(prompt)
  const response = result.response
  const usage = response.usageMetadata
  return {
    text: response.text(),
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
  }
}
