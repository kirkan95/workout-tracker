export type Equipment =
  | 'bodyweight'
  | 'dumbbells'
  | 'pullupbar'
  | 'dipstation'
  | 'resistancebands'
  | 'barbell'
  | 'bench'
  | 'cables'
  | 'kettlebell'

export type Movement = 'squat' | 'hinge' | 'push' | 'pull' | 'core' | 'carry' | 'isolation'
export type PplDay = 'push' | 'pull' | 'legs'
export type TrainingStyle = 'ppl' | 'fullbody' | 'both'

export interface LibraryExercise {
  id: string
  name: string
  description: string
  muscles: string[]
  style: TrainingStyle
  day?: PplDay
  movement: Movement
  equipment: Equipment[]
  compound: boolean
  defaultSets: number
  repRange: [number, number] | 'max' | 'time'
  usesWeight: boolean
  note?: string
  overhead?: boolean
  highImpact?: boolean
  singleLeg?: boolean
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

export const EXERCISES: LibraryExercise[] = [

  // ─── PUSH ──────────────────────────────────────────────────────────────────

  {
    id: 'db_chest_press', name: 'Dumbbell Chest Press',
    description: 'Lie on your back and press dumbbells up from chest height. Keep elbows at 45° and lower until they reach chest level.',
    muscles: ['chest', 'triceps', 'front delts'], style: 'both', day: 'push', movement: 'push',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true,
  },
  {
    id: 'db_incline_press', name: 'Dumbbell Incline Press',
    description: 'Set a bench to 30–45° and press dumbbells up from upper chest. Targets the upper chest more than flat pressing.',
    muscles: ['upper chest', 'triceps', 'front delts'], style: 'ppl', day: 'push', movement: 'push',
    equipment: ['dumbbells', 'bench'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true,
  },
  {
    id: 'db_flyes', name: 'Dumbbell Flyes',
    description: 'Lie flat and lower dumbbells in a wide arc to chest height. Stretches and squeezes the chest through a long range of motion.',
    muscles: ['chest', 'front delts'], style: 'ppl', day: 'push', movement: 'isolation',
    equipment: ['dumbbells'], compound: false, defaultSets: 3, repRange: [10, 15], usesWeight: true,
  },
  {
    id: 'pushups', name: 'Push-ups',
    description: 'Press your bodyweight up from the floor with hands shoulder-width apart. Keep your body in a straight line from head to heels.',
    muscles: ['chest', 'triceps', 'front delts'], style: 'both', day: 'push', movement: 'push',
    equipment: ['bodyweight'], compound: true, defaultSets: 3, repRange: 'max', usesWeight: false,
  },
  {
    id: 'diamond_pushups', name: 'Diamond Push-ups',
    description: 'Push-ups with hands close together forming a diamond shape under your chest. Shifts emphasis from chest to triceps.',
    muscles: ['triceps', 'chest'], style: 'ppl', day: 'push', movement: 'push',
    equipment: ['bodyweight'], compound: true, defaultSets: 3, repRange: 'max', usesWeight: false,
  },
  {
    id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press',
    description: 'Press dumbbells overhead from shoulder height. Builds the front and side of the shoulder with a natural wrist path.',
    muscles: ['front delts', 'side delts', 'triceps'], style: 'both', day: 'push', movement: 'push',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true, overhead: true,
  },
  {
    id: 'arnold_press', name: 'Arnold Press',
    description: 'Start with palms facing you at chin height and rotate outward as you press overhead. Hits all three heads of the shoulder through a longer range of motion.',
    muscles: ['front delts', 'side delts', 'triceps'], style: 'ppl', day: 'push', movement: 'push',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true, overhead: true,
  },
  {
    id: 'lateral_raises', name: 'Lateral Raises',
    description: 'Raise dumbbells out to your sides until arms are parallel with the floor. Isolates the side deltoid for shoulder width.',
    muscles: ['side delts'], style: 'ppl', day: 'push', movement: 'isolation',
    equipment: ['dumbbells'], compound: false, defaultSets: 3, repRange: [12, 16], usesWeight: true,
  },
  {
    id: 'front_raises', name: 'Front Raises',
    description: 'Raise dumbbells straight in front of you to shoulder height with a slight elbow bend. Targets the front of the shoulder.',
    muscles: ['front delts'], style: 'ppl', day: 'push', movement: 'isolation',
    equipment: ['dumbbells'], compound: false, defaultSets: 3, repRange: [10, 15], usesWeight: true,
  },
  {
    id: 'overhead_tricep_ext', name: 'Overhead Tricep Extension',
    description: 'Hold a dumbbell overhead with both hands and lower it behind your head by bending the elbows. Stretches the long head of the tricep fully.',
    muscles: ['triceps'], style: 'ppl', day: 'push', movement: 'isolation',
    equipment: ['dumbbells'], compound: false, defaultSets: 3, repRange: [10, 15], usesWeight: true, overhead: true,
  },
  {
    id: 'tricep_dips', name: 'Tricep Dips',
    description: 'Support your bodyweight on parallel bars and lower yourself by bending the elbows. A heavy compound movement for triceps and lower chest.',
    muscles: ['triceps', 'chest', 'front delts'], style: 'both', day: 'push', movement: 'push',
    equipment: ['dipstation'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: false,
  },
  {
    id: 'skull_crushers', name: 'Skull Crushers',
    description: 'Lie on a bench and lower dumbbells toward your forehead by bending at the elbows only. Directly targets the triceps through a full range of motion.',
    muscles: ['triceps'], style: 'ppl', day: 'push', movement: 'isolation',
    equipment: ['dumbbells', 'bench'], compound: false, defaultSets: 3, repRange: [10, 14], usesWeight: true,
  },
  {
    id: 'barbell_bench', name: 'Barbell Bench Press',
    description: 'Press a barbell from chest level to full arm extension. The foundational chest compound for building pressing strength.',
    muscles: ['chest', 'triceps', 'front delts'], style: 'ppl', day: 'push', movement: 'push',
    equipment: ['barbell', 'bench'], compound: true, defaultSets: 4, repRange: [5, 8], usesWeight: true,
  },
  {
    id: 'barbell_ohp', name: 'Barbell Overhead Press',
    description: 'Press a barbell from shoulder height to fully overhead. The foundational compound for building total shoulder strength.',
    muscles: ['front delts', 'side delts', 'triceps'], style: 'ppl', day: 'push', movement: 'push',
    equipment: ['barbell'], compound: true, defaultSets: 4, repRange: [5, 8], usesWeight: true, overhead: true,
  },
  {
    id: 'cable_pushdown', name: 'Cable Tricep Pushdown',
    description: 'Push a cable attachment down by fully extending the elbows. Isolates the triceps with constant tension throughout the movement.',
    muscles: ['triceps'], style: 'ppl', day: 'push', movement: 'isolation',
    equipment: ['cables'], compound: false, defaultSets: 3, repRange: [12, 16], usesWeight: true,
  },
  {
    id: 'band_tricep_pushdown', name: 'Band Tricep Pushdown',
    description: 'Anchor a resistance band overhead and push it down by extending the elbows. Portable tricep isolation with constant tension.',
    muscles: ['triceps'], style: 'ppl', day: 'push', movement: 'isolation',
    equipment: ['resistancebands'], compound: false, defaultSets: 3, repRange: [12, 16], usesWeight: false,
  },

  // ─── PULL ──────────────────────────────────────────────────────────────────

  {
    id: 'pullups', name: 'Pull-ups',
    description: 'Hang from a bar with palms facing away and pull your chin above it. One of the best compound movements for back width and overall upper body strength.',
    muscles: ['lats', 'biceps', 'rear delts'], style: 'both', day: 'pull', movement: 'pull',
    equipment: ['pullupbar'], compound: true, defaultSets: 3, repRange: 'max', usesWeight: false,
  },
  {
    id: 'chinups', name: 'Chin-ups',
    description: 'Hang from a bar with palms facing you and pull your chin above it. Places more emphasis on the biceps than standard pull-ups.',
    muscles: ['biceps', 'lats'], style: 'ppl', day: 'pull', movement: 'pull',
    equipment: ['pullupbar'], compound: true, defaultSets: 3, repRange: 'max', usesWeight: false,
  },
  {
    id: 'inverted_rows', name: 'Inverted Rows',
    description: 'Lie under a low bar and pull your chest up to it with a straight body. A horizontal pulling movement that builds upper back thickness.',
    muscles: ['lats', 'rear delts', 'biceps'], style: 'ppl', day: 'pull', movement: 'pull',
    equipment: ['pullupbar'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: false,
  },
  {
    id: 'db_bent_row', name: 'Dumbbell Bent-Over Row',
    description: 'Hinge forward at the hips and row a dumbbell to your hip. One of the best movements for building lat and upper back thickness.',
    muscles: ['lats', 'rear delts', 'biceps'], style: 'both', day: 'pull', movement: 'pull',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true, note: 'each side',
  },
  {
    id: 'db_single_arm_row', name: 'Single-Arm Dumbbell Row',
    description: 'Brace one hand on a bench and row a dumbbell to your hip. Allows heavier loading with better range of motion than two-arm rows.',
    muscles: ['lats', 'rear delts', 'biceps'], style: 'ppl', day: 'pull', movement: 'pull',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true, note: 'each side',
  },
  {
    id: 'db_shrugs', name: 'Dumbbell Shrugs',
    description: 'Hold dumbbells at your sides and shrug your shoulders straight up toward your ears. Isolates the traps for neck and upper back thickness.',
    muscles: ['traps'], style: 'ppl', day: 'pull', movement: 'isolation',
    equipment: ['dumbbells'], compound: false, defaultSets: 3, repRange: [12, 15], usesWeight: true,
  },
  {
    id: 'face_pulls_cable', name: 'Face Pulls',
    description: 'Pull a cable rope to your face with elbows high and wide, finishing with hands beside your ears. Builds rear deltoids and keeps shoulders healthy.',
    muscles: ['rear delts', 'traps', 'rotator cuff'], style: 'ppl', day: 'pull', movement: 'pull',
    equipment: ['cables'], compound: false, defaultSets: 3, repRange: [12, 16], usesWeight: true,
  },
  {
    id: 'face_pulls_band', name: 'Band Face Pulls',
    description: 'Anchor a band at face height and pull it to your face with elbows high and wide. Builds rear deltoids and shoulder health with no cable machine needed.',
    muscles: ['rear delts', 'traps', 'rotator cuff'], style: 'ppl', day: 'pull', movement: 'pull',
    equipment: ['resistancebands'], compound: false, defaultSets: 3, repRange: [12, 16], usesWeight: false,
  },
  {
    id: 'rear_delt_flyes', name: 'Rear Delt Flyes',
    description: 'Hinge forward at the hips and raise dumbbells out to your sides. Directly targets the rear deltoids for balanced shoulder development.',
    muscles: ['rear delts', 'traps'], style: 'ppl', day: 'pull', movement: 'isolation',
    equipment: ['dumbbells'], compound: false, defaultSets: 3, repRange: [12, 16], usesWeight: true,
  },
  {
    id: 'barbell_row', name: 'Barbell Bent-Over Row',
    description: 'Hinge forward and pull a barbell to your lower chest or stomach. A heavy compound movement for building total back thickness.',
    muscles: ['lats', 'rear delts', 'biceps', 'traps'], style: 'ppl', day: 'pull', movement: 'pull',
    equipment: ['barbell'], compound: true, defaultSets: 4, repRange: [5, 8], usesWeight: true,
  },
  {
    id: 'lat_pulldown', name: 'Lat Pulldown',
    description: 'Pull a cable bar from overhead down to your upper chest. Builds lat width and mimics the pull-up pattern for those building toward their first pull-up.',
    muscles: ['lats', 'biceps'], style: 'ppl', day: 'pull', movement: 'pull',
    equipment: ['cables'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true,
  },
  {
    id: 'seated_cable_row', name: 'Seated Cable Row',
    description: 'Sit upright and pull a cable handle to your stomach. Builds mid-back thickness with constant tension through the full range of motion.',
    muscles: ['lats', 'rear delts', 'biceps'], style: 'ppl', day: 'pull', movement: 'pull',
    equipment: ['cables'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true,
  },
  {
    id: 'hammer_curls', name: 'Hammer Curls',
    description: 'Curl dumbbells with a neutral grip, palms facing each other throughout. Builds the brachialis and forearm alongside the bicep for arm thickness.',
    muscles: ['biceps', 'brachialis'], style: 'ppl', day: 'pull', movement: 'isolation',
    equipment: ['dumbbells'], compound: false, defaultSets: 3, repRange: [10, 14], usesWeight: true,
  },
  {
    id: 'db_bicep_curls', name: 'Dumbbell Bicep Curls',
    description: 'Curl dumbbells from your sides to your shoulders with palms facing up. The foundational bicep isolation movement.',
    muscles: ['biceps'], style: 'ppl', day: 'pull', movement: 'isolation',
    equipment: ['dumbbells'], compound: false, defaultSets: 3, repRange: [10, 14], usesWeight: true,
  },
  {
    id: 'barbell_curls', name: 'Barbell Curls',
    description: 'Curl a barbell from your thighs to your shoulders. Allows heavier loading than dumbbell curls for maximum bicep strength development.',
    muscles: ['biceps'], style: 'ppl', day: 'pull', movement: 'isolation',
    equipment: ['barbell'], compound: false, defaultSets: 3, repRange: [8, 12], usesWeight: true,
  },
  {
    id: 'band_row', name: 'Resistance Band Row',
    description: 'Anchor a band at waist height and row it to your stomach. Builds the mid-back and lats with portable constant tension.',
    muscles: ['lats', 'rear delts', 'biceps'], style: 'ppl', day: 'pull', movement: 'pull',
    equipment: ['resistancebands'], compound: true, defaultSets: 3, repRange: [12, 15], usesWeight: false,
  },

  // ─── LEGS ──────────────────────────────────────────────────────────────────

  {
    id: 'goblet_squat', name: 'Goblet Squat',
    description: 'Hold a dumbbell at your chest and squat to full depth. Naturally keeps your torso upright — a great starting squat pattern for all levels.',
    muscles: ['quads', 'glutes', 'core'], style: 'both', day: 'legs', movement: 'squat',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [10, 15], usesWeight: true,
  },
  {
    id: 'barbell_squat', name: 'Barbell Back Squat',
    description: 'Place a barbell on your upper back and squat to depth. The foundational lower body compound for building leg and glute strength.',
    muscles: ['quads', 'glutes', 'hamstrings', 'core'], style: 'ppl', day: 'legs', movement: 'squat',
    equipment: ['barbell'], compound: true, defaultSets: 4, repRange: [5, 8], usesWeight: true,
  },
  {
    id: 'bulgarian_split', name: 'Bulgarian Split Squat',
    description: 'Place your rear foot on a bench and squat on the front leg. One of the most effective single-leg exercises for quad and glute development.',
    muscles: ['quads', 'glutes', 'hamstrings'], style: 'ppl', day: 'legs', movement: 'squat',
    equipment: ['dumbbells', 'bench'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true, note: 'each side', singleLeg: true, difficulty: 'intermediate',
  },
  {
    id: 'rdl', name: 'Romanian Deadlift',
    description: 'Hold dumbbells and hinge at the hips with a slight knee bend, lowering weights to mid-shin. The best movement for targeting the hamstrings and glutes.',
    muscles: ['hamstrings', 'glutes', 'lower back'], style: 'both', day: 'legs', movement: 'hinge',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true,
  },
  {
    id: 'barbell_rdl', name: 'Barbell Romanian Deadlift',
    description: 'Hold a barbell and hinge at the hips with a slight knee bend. Allows heavier loading than dumbbell RDL for maximum hamstring and glute development.',
    muscles: ['hamstrings', 'glutes', 'lower back'], style: 'ppl', day: 'legs', movement: 'hinge',
    equipment: ['barbell'], compound: true, defaultSets: 4, repRange: [5, 8], usesWeight: true,
  },
  {
    id: 'barbell_deadlift', name: 'Barbell Deadlift',
    description: 'Pull a barbell from the floor to a full standing position. The most total-body compound movement — loads nearly every muscle in the posterior chain.',
    muscles: ['hamstrings', 'glutes', 'lower back', 'traps', 'lats'], style: 'ppl', day: 'legs', movement: 'hinge',
    equipment: ['barbell'], compound: true, defaultSets: 3, repRange: [4, 6], usesWeight: true, difficulty: 'intermediate',
  },
  {
    id: 'rev_lunges', name: 'Reverse Lunges',
    description: 'Step backward into a lunge and return to standing. Easier on the knees than forward lunges while effectively targeting quads and glutes.',
    muscles: ['quads', 'glutes', 'hamstrings'], style: 'both', day: 'legs', movement: 'squat',
    equipment: ['bodyweight'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: false, note: 'each side', singleLeg: true,
  },
  {
    id: 'db_lunges', name: 'Dumbbell Walking Lunges',
    description: 'Hold dumbbells and take alternating forward steps into a lunge. Builds quad and glute strength while challenging balance and coordination.',
    muscles: ['quads', 'glutes', 'hamstrings'], style: 'ppl', day: 'legs', movement: 'squat',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true, note: 'each side', singleLeg: true,
  },
  {
    id: 'step_ups', name: 'Step-ups',
    description: 'Step onto an elevated surface one leg at a time and stand tall at the top. Builds single-leg quad and glute strength with low joint stress.',
    muscles: ['quads', 'glutes'], style: 'ppl', day: 'legs', movement: 'squat',
    equipment: ['dumbbells', 'bench'], compound: true, defaultSets: 3, repRange: [10, 12], usesWeight: true, note: 'each side', singleLeg: true,
  },
  {
    id: 'sumo_squat', name: 'Sumo Squat',
    description: 'Take a wide stance with toes turned out and squat holding a dumbbell. Emphasizes the inner thighs and glutes more than a standard squat.',
    muscles: ['quads', 'glutes', 'inner thighs'], style: 'ppl', day: 'legs', movement: 'squat',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [10, 15], usesWeight: true,
  },
  {
    id: 'hip_thrusts', name: 'Hip Thrusts',
    description: 'Rest your upper back on a bench and drive your hips upward against a dumbbell. The most direct and effective glute exercise available.',
    muscles: ['glutes', 'hamstrings'], style: 'ppl', day: 'legs', movement: 'hinge',
    equipment: ['dumbbells', 'bench'], compound: true, defaultSets: 3, repRange: [10, 15], usesWeight: true,
  },
  {
    id: 'glute_bridges', name: 'Glute Bridges',
    description: 'Lie on your back with knees bent and drive your hips toward the ceiling. A beginner-friendly glute exercise requiring no equipment.',
    muscles: ['glutes', 'hamstrings'], style: 'both', day: 'legs', movement: 'hinge',
    equipment: ['bodyweight'], compound: true, defaultSets: 3, repRange: [12, 15], usesWeight: false,
  },
  {
    id: 'kb_deadlift', name: 'Kettlebell Deadlift',
    description: 'Grip a kettlebell between your feet and stand up tall with a flat back. Teaches the hip hinge pattern and builds posterior chain strength.',
    muscles: ['hamstrings', 'glutes', 'lower back'], style: 'both', day: 'legs', movement: 'hinge',
    equipment: ['kettlebell'], compound: true, defaultSets: 3, repRange: [10, 12], usesWeight: true,
  },
  {
    id: 'calf_raises', name: 'Single-Leg Calf Raises',
    description: 'Stand on one foot and rise up onto your toes slowly, then lower fully. Isolates the calf muscle through a complete range of motion.',
    muscles: ['calves'], style: 'ppl', day: 'legs', movement: 'isolation',
    equipment: ['bodyweight'], compound: false, defaultSets: 3, repRange: [12, 20], usesWeight: false, note: 'each side', singleLeg: true,
  },
  {
    id: 'plank', name: 'Plank',
    description: 'Hold a forearm push-up position with a rigid, straight body. Builds deep core stability and teaches full-body bracing.',
    muscles: ['core', 'shoulders'], style: 'both', day: 'legs', movement: 'core',
    equipment: ['bodyweight'], compound: false, defaultSets: 2, repRange: 'time', usesWeight: false,
  },
  {
    id: 'dead_bug', name: 'Dead Bug',
    description: 'Lie on your back and extend opposite arm and leg while pressing your lower back flat to the floor. Builds deep core stability through controlled movement.',
    muscles: ['core'], style: 'ppl', day: 'legs', movement: 'core',
    equipment: ['bodyweight'], compound: false, defaultSets: 3, repRange: [8, 10], usesWeight: false, note: 'each side',
  },
  {
    id: 'hanging_knee_raises', name: 'Hanging Knee Raises',
    description: 'Hang from a bar and draw your knees to your chest. Challenges the core and hip flexors under load with no floor contact.',
    muscles: ['core', 'hip flexors'], style: 'ppl', day: 'legs', movement: 'core',
    equipment: ['pullupbar'], compound: false, defaultSets: 3, repRange: [10, 15], usesWeight: false,
  },
  {
    id: 'leg_raises', name: 'Leg Raises',
    description: 'Lie on your back and raise straight legs from the floor to 90°. Targets the lower abs and hip flexors with no equipment.',
    muscles: ['core', 'hip flexors'], style: 'both', day: 'legs', movement: 'core',
    equipment: ['bodyweight'], compound: false, defaultSets: 3, repRange: [10, 15], usesWeight: false,
  },
  {
    id: 'russian_twists', name: 'Russian Twists',
    description: 'Sit with feet raised and rotate your torso side to side. Targets the obliques and builds rotational core strength.',
    muscles: ['obliques', 'core'], style: 'ppl', day: 'legs', movement: 'core',
    equipment: ['bodyweight'], compound: false, defaultSets: 3, repRange: [16, 20], usesWeight: false, note: 'total reps',
  },

  // ─── FULL BODY ──────────────────────────────────────────────────────────────
  // Used by: Lose Weight (fullbody + 'both' compounds)
  // Stay Fit draws only from 'both' compounds above

  {
    id: 'burpees', name: 'Burpees',
    description: 'Drop to a push-up, jump your feet back in, and explode upward into a jump. One of the highest calorie-burning bodyweight movements.',
    muscles: ['full body'], style: 'fullbody', movement: 'squat',
    equipment: ['bodyweight'], compound: true, defaultSets: 3, repRange: [8, 15], usesWeight: false, highImpact: true,
  },
  {
    id: 'kb_swing', name: 'Kettlebell Swing',
    description: 'Hinge at the hips and drive a kettlebell forward with a powerful hip snap. Builds posterior chain power and cardiovascular endurance simultaneously.',
    muscles: ['hamstrings', 'glutes', 'core', 'back'], style: 'fullbody', movement: 'hinge',
    equipment: ['kettlebell'], compound: true, defaultSets: 3, repRange: [12, 20], usesWeight: true,
  },
  {
    id: 'db_thruster', name: 'Dumbbell Thruster',
    description: 'Squat with dumbbells at shoulder height and press them overhead as you stand. A demanding compound that loads legs, core, and shoulders together.',
    muscles: ['quads', 'glutes', 'shoulders', 'triceps'], style: 'fullbody', movement: 'squat',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [8, 12], usesWeight: true, overhead: true,
  },
  {
    id: 'db_clean_press', name: 'Dumbbell Clean and Press',
    description: 'Explosively pull dumbbells from hip height to shoulders, then press overhead. Challenges coordination, power, and total-body strength.',
    muscles: ['shoulders', 'legs', 'core'], style: 'fullbody', movement: 'push',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [6, 10], usesWeight: true, overhead: true,
  },
  {
    id: 'farmers_carry', name: "Farmer's Carry",
    description: 'Hold heavy dumbbells at your sides and walk for distance with a tall posture. Builds grip strength, core stability, and total-body conditioning.',
    muscles: ['traps', 'core', 'grip', 'legs'], style: 'fullbody', movement: 'carry',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [20, 30], usesWeight: true, note: 'steps',
  },
  {
    id: 'renegade_row', name: 'Renegade Row',
    description: 'In a push-up position with hands on dumbbells, row one dumbbell to your hip while balancing. Works pushing muscles, pulling muscles, and core stability at once.',
    muscles: ['back', 'core', 'chest', 'shoulders'], style: 'fullbody', movement: 'pull',
    equipment: ['dumbbells'], compound: true, defaultSets: 3, repRange: [6, 10], usesWeight: true, note: 'each side', difficulty: 'intermediate',
  },
  {
    id: 'mountain_climbers', name: 'Mountain Climbers',
    description: 'In a push-up position, drive your knees to your chest in alternating quick steps. Builds core strength while elevating your heart rate fast.',
    muscles: ['core', 'hip flexors', 'shoulders'], style: 'fullbody', movement: 'core',
    equipment: ['bodyweight'], compound: true, defaultSets: 3, repRange: [20, 30], usesWeight: false, note: 'total reps', highImpact: true,
  },
  {
    id: 'jump_squats', name: 'Jump Squats',
    description: 'Squat and explode upward into a jump, landing softly with bent knees. Develops lower body power and burns significantly more calories than a standard squat.',
    muscles: ['quads', 'glutes', 'calves'], style: 'fullbody', movement: 'squat',
    equipment: ['bodyweight'], compound: true, defaultSets: 3, repRange: [10, 15], usesWeight: false, highImpact: true,
  },
  {
    id: 'turkish_getup', name: 'Turkish Get-up',
    description: 'From lying flat, stand up through a deliberate multi-step sequence while holding a weight overhead. Builds total-body stability, mobility, and overhead strength.',
    muscles: ['full body', 'core', 'shoulders'], style: 'fullbody', movement: 'carry',
    equipment: ['kettlebell'], compound: true, defaultSets: 3, repRange: [3, 5], usesWeight: true, note: 'each side', overhead: true, difficulty: 'advanced',
  },
  {
    id: 'band_squat_press', name: 'Band Squat to Press',
    description: 'Stand on a resistance band, squat, and press the handles overhead as you stand. A fluid compound movement for legs and shoulders with minimal equipment.',
    muscles: ['quads', 'glutes', 'shoulders'], style: 'fullbody', movement: 'squat',
    equipment: ['resistancebands'], compound: true, defaultSets: 3, repRange: [12, 15], usesWeight: false, overhead: true,
  },
  {
    id: 'bear_crawl', name: 'Bear Crawl',
    description: 'Move on all fours with knees hovering just above the ground. Builds shoulder stability, core strength, and full-body coordination.',
    muscles: ['core', 'shoulders', 'quads'], style: 'fullbody', movement: 'core',
    equipment: ['bodyweight'], compound: true, defaultSets: 3, repRange: [20, 30], usesWeight: false, note: 'steps',
  },
  {
    id: 'inchworm', name: 'Inchworm',
    description: 'From standing, walk your hands out to a push-up position and back to your feet. Stretches the hamstrings dynamically while activating shoulders and core.',
    muscles: ['core', 'hamstrings', 'shoulders'], style: 'fullbody', movement: 'core',
    equipment: ['bodyweight'], compound: true, defaultSets: 3, repRange: [8, 10], usesWeight: false,
  },

]
