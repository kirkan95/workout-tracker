"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_CONFIG = void 0;
exports.callAI = callAI;
const generative_ai_1 = require("@google/generative-ai");
exports.AI_CONFIG = { provider: 'gemini', model: 'gemini-2.5-flash' };
// All model-specific code lives here — swapping providers = changing this file only.
function makeClient(apiKey) {
    return new generative_ai_1.GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: exports.AI_CONFIG.model,
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: generative_ai_1.SchemaType.OBJECT,
                properties: {
                    schedule: {
                        type: generative_ai_1.SchemaType.ARRAY,
                        items: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: {
                                date: { type: generative_ai_1.SchemaType.STRING },
                                type: { type: generative_ai_1.SchemaType.STRING },
                                exercises: {
                                    type: generative_ai_1.SchemaType.ARRAY,
                                    items: {
                                        type: generative_ai_1.SchemaType.OBJECT,
                                        properties: {
                                            id: { type: generative_ai_1.SchemaType.STRING },
                                            sets: { type: generative_ai_1.SchemaType.INTEGER },
                                            repRange: { type: generative_ai_1.SchemaType.STRING },
                                            weight: { type: generative_ai_1.SchemaType.NUMBER },
                                        },
                                        required: ['id', 'sets', 'repRange'],
                                    },
                                },
                                cardioDuration: { type: generative_ai_1.SchemaType.INTEGER },
                                cardioEffort: { type: generative_ai_1.SchemaType.STRING },
                            },
                            required: ['date', 'type'],
                        },
                    },
                    durationConflict: { type: generative_ai_1.SchemaType.BOOLEAN },
                },
                required: ['schedule', 'durationConflict'],
            },
        },
    });
}
async function callAI(prompt, apiKey) {
    var _a, _b;
    const model = makeClient(apiKey);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const usage = response.usageMetadata;
    return {
        text: response.text(),
        inputTokens: (_a = usage === null || usage === void 0 ? void 0 : usage.promptTokenCount) !== null && _a !== void 0 ? _a : 0,
        outputTokens: (_b = usage === null || usage === void 0 ? void 0 : usage.candidatesTokenCount) !== null && _b !== void 0 ? _b : 0,
    };
}
//# sourceMappingURL=ai.js.map