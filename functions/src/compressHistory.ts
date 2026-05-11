interface SetData {
  weight: number | null
  reps: number | null
  feel?: 'easy' | 'medium' | 'hard'
}

interface Session {
  date: string
  workoutId: string
  completed: boolean
  exercises?: Record<string, { sets: SetData[] }>
  cardio?: { duration: number; feel?: 'easy' | 'medium' | 'hard' }
}

const FEEL: Record<string, string> = { easy: 'e', medium: 'm', hard: 'h' }

function compressSession(s: Session): string {
  const parts: string[] = [`${s.workoutId} ${s.date}:`]

  if (s.exercises) {
    for (const [id, log] of Object.entries(s.exercises)) {
      const sets = log.sets
        .map(({ weight, reps, feel }) =>
          `${weight ?? 0}x${reps ?? 0}${feel ? FEEL[feel] : ''}`)
        .join(',')
      parts.push(`${id} ${log.sets.length}x[${sets}]`)
    }
  }

  if (s.cardio) {
    const effort = s.cardio.feel ? FEEL[s.cardio.feel] : ''
    parts.push(`cardio ${s.cardio.duration}min${effort}`)
  }

  return parts.join(' ')
}

export function compressHistory(sessions: Session[]): string {
  return sessions
    .filter((s) => s.completed)
    .map(compressSession)
    .join('\n')
}
