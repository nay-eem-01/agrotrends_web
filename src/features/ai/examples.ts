import type { Season } from '../../lib/agri'

/** Starting points for the advisor that fit the season now; tapping one fills the question box. */
export const ADVISOR_EXAMPLES: Record<Exclude<Season, 'YEAR_ROUND'>, string[]> = {
  RABI: [
    'How do I protect boro seedlings from cold injury?',
    'When should I sow mustard in the north?',
    'What causes late blight on potato?',
  ],
  KHARIF_1: [
    'How do I control stem borer in aus rice?',
    'When is jute ready to harvest?',
    'How much urea does aus rice need?',
  ],
  KHARIF_2: [
    'When should I transplant aman seedlings?',
    'How do I manage brown planthopper in aman?',
    'What should I do after a flood in my rice field?',
  ],
}

/** Questions that fit any season, grouped by the kind of problem; examples of what to ask, not advice. */
export const COMMON_QUESTIONS: { topic: 'leaves' | 'soil' | 'pests' | 'water'; question: string }[] = [
  { topic: 'leaves', question: 'What could be causing yellow leaves on my rice plants?' },
  { topic: 'soil', question: 'How can I prepare my soil before planting?' },
  { topic: 'pests', question: 'What should I check when I notice pests on my crops?' },
  { topic: 'water', question: 'How can I improve irrigation efficiency during dry weather?' },
]
