import { Check, Clock, SealCheck, ShieldWarning, Sparkle, X } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { cn } from 'cn'
import { useCategories } from '../../api/categories'
import { ApiError, errorMessage } from '../../api/errors'
import {
  CREDENTIAL_LABELS,
  EXPERT_LIMITS,
  isWebLink,
  useApplyAsExpert,
  useMyApplications,
  type CredentialType,
  type ExpertApplication,
} from '../../api/experts'
import { storyDate } from '../../lib/dates'
import { useT } from '../../lib/i18n'
import { Button, ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextField } from '../../ui/TextField'
import { PhotoPicker } from '../qa/PhotoPicker'

/** `/experts/apply`: apply to be a Verified Expert in 1–3 topics, or see where the latest application stands. */
export function ExpertApplyPage() {
  const t = useT()
  const mine = useMyApplications()
  const latest = mine.data?.content[0]
  const [reapply, setReapply] = useState(false)

  return (
    <section className="mx-auto grid max-w-[68rem] gap-10 px-4 pt-10 pb-20 sm:px-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14">
      <title>{t('Become a verified expert – AgroTrends')}</title>
      <WhyApply />
      <div className="min-w-0">
        {mine.isPending ? (
          <div className="py-12 text-muted-foreground">
            <Spinner label={t('Loading')} />
          </div>
        ) : latest && (latest.status === 'PENDING' || !reapply) ? (
          <div>
            <ApplicationStatus application={latest} />
            {latest.status !== 'PENDING' && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setReapply(true)}>
                {t('Apply again')}
              </Button>
            )}
          </div>
        ) : (
          <ApplyForm />
        )}
      </div>
    </section>
  )
}

/** Why it's worth applying and what happens after, beside the form (above it on phones). */
function WhyApply() {
  const t = useT()
  const perks = [
    { icon: SealCheck, title: t('A badge on everything you write'), text: t('Your answers, stories and profile') },
    { icon: Sparkle, title: t('Check the AI advisor'), text: t('Confirm or correct its answers in your topics') },
  ]
  const steps = [
    { title: t('Send your application'), text: t('About three minutes') },
    { title: t('An admin looks at your proof'), text: t('They may approve some of your topics') },
    { title: t('Your badge appears'), text: t('We send you a notification') },
  ]
  return (
    <div>
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-mustard-soft px-3 text-xs font-semibold text-mustard-ink">
        <SealCheck size={14} weight="fill" aria-hidden="true" />
        {t('Verified expert')}
      </span>
      <h1 className="mt-4 font-serif text-[1.75rem] leading-tight font-semibold sm:text-[2.125rem]">{t('Become a verified expert')}</h1>
      <p className="mt-3 text-muted-foreground">{t('Farmers trust an answer more when they know who gave it. Tell us your field and show one proof.')}</p>
      <ul className="mt-6 flex flex-col gap-4">
        {perks.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mustard-soft text-mustard-ink">
              <Icon size={20} />
            </span>
            <span className="text-sm">
              <span className="block text-base font-semibold">{title}</span>
              <span className="text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-sans text-sm font-semibold">{t('What happens next')}</h2>
      <ol className="mt-3 flex flex-col">
        {steps.map(({ title, text }, index) => (
          <li key={title} className="relative flex gap-3 pb-4 text-sm last:pb-0">
            {index < steps.length - 1 && <span aria-hidden="true" className="absolute top-7 bottom-0 left-3 w-px bg-border" />}
            <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

const STATUS = {
  PENDING: { icon: Clock, title: 'Your application is waiting for an admin', tone: 'bg-secondary' },
  APPROVED: { icon: SealCheck, title: 'You are a verified expert', tone: 'bg-mustard-soft' },
  REJECTED: { icon: ShieldWarning, title: 'Your application was not approved', tone: 'bg-muted' },
} as const

/** Where an application stands, with the admin's note. Who decided is never shown. */
export function ApplicationStatus({ application }: { application: ExpertApplication }) {
  const t = useT()
  const status = STATUS[application.status ?? 'PENDING']
  const Icon = status.icon
  return (
    <section aria-label={t('Expert application')} className={cn('rounded-xl p-5', status.tone)}>
      <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
        <Icon size={20} weight="fill" className={application.status === 'APPROVED' ? 'text-mustard-ink' : 'text-foreground'} aria-hidden="true" />
        {t(status.title)}
      </h2>
      <p className="mt-2 text-sm">
        {(application.topics ?? []).map((topic) => topic.categoryName).join(', ')}
        {application.fieldTitle ? ` · ${application.fieldTitle}` : ''}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('Sent {date}', { date: storyDate(application.createdAt) })}
        {application.status !== 'PENDING' && application.updatedAt ? ` · ${t('Decided {date}', { date: storyDate(application.updatedAt) })}` : ''}
      </p>
      {application.reviewNote && (
        <blockquote className="mt-3 border-l-2 border-foreground/30 pl-3 text-sm">
          <span className="sr-only">{t('Note from the admin')}: </span>
          {application.reviewNote}
        </blockquote>
      )}
    </section>
  )
}

type Errors = Partial<Record<'topics' | 'field' | 'credential' | 'institution' | 'proof' | 'links', string>>

function ApplyForm() {
  const t = useT()
  const categories = useCategories()
  const apply = useApplyAsExpert()
  const [topics, setTopics] = useState<number[]>([])
  const [fieldTitle, setFieldTitle] = useState('')
  const [credentialType, setCredentialType] = useState<CredentialType | ''>('')
  const [institution, setInstitution] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [links, setLinks] = useState<string[]>([''])
  const [errors, setErrors] = useState<Errors>({})
  const pending = apply.error instanceof ApiError && apply.error.status === 409

  function toggle(id: number) {
    setTopics((current) => (current.includes(id) ? current.filter((value) => value !== id) : current.length < EXPERT_LIMITS.topics ? [...current, id] : current))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const filled = links.map((link) => link.trim()).filter(Boolean)
    const found: Errors = {
      topics: topics.length === 0 ? t('Choose at least one topic.') : undefined,
      field: fieldTitle.trim() ? undefined : t('Say what your field is.'),
      credential: credentialType ? undefined : t('Choose what your proof is.'),
      institution: institution.trim() ? undefined : t('Name your institution or workplace.'),
      proof: images.length === 0 && filled.length === 0 ? t('Add at least one photo or link as proof.') : undefined,
      links: filled.some((link) => !isWebLink(link)) ? t('Links start with http:// or https://.') : undefined,
    }
    setErrors(found)
    if (Object.values(found).some(Boolean) || !credentialType) return
    apply.mutate({
      categoryIds: topics,
      fieldTitle: fieldTitle.trim(),
      credentialType,
      institution: institution.trim(),
      proofImageUrls: images,
      links: filled,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-7">
      <fieldset aria-describedby="topics-hint">
        <legend className="text-sm font-medium">{t('Topics (up to {n})', { n: EXPERT_LIMITS.topics })}</legend>
        <ul className="mt-2 flex flex-wrap gap-2">
          {(categories.data ?? []).map((category) => {
            const chosen = topics.includes(category.id ?? 0)
            const full = !chosen && topics.length >= EXPERT_LIMITS.topics
            return (
              <li key={category.id}>
                <label
                  className={cn(
                    'inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[color,background-color,border-color] duration-150 select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary',
                    chosen ? 'border-primary bg-secondary pl-3 text-primary' : 'border-border-strong hover:border-primary/50 hover:bg-surface',
                    full && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={chosen} disabled={full} onChange={() => toggle(category.id ?? 0)} />
                  {chosen && <Check size={16} weight="bold" aria-hidden="true" />}
                  {category.categoryName}
                </label>
              </li>
            )
          })}
        </ul>
        <p id="topics-hint" className={cn('mt-2 text-sm', errors.topics ? 'text-destructive' : 'text-muted-foreground')}>
          {errors.topics ?? t('The admin may approve some of them.')}
        </p>
      </fieldset>
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label={t('Your field')}
          placeholder={t('Veterinarian, soil scientist, plant pathologist…')}
          maxLength={EXPERT_LIMITS.field}
          value={fieldTitle}
          onChange={(event) => setFieldTitle(event.target.value)}
          error={errors.field}
        />
        <TextField
          label={t('Institution or workplace')}
          placeholder={t('BRRI, a district livestock office, a university…')}
          maxLength={EXPERT_LIMITS.institution}
          value={institution}
          onChange={(event) => setInstitution(event.target.value)}
          error={errors.institution}
        />
      </div>
      <fieldset aria-describedby={errors.credential ? 'credential-error' : undefined}>
        <legend className="text-sm font-medium">{t('Your proof is a')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(CREDENTIAL_LABELS) as CredentialType[]).map((value) => {
            const chosen = credentialType === value
            return (
              <label
                key={value}
                className={cn(
                  'inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[color,background-color,border-color] duration-150 select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary',
                  chosen ? 'border-primary bg-secondary pl-3 text-primary' : 'border-border-strong hover:border-primary/50 hover:bg-surface',
                  errors.credential && !chosen && 'border-destructive/50',
                )}
              >
                <input type="radio" name="credential" value={value} className="sr-only" checked={chosen} onChange={() => setCredentialType(value)} />
                {chosen && <Check size={16} weight="bold" aria-hidden="true" />}
                {t(CREDENTIAL_LABELS[value])}
              </label>
            )
          })}
        </div>
        {errors.credential && (
          <p id="credential-error" className="mt-2 text-sm text-destructive">
            {errors.credential}
          </p>
        )}
      </fieldset>
      <PhotoPicker
        urls={images}
        onChange={setImages}
        max={EXPERT_LIMITS.images}
        label={t('Proof photos')}
        hint={t('Up to {n}. Photos are stored at a public, hard-to-guess address: cover anything you would not want leaked.', { n: EXPERT_LIMITS.images })}
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">{t('Proof links (up to {n})', { n: EXPERT_LIMITS.links })}</legend>
        {links.map((link, index) => (
          <div key={index} className="flex items-end gap-2">
            <TextField
              className="flex-1"
              label={t('Link {n}', { n: index + 1 })}
              type="url"
              inputMode="url"
              placeholder="https://"
              value={link}
              onChange={(event) => setLinks((current) => current.map((value, i) => (i === index ? event.target.value : value)))}
            />
            {links.length > 1 && (
              <Button variant="quiet" size="sm" aria-label={t('Remove link {n}', { n: index + 1 })} onClick={() => setLinks((current) => current.filter((_, i) => i !== index))}>
                <X size={16} aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        {links.length < EXPERT_LIMITS.links && (
          <Button variant="quiet" size="sm" className="-ml-4 self-start" onClick={() => setLinks((current) => [...current, ''])}>
            {t('Add a link')}
          </Button>
        )}
        {errors.links && <p className="text-sm text-destructive">{errors.links}</p>}
      </fieldset>
      {errors.proof && (
        <p role="alert" className="text-sm text-destructive">
          {errors.proof}
        </p>
      )}
      {apply.isError && (
        <p role="alert" className="text-sm text-destructive">
          {pending ? t('You already have an application waiting. Its status is shown here once it reloads.') : errorMessage(apply.error)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <p className="mr-auto text-sm text-muted-foreground">{t("If it isn't approved, you can apply again.")}</p>
        <ButtonLink to="/settings" variant="quiet">
          {t('Cancel')}
        </ButtonLink>
        <Button type="submit" loading={apply.isPending}>
          {t('Send application')}
        </Button>
      </div>
    </form>
  )
}
