import { DotsThree, Flag, PencilSimple, Trash } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { ReportTarget } from '../../api/reports'
import { useT } from '../../lib/i18n'
import { useSession } from '../auth/session'
import { useReportFlow } from '../reports/ReportButton'

export interface PostMenuProps {
  /** The reader wrote this post: Edit and Delete instead of Report. */
  own: boolean
  /** What the post is, for the report dialog's title ("this answer"). */
  what: string
  report: { targetType: ReportTarget; targetId: number }
  /** Edit in place, or `editHref` to edit on its own page (questions). Leave both out for no Edit. */
  onEdit?: () => void
  editHref?: string
  /** Opens the post's own delete confirmation. Leave out for no Delete. */
  onDelete?: () => void
}

/**
 * A post's secondary actions behind one quiet "More actions" button (a shadcn DropdownMenu: arrow keys, Escape
 * returns focus): Edit and Delete for the author, Report for everyone else. Delete is red and still asks first;
 * Report signs visitors in and opens the usual dialog, then reads "Reported".
 */
export function PostMenuImpl({ own, what, report, onEdit, editHref, onDelete }: PostMenuProps) {
  const t = useT()
  const { status } = useSession()
  const flow = useReportFlow({ ...report, what })
  const mine = own && status === 'signed-in'
  if (mine && !onEdit && !editHref && !onDelete) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t('More actions')}
          className="-my-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground"
        >
          <DotsThree size={20} weight="bold" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            {mine ? (
              <>
                {editHref && (
                  <DropdownMenuItem className="min-h-10" render={<Link to={editHref} />}>
                    <PencilSimple size={16} aria-hidden="true" />
                    {t('Edit')}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem className="min-h-10" onClick={onEdit}>
                    <PencilSimple size={16} aria-hidden="true" />
                    {t('Edit')}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem variant="destructive" className="min-h-10" onClick={onDelete}>
                    <Trash size={16} aria-hidden="true" />
                    {t('Delete')}
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <DropdownMenuItem className="min-h-10" disabled={flow.reported} onClick={flow.start}>
                <Flag size={16} weight={flow.reported ? 'fill' : 'regular'} aria-hidden="true" />
                {flow.reported ? t('Reported') : t('Report')}
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {flow.dialog}
    </>
  )
}
