import { ChatCircleText, CheckCircle, SealCheck } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { cn } from 'cn'
import type { Question } from '../../api/questions'
import { filterPath, SEASON_LABELS, SOIL_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { excerpt, htmlToText } from '../../lib/html'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { TagList, type TagItem } from '../../ui/TagList'

/**
 * One question in a list, after a Reddit or Stack Overflow feed row: the topic and when, the question in Lora, what the
 * asker wrote, its tags and farming context, then a stats line (votes, answers, the accepted mark in mustard or
 * "Unanswered") with the asker, and the first photo on the right when there is one. The title link covers the row;
 * links inside it sit above. `compact` drops the excerpt and tags (Discover).
 */
export function QuestionCard({ question, compact = false }: { question: Question; compact?: boolean }) {
  const t = useT()
  const agri = question.agri ?? {}
  const answers = question.answerCount ?? 0
  const accepted = question.acceptedAnswerId != null
  const score = question.score ?? 0
  const preview = excerpt(htmlToText(question.content), 160)
  const photo = question.imageUrls?.[0]
  // Tags first, then the farming context, shown three at a time with the rest behind "+N".
  const tags: TagItem[] = [
    ...(question.tags ?? []).map((tag) => ({ label: `#${tag}`, to: `/questions?tag=${encodeURIComponent(tag)}` })),
    ...[
      agri.crop && { label: agri.crop, to: filterPath({ crop: agri.crop }, '/questions'), name: t('Crop') },
      agri.season && { label: t(SEASON_LABELS[agri.season]), to: filterPath({ season: agri.season }, '/questions'), name: t('Season') },
      agri.region && { label: agri.region, to: filterPath({ region: agri.region }, '/questions'), name: t('Region') },
      agri.soil && { label: t(SOIL_LABELS[agri.soil]), to: filterPath({ soil: agri.soil }, '/questions'), name: t('Soil') },
    ]
      .filter((chip): chip is { label: string; to: string; name: string } => Boolean(chip))
      .map((chip) => ({ ...chip, kind: 'context' as const })),
  ]

  return (
    <li className={cn('group relative flex gap-4 border-b border-border sm:gap-6', compact ? 'py-4' : 'py-5')}>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {question.category?.categoryName && (
            <Link to={`/questions?categoryId=${question.category.id}`} className="relative z-10 font-semibold text-primary hover:underline">
              {question.category.categoryName}
            </Link>
          )}
          <span>{storyDate(question.createdAt)}</span>
        </p>
        <h2 className={cn('mt-1 font-serif leading-snug font-semibold text-pretty', compact ? 'text-base' : 'text-lg sm:text-xl')}>
          <Link
            to={`/questions/${question.questionId}`}
            className="decoration-primary/60 decoration-2 underline-offset-4 transition-colors duration-150 after:absolute after:inset-0 group-hover:text-primary group-hover:underline"
          >
            {question.title}
          </Link>
        </h2>
        {!compact && preview && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{preview}</p>}
        {!compact && <TagList items={tags} label={t('Tags')} className="mt-2.5" />}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span>
            <b className="font-semibold text-foreground tabular-nums">{formatNumber(score)}</b> {score === 1 || score === -1 ? t('vote') : t('votes')}
          </span>
          <span>
            <b className="font-semibold text-foreground tabular-nums">{formatNumber(answers)}</b> {answers === 1 ? t('answer') : t('answers')}
          </span>
          {accepted ? (
            <span className="inline-flex items-center gap-1 font-semibold text-mustard-ink">
              <CheckCircle size={14} weight="fill" aria-hidden="true" />
              <span aria-hidden="true">{t('Accepted')}</span>
              <span className="sr-only">{t('An answer was accepted')}</span>
            </span>
          ) : (
            answers === 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <ChatCircleText size={14} aria-hidden="true" />
                {t('Unanswered')}
              </span>
            )
          )}
          <span className="inline-flex items-center gap-1.5">
            <Avatar name={question.authorName ?? '?'} size={20} />
            <span className="font-medium text-foreground">{question.authorName}</span>
            {question.authorReputation != null && (
              <span className="tabular-nums">
                <span className="sr-only">{t('Reputation')} </span>· {formatNumber(question.authorReputation)}
              </span>
            )}
            {question.authorBadges?.includes('VERIFIED_EXPERT') && <SealCheck size={14} weight="fill" className="text-mustard-ink" aria-label={t('Verified expert')} />}
          </span>
        </div>
      </div>
      {photo && (
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => (event.currentTarget.hidden = true)}
          className={cn('shrink-0 rounded-xl bg-muted object-cover', compact ? 'size-14' : 'size-20 sm:size-28')}
        />
      )}
    </li>
  )
}
