import type { Notification } from '../api/notifications'

/**
 * What a notification says (an English template for `translate`, with its values) and where it leads. Moderation and
 * application decisions have no actor and never name one; hidden or removed posts have no link (the page is 404 for
 * their author too). Unknown future types get a generic line and a link by target type.
 */
export function describeNotification(n: Notification): { text: string; values: { actor?: string }; to: string | null } {
  // Without a name (a deleted account), the row says "A member".
  const actor = n.actorName
  const byTarget = (): string | null =>
    n.targetId == null
      ? null
      : n.targetType === 'QUESTION'
        ? `/questions/${n.targetId}`
        : n.targetType === 'BLOG'
          ? `/s/${n.targetId}`
          : n.targetType === 'EXPERT_APPLICATION'
            ? '/experts/apply'
            : null
  const question = n.targetId != null ? `/questions/${n.targetId}` : null

  switch (n.type) {
    case 'ANSWER_ON_YOUR_QUESTION':
      return { text: '{actor} answered your question', values: { actor }, to: question }
    case 'ANSWER_ACCEPTED':
      return { text: '{actor} accepted your answer', values: { actor }, to: question }
    case 'AI_ANSWER_REVIEWED':
      return { text: 'An expert reviewed the AI answer on your question', values: {}, to: question }
    case 'NEW_REVIEW_ITEM':
      return { text: 'New AI answer to review in your topic', values: {}, to: question }
    case 'NEW_QUESTION_IN_TOPIC':
      return { text: 'New question in your topic, waiting for an expert', values: {}, to: question }
    case 'COMMENT_REPLY':
      return { text: '{actor} replied to your comment', values: { actor }, to: n.targetId != null ? `/s/${n.targetId}` : null }
    case 'APPLICATION_DECIDED':
      return { text: 'Your expert application was decided', values: {}, to: '/experts/apply' }
    case 'CONTENT_HIDDEN':
      return { text: 'One of your posts is hidden while moderators review reports', values: {}, to: null }
    case 'CONTENT_RESTORED':
      return { text: 'Your post is visible again', values: {}, to: byTarget() }
    case 'CONTENT_REMOVED':
      return { text: 'Moderators removed one of your posts', values: {}, to: null }
    default:
      return { text: 'You have a new notification', values: {}, to: byTarget() }
  }
}
