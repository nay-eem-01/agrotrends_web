import { ArrowSquareOut } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { errorMessage } from '../../api/errors'
import {
  CREDENTIAL_LABELS,
  MAX_DECISION_NOTE,
  useExpertApplications,
  useExpertDecision,
  type ApplicationStatus,
  type ExpertApplication,
} from '../../api/experts'
import { storyDate } from '../../lib/dates'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextArea } from '../../ui/TextArea'
import { AdminPage } from './AdminPage'

const TABS: { status: ApplicationStatus; label: string }[] = [
  { status: 'PENDING', label: 'Waiting' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'REJECTED', label: 'Rejected' },
]

/** `/admin/experts`: decide expert applications (all or some topics, or reject with a reason); revoke a badge. */
export function AdminExpertsPage() {
  const [params] = useSearchParams()
  const status = TABS.find((tab) => tab.status === params.get('status'))?.status ?? 'PENDING'
  const applications = useExpertApplications(status)
  const list = applications.data?.content ?? []

  return (
    <AdminPage title="Expert applications">
      <nav aria-label="Application status" className="mt-6 flex gap-1 rounded-full bg-muted p-1 self-start w-fit">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            to={tab.status === 'PENDING' ? '/admin/experts' : `/admin/experts?status=${tab.status}`}
            aria-current={tab.status === status ? 'page' : undefined}
            className={cn('flex h-9 items-center rounded-full px-4 text-sm', tab.status === status ? 'bg-card font-medium shadow-xs ring-1 ring-border' : 'text-muted-foreground hover:text-foreground')}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {applications.isPending ? (
        <div className="py-12">
          <Spinner label="Loading applications" />
        </div>
      ) : applications.isError ? (
        <p role="alert" className="py-12 text-muted-foreground">
          {errorMessage(applications.error)}
        </p>
      ) : list.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{status === 'PENDING' ? 'No applications waiting.' : 'None yet.'}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {list.map((application) => (
            <li key={application.id}>
              <ApplicationCard application={application} />
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  )
}

function ApplicationCard({ application }: { application: ExpertApplication }) {
  return (
    <article aria-label={`Application from ${application.applicantName}`} className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-sans text-base font-semibold">
          {application.userId != null ? (
            <Link to={`/users/${application.userId}`} state={{ name: application.applicantName }} className="hover:underline">
              {application.applicantName}
            </Link>
          ) : (
            application.applicantName
          )}
        </h2>
        <span className="text-sm text-muted-foreground">Sent {storyDate(application.createdAt)}</span>
      </header>
      <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Field</dt>
        <dd>{application.fieldTitle}</dd>
        <dt className="text-muted-foreground">Institution</dt>
        <dd>{application.institution}</dd>
        <dt className="text-muted-foreground">Proof</dt>
        <dd>{application.credentialType ? CREDENTIAL_LABELS[application.credentialType] : '—'}</dd>
        <dt className="text-muted-foreground">Topics</dt>
        <dd>{(application.topics ?? []).map((topic) => topic.categoryName).join(', ')}</dd>
      </dl>
      {(application.proofImageUrls?.length ?? 0) > 0 && (
        <ul aria-label="Proof photos" className="mt-4 grid grid-cols-4 gap-2">
          {application.proofImageUrls!.map((url, index) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg ring-1 ring-border">
                <img src={url} alt={`Proof ${index + 1}`} className="aspect-square w-full object-cover" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {(application.links?.length ?? 0) > 0 && (
        <ul aria-label="Proof links" className="mt-3 flex flex-col gap-1 text-sm">
          {application.links!.map((link) => (
            <li key={link}>
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline">
                {link}
                <ArrowSquareOut size={14} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {application.reviewNote && <p className="mt-3 border-l-2 border-border pl-3 text-sm">Note: {application.reviewNote}</p>}
      {application.status === 'PENDING' && <Decide application={application} />}
      {application.status === 'APPROVED' && <Revoke application={application} />}
    </article>
  )
}

/** Approve every requested topic (sent without categoryIds) or some; reject needs a reason. */
function Decide({ application }: { application: ExpertApplication }) {
  const decide = useExpertDecision()
  const requested = (application.topics ?? []).map((topic) => topic.id ?? 0)
  const [chosen, setChosen] = useState<number[]>(requested)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string>()
  const id = application.id ?? 0

  function approve() {
    if (chosen.length === 0) return setNoteError('Keep at least one topic, or reject.')
    setNoteError(undefined)
    decide.mutate({ action: 'approve', applicationId: id, categoryIds: chosen.length === requested.length ? undefined : chosen, note: note.trim() })
  }

  function reject() {
    if (!note.trim()) return setNoteError('Say why, for the applicant.')
    setNoteError(undefined)
    decide.mutate({ action: 'reject', applicationId: id, note: note.trim() })
  }

  return (
    <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4">
      <fieldset>
        <legend className="text-sm font-medium">Approve for</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {(application.topics ?? []).map((topic) => (
            <label key={topic.id} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-(--primary)"
                checked={chosen.includes(topic.id ?? 0)}
                onChange={(event) => setChosen((current) => (event.target.checked ? [...current, topic.id ?? 0] : current.filter((value) => value !== topic.id)))}
              />
              {topic.categoryName}
            </label>
          ))}
        </div>
      </fieldset>
      <TextArea
        label="Note to the applicant"
        hint="Optional when approving; required when rejecting. The applicant sees it, never your name."
        rows={2}
        maxLength={MAX_DECISION_NOTE}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        error={noteError}
      />
      {decide.isError && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(decide.error)}
        </p>
      )}
      <div className="flex gap-3">
        <Button size="sm" loading={decide.isPending && decide.variables?.action === 'approve'} disabled={decide.isPending} onClick={approve}>
          Approve
        </Button>
        <Button variant="danger" size="sm" loading={decide.isPending && decide.variables?.action === 'reject'} disabled={decide.isPending} onClick={reject}>
          Reject
        </Button>
      </div>
    </div>
  )
}

/** Take a badge away, per topic. It also reopens the AI answers this expert confirmed there, so it asks first. */
function Revoke({ application }: { application: ExpertApplication }) {
  const decide = useExpertDecision()
  const [topic, setTopic] = useState<{ id: number; name: string } | null>(null)

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-sm font-medium">Badges</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(application.topics ?? []).map((t) => (
          <Button key={t.id} variant="secondary" size="sm" onClick={() => setTopic({ id: t.id ?? 0, name: t.categoryName ?? '' })}>
            Revoke {t.categoryName}
          </Button>
        ))}
      </div>
      {decide.isError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {errorMessage(decide.error)}
        </p>
      )}
      {decide.isSuccess && <output className="mt-2 block text-sm text-primary">Badge revoked.</output>}
      <AlertDialog open={topic != null} onOpenChange={(open) => !open && setTopic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke the {topic?.name} badge?</AlertDialogTitle>
            <AlertDialogDescription>
              {application.applicantName} stops being a verified expert in {topic?.name}, and every AI answer they confirmed there goes back to
              unchecked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (topic && application.userId != null) decide.mutate({ action: 'revoke', userId: application.userId, categoryId: topic.id })
                setTopic(null)
              }}
            >
              Revoke badge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
