import { EXERCISES, LibraryExercise } from '../data/exercises'
import { UserSettings } from '../types'

// Deterministic exercise swap: alternatives share the same movement pattern
// and at least one target muscle, filtered by the user's actual equipment
// and exclusions — no AI call needed. See UPGRADE.md §2.3.
export function findAlternatives(exerciseId: string, settings: UserSettings): LibraryExercise[] {
  const current = EXERCISES.find((e) => e.id === exerciseId)
  if (!current) return []

  return EXERCISES.filter((e) => {
    if (e.id === exerciseId) return false
    if (e.movement !== current.movement) return false
    if (!e.muscles.some((m) => current.muscles.includes(m))) return false
    const hasEquipment = e.equipment.some((eq) => eq === 'bodyweight' || settings.equipment.includes(eq))
    if (!hasEquipment) return false
    if (settings.exclusions.includes(e.movement)) return false
    if (settings.exclusions.includes('overhead') && e.overhead) return false
    if (settings.exclusions.includes('highImpact') && e.highImpact) return false
    if (settings.exclusions.includes('singleLeg') && e.singleLeg) return false
    return true
  })
}
