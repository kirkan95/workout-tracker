"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWeeklyPlan = void 0;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const ai_1 = require("./ai");
const promptAssembler_1 = require("./promptAssembler");
admin.initializeApp();
const db = admin.firestore();
const geminiApiKey = (0, params_1.defineSecret)('GEMINI_API_KEY');
// ── Helpers ──────────────────────────────────────────────────────────────────
function getWeekStartDate(startDay) {
    const today = new Date();
    const diff = (today.getDay() - startDay + 7) % 7;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - diff);
    return weekStart.toISOString().split('T')[0];
}
function computeSettingsHash(settings) {
    const key = JSON.stringify([
        settings.goal,
        [...settings.equipment].sort(),
        [...settings.exclusions].sort(),
    ]);
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
}
function transformAIResponse(raw, weekStartDate, settingsHash) {
    var _a, _b;
    const schedule = {};
    for (const day of raw.schedule) {
        const plan = { type: day.type };
        if ((_a = day.exercises) === null || _a === void 0 ? void 0 : _a.length) {
            plan.exercises = {};
            for (const ex of day.exercises) {
                plan.exercises[ex.id] = {
                    sets: ex.sets,
                    repRange: ex.repRange,
                    weight: (_b = ex.weight) !== null && _b !== void 0 ? _b : null,
                };
            }
        }
        if (day.cardioDuration)
            plan.cardioDuration = day.cardioDuration;
        if (day.cardioEffort)
            plan.cardioEffort = day.cardioEffort;
        schedule[day.date] = plan;
    }
    return {
        weekStartDate,
        settingsHash,
        status: 'ok',
        durationConflict: raw.durationConflict,
        schedule,
    };
}
async function logTokenUsage(uid, inputTokens, outputTokens) {
    const userIdHash = crypto.createHash('sha256').update(uid).digest('hex').slice(0, 12);
    await db.collection('admin').doc('tokenLog').collection('entries').add({
        model: ai_1.AI_CONFIG.model,
        inputTokens,
        outputTokens,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userIdHash,
    });
}
// ── Cloud Function ───────────────────────────────────────────────────────────
exports.generateWeeklyPlan = (0, https_1.onCall)({ secrets: [geminiApiKey] }, async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in');
    // Load settings
    const settingsSnap = await db.doc(`users/${uid}/config/settings`).get();
    if (!settingsSnap.exists)
        throw new https_1.HttpsError('not-found', 'Settings not configured');
    const settings = settingsSnap.data();
    const weekStartDate = getWeekStartDate(settings.startDay);
    const settingsHash = computeSettingsHash(settings);
    // Return cached plan if settings unchanged
    const planRef = db.doc(`users/${uid}/plans/${weekStartDate}`);
    const existingSnap = await planRef.get();
    if (existingSnap.exists) {
        const existing = existingSnap.data();
        if (existing.settingsHash === settingsHash && existing.status === 'ok') {
            return existing;
        }
    }
    // Load recent sessions
    const sessionsSnap = await db
        .collection(`users/${uid}/sessions`)
        .orderBy('date', 'desc')
        .limit(28)
        .get();
    const sessions = sessionsSnap.docs.map((d) => d.data());
    const lastCompleted = sessions.find((s) => s.completed);
    const lastSessionDate = (_b = lastCompleted === null || lastCompleted === void 0 ? void 0 : lastCompleted.date) !== null && _b !== void 0 ? _b : null;
    const prompt = (0, promptAssembler_1.assemblePrompt)(settings, sessions, weekStartDate, lastSessionDate);
    try {
        const { text, inputTokens, outputTokens } = await (0, ai_1.callAI)(prompt, geminiApiKey.value());
        const raw = JSON.parse(text);
        const plan = transformAIResponse(raw, weekStartDate, settingsHash);
        await planRef.set(plan);
        await logTokenUsage(uid, inputTokens, outputTokens);
        return plan;
    }
    catch (e) {
        console.error('Plan generation error:', e);
        await planRef.set({ weekStartDate, settingsHash, status: 'error', schedule: {} });
        throw new https_1.HttpsError('internal', 'Plan generation failed');
    }
});
//# sourceMappingURL=index.js.map