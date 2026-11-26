import { formatNumber, useT } from '../lib/i18n'

export function ImageUploadProgress({ progress, className }: { progress: number | null; className?: string }) {
  const t = useT()
  const label = progress === 100 ? t('Processing image…') : t('Uploading image…')
  return (
    <div className={className}>
      <output className="text-xs font-medium text-muted-foreground">{label}</output>
      {progress != null && progress < 100 && (
        <div className="mt-1 flex items-center gap-2">
          <progress className="h-1 min-w-0 flex-1 appearance-none overflow-hidden rounded-full bg-border [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-border [&::-webkit-progress-value]:bg-primary" value={progress} max={100} aria-label={label} />
          <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">{formatNumber(progress)}%</span>
        </div>
      )}
    </div>
  )
}
