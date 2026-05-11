"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressHistory = compressHistory;
const FEEL = { easy: 'e', medium: 'm', hard: 'h' };
function compressSession(s) {
    const parts = [`${s.workoutId} ${s.date}:`];
    if (s.exercises) {
        for (const [id, log] of Object.entries(s.exercises)) {
            const sets = log.sets
                .map(({ weight, reps, feel }) => `${weight !== null && weight !== void 0 ? weight : 0}x${reps !== null && reps !== void 0 ? reps : 0}${feel ? FEEL[feel] : ''}`)
                .join(',');
            parts.push(`${id} ${log.sets.length}x[${sets}]`);
        }
    }
    if (s.cardio) {
        const effort = s.cardio.feel ? FEEL[s.cardio.feel] : '';
        parts.push(`cardio ${s.cardio.duration}min${effort}`);
    }
    return parts.join(' ');
}
function compressHistory(sessions) {
    return sessions
        .filter((s) => s.completed)
        .map(compressSession)
        .join('\n');
}
//# sourceMappingURL=compressHistory.js.map