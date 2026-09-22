export interface DashboardMetrics {
  onboardingDone: number
  onboardingTotal: number
  rankPosition: number
  rankTotal: number
  rankCategory: string
  rankRegion: string
  searchRankScore: number
  searchRankMax: number
  authorityScore: number
  articles: number
  answers: number
  reviewsToReply: number
  incompleteProfileItems: number
  connections: number
  connectionsTotal: number
}

const METRICS: Record<string, DashboardMetrics> = {
  'prof-john': {
    onboardingDone: 7,
    onboardingTotal: 13,
    rankPosition: 6,
    rankTotal: 7,
    rankCategory: 'Mortgage Professionals',
    rankRegion: 'Douglasville, GA',
    searchRankScore: 46,
    searchRankMax: 850,
    authorityScore: 3,
    articles: 0,
    answers: 0,
    reviewsToReply: 0,
    incompleteProfileItems: 13,
    connections: 0,
    connectionsTotal: 7,
  },
  'prof-sarah': {
    onboardingDone: 9,
    onboardingTotal: 13,
    rankPosition: 3,
    rankTotal: 9,
    rankCategory: 'Real Estate Agents',
    rankRegion: 'Round Rock, TX',
    searchRankScore: 184,
    searchRankMax: 850,
    authorityScore: 5,
    articles: 2,
    answers: 1,
    reviewsToReply: 2,
    incompleteProfileItems: 8,
    connections: 2,
    connectionsTotal: 7,
  },
  'loc-austin': {
    onboardingDone: 11,
    onboardingTotal: 13,
    rankPosition: 2,
    rankTotal: 5,
    rankCategory: 'Branch Locations',
    rankRegion: 'Austin, TX',
    searchRankScore: 268,
    searchRankMax: 850,
    authorityScore: 4,
    articles: 1,
    answers: 3,
    reviewsToReply: 1,
    incompleteProfileItems: 5,
    connections: 4,
    connectionsTotal: 7,
  },
}

const FALLBACK = METRICS['prof-john']

export function getDashboardMetrics(profileId: string): DashboardMetrics {
  return METRICS[profileId] ?? FALLBACK
}
