import { ChatCircleText, CheckCircle, SealCheck } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from 'cn'
import type { Question } from '../../api/questions'
import { filterPath, SEASON_LABELS, SOIL_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { excerpt, htmlToText } from '../../lib/html'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { TagList, type TagItem } from '../../ui/TagList'

/**
 * One question in a list. A question is a request for help, so it reads like one: the votes and the answer state
 * on the left (accepted in the warm trust colour, answered in sage, unanswered plainly said), the question in
 * interface type, what the asker wrote, its topic and farming context, and the first photo when there is one.
 * The title link covers the row; chips and tags sit above it. `compact` drops the excerpt and chips (Discover).
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
    <li className={cn('group relative flex gap-4 border-b border-border sm:gap-5', compact ? 'py-4' : 'py-5')}>
      <div className="flex w-14 shrink-0 flex-col items-center gap-2 pt-0.5 text-center sm:w-16">
        <p className="flex flex-col leading-tight">
          <span className="text-lg font-semibold tabular-nums">{formatNumber(score)}</span>
          <span className="text-xs text-muted-foreground">{score === 1 || score === -1 ? t('vote') : t('votes')}</span>
        </p>
        <p
          className={cn(
            'flex w-full flex-col rounded-md px-1 py-1 leading-tight',
            accepted ? 'bg-mustard-soft text-foreground' : answers > 0 ? 'bg-secondary text-primary' : 'border border-dashed border-border-strong text-muted-foreground',
          )}
        >
          <span className="inline-flex items-center justify-center gap-1 text-base font-semibold tabular-nums">
            {accepted && <CheckCircle size={14} weight="fill" className="text-mustard" aria-hidden="true" />}
            {formatNumber(answers)}
          </span>
          <span className="text-xs">{answers === 1 ? t('answer') : t('answers')}</span>
          {accepted && <span className="sr-only">{t('An answer was accepted')}</span>}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        {!compact && question.category?.categoryName && (
          <Badge variant="secondary" className="relative z-10 mb-2" render={<Link to={`/questions?categoryId=${question.category.id}`} />}>
            {question.category.categoryName}
          </Badge>
        )}
        <h2 className={cn('leading-snug font-semibold text-pretty', compact ? 'text-base' : 'text-lg')}>
          <Link
            to={`/questions/${question.questionId}`}
            className="decoration-primary/60 decoration-2 underline-offset-4 transition-colors duration-150 after:absolute after:inset-0 group-hover:text-primary group-hover:underline"
          >
            {question.title}
          </Link>
        </h2>
        {!compact && preview && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{preview}</p>}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Avatar name={question.authorName ?? '?'} size={20} />
            <span className="font-medium text-foreground">{question.authorName}</span>
            {question.authorReputation != null && (
              <span className="tabular-nums">
                <span className="sr-only">{t('Reputation')} </span>· {formatNumber(question.authorReputation)}
              </span>
            )}
            {question.authorBadges?.includes('VERIFIED_EXPERT') && <SealCheck size={14} weight="fill" className="text-mustard" aria-label={t('Verified expert')} />}
            <span>· {storyDate(question.createdAt)}</span>
          </span>
          {answers === 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <ChatCircleText size={14} aria-hidden="true" />
              {t('Unanswered')}
            </span>
          )}
          {compact && question.category?.categoryName && <span>· {question.category.categoryName}</span>}
        </div>
        {!compact && <TagList items={tags} label={t('Tags')} className="mt-2.5" />}
      </div>
      {photo && (
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => (event.currentTarget.hidden = true)}
          className={cn('shrink-0 rounded-lg bg-muted object-cover', compact ? 'size-14' : 'size-16 sm:size-24')}
        />
      )}
    </li>
  )
}
