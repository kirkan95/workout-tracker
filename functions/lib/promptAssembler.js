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
exports.assemblePrompt = assemblePrompt;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const compressHistory_1 = require("./compressHistory");
// Loaded once at cold start — path resolves from functions/lib/ → functions/trainer/
const TRAINER_CORE = fs.readFileSync(path.join(__dirname, '../trainer/TRAINER.md'), 'utf8');
const TRAINER_PPL = fs.readFileSync(path.join(__dirname, '../trainer/TRAINER_PPL.md'), 'utf8');
const TRAINER_FULLBODY = fs.readFileSync(path.join(__dirname, '../trainer/TRAINER_FULLBODY.md'), 'utf8');
const TRAINER_CARDIO = fs.readFileSync(path.join(__dirname, '../trainer/TRAINER_CARDIO.md'), 'utf8');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function assemblePrompt(settings, sessions, weekStartDate, lastSessionDate) {
    const isPPL = settings.goal === 'stronger' || settings.goal === 'muscle';
    const msStart = new Date(settings.mesocycleStart);
    const wkStart = new Date(weekStartDate);
    const weekNum = Math.max(1, Math.floor((wkStart.getTime() - msStart.getTime()) / (7 * 86400000)) + 1);
    const sections = [TRAINER_CORE];
    sections.push(isPPL ? TRAINER_PPL : TRAINER_FULLBODY);
    sections.push(TRAINER_CARDIO);
    const history = (0, compressHistory_1.compressHistory)(sessions);
    if (history) {
        sections.push(`## Session History (last 28 days)\n\n${history}`);
    }
    if (lastSessionDate) {
        sections.push(`## Last Completed Session\n\n${lastSessionDate}`);
    }
    const restDayNames = settings.restDays.map((d) => DAYS[d]).join(', ');
    const equipmentList = settings.equipment.length
        ? settings.equipment.join(', ')
        : 'bodyweight only';
    sections.push(`## User Settings

Goal: ${settings.goal}
Equipment: ${equipmentList}
Exclusions: ${settings.exclusions.join(', ') || 'none'}
Workout duration: ${settings.workoutDuration} minutes
Week starts: ${DAYS[settings.startDay]}
Rest days: ${restDayNames}
Mesocycle week: ${weekNum}`);
    sections.push(`## Task

Generate the weekly training plan for the 7 days starting ${weekStartDate}.

For each day, output:
- date (ISO string, e.g. "${weekStartDate}")
- type: one of push / pull / legs / fullbody / cardio / rest
- exercises (array, strength days only): exercise id, sets, repRange (e.g. "8-12"), weight in lbs (null if bodyweight)
- cardioDuration (integer minutes, cardio days only)
- cardioEffort (easy / medium / hard, cardio days only)

Apply all trainer rules above, including return-from-break adjustments if the last session date indicates a gap.`);
    return sections.join('\n\n---\n\n');
}
//# sourceMappingURL=promptAssembler.js.map