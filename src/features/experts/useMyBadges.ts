import { useReputation, type Badge } from '../../api/reputation'
import { useSession } from '../auth/session'

/**
 * The signed-in user's badges, from their reputation (the backend has no "am I an expert here" read yet): in one topic
 * when `topicId` is given, and whether they are a Verified Expert anywhere.
 */
export function useMyBadges(topicId?: number): { inTopic: Badge[]; expertAnywhere: boolean } {
  const { status, user } = useSession()
  const reputation = useReputation(status === 'signed-in' && user?.id != null ? user.id : NaN)
  const topics = reputation.data?.topics ?? []
  return {
    inTopic: (topics.find((topic) => topic.categoryId === topicId)?.badges ?? []) as Badge[],
    expertAnywhere: topics.some((topic) => topic.badges?.includes('VERIFIED_EXPERT')),
  }
}
