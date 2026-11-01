import { expect, test } from 'vitest'
import { describeNotification } from './notifications'

test('each type has its words and its place', () => {
  expect(describeNotification({ type: 'ANSWER_ON_YOUR_QUESTION', targetType: 'QUESTION', targetId: 5, actorName: 'Rahim' })).toEqual({
    text: '{actor} answered your question',
    values: { actor: 'Rahim' },
    to: '/questions/5',
  })
  expect(describeNotification({ type: 'ANSWER_ACCEPTED', targetType: 'QUESTION', targetId: 5, actorName: 'Karim' }).to).toBe('/questions/5')
  expect(describeNotification({ type: 'AI_ANSWER_REVIEWED', targetType: 'QUESTION', targetId: 5 }).to).toBe('/questions/5')
  expect(describeNotification({ type: 'NEW_REVIEW_ITEM', targetType: 'QUESTION', targetId: 6 }).to).toBe('/questions/6')
  // The AI gave no answer, so the question goes to the topic's experts.
  expect(describeNotification({ type: 'NEW_QUESTION_IN_TOPIC', targetType: 'QUESTION', targetId: 7 })).toEqual({ text: 'New question in your topic, waiting for an expert', values: {}, to: '/questions/7' })
  expect(describeNotification({ type: 'COMMENT_REPLY', targetType: 'BLOG', targetId: 9, actorName: 'Salma' }).to).toBe('/s/9')
  expect(describeNotification({ type: 'APPLICATION_DECIDED', targetType: 'EXPERT_APPLICATION', targetId: 3 }).to).toBe('/experts/apply')
  expect(describeNotification({ type: 'CONTENT_RESTORED', targetType: 'BLOG', targetId: 9 }).to).toBe('/s/9')
  expect(describeNotification({ type: 'CONTENT_RESTORED', targetType: 'QUESTION', targetId: 5 }).to).toBe('/questions/5')
})

test('hidden and removed posts have no link, and moderation never names anyone', () => {
  const hidden = describeNotification({ type: 'CONTENT_HIDDEN', targetType: 'QUESTION', targetId: 5 })
  expect(hidden.to).toBeNull()
  expect(hidden.values).toEqual({})
  expect(describeNotification({ type: 'CONTENT_REMOVED', targetType: 'BLOG', targetId: 9 }).to).toBeNull()
  expect(describeNotification({ type: 'APPLICATION_DECIDED', actorName: 'Admin Ali' }).values).toEqual({})
})

test('an unknown future type gets a generic line, linked by target type', () => {
  const unknown = describeNotification({ type: 'SOMETHING_NEW' as never, targetType: 'QUESTION', targetId: 8 })
  expect(unknown).toEqual({ text: 'You have a new notification', values: {}, to: '/questions/8' })
})
