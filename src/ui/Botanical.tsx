import { cx } from './cx'

/*
 * The Living Field's drawn details: a leaf sprig, a field at morning, and a cover for stories without a photo.
 * All decorative (aria-hidden), drawn in the theme's colours so they follow light and dark.
 */

/** A single sprig of leaves in line work; sits in corners and empty states. */
export function Sprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" fill="none" aria-hidden="true" className={cx('text-primary', className)}>
      <path d="M60 156C60 118 58 82 64 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M61 118C44 116 30 104 26 84c18 0 31 12 35 34Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M61 96c17-3 29-16 31-36-18 2-30 15-31 36Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M62 70C47 66 37 54 36 36c16 3 26 15 26 34Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M64 44c10-8 14-20 11-34-11 7-15 19-11 34Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * A paddy field in the morning: low sun in the warm accent, two hills, crop rows running to the horizon and seedlings
 * in the foreground. Flat colour, no photographs: it stands in for field imagery the platform doesn't have yet.
 */
export function FieldScene({ className }: { className?: string }) {
  const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  return (
    <svg viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={cx('block', className)}>
      <rect width="640" height="420" fill="var(--color-surface)" />
      <circle cx="470" cy="118" r="46" fill="var(--color-mustard)" fillOpacity=".85" />
      <path d="M0 210c90-40 190-52 300-30s210 6 340-34v94H0Z" fill="var(--color-secondary)" />
      <path d="M0 236c120-30 230-24 330-4s200 12 310-14v202H0Z" fill="var(--color-primary)" fillOpacity=".16" />
      <path d="M0 262c130-14 260-12 380 0s180 6 260-4v162H0Z" fill="var(--color-primary)" fillOpacity=".28" />
      {rows.map((i) => (
        <path
          key={i}
          d={`M${320 + (i - 4) * 18} 262 C ${320 + (i - 4) * 60} 320, ${320 + (i - 4) * 110} 380, ${320 + (i - 4) * 150} 420`}
          stroke="var(--color-primary)"
          strokeOpacity=".45"
          strokeWidth="2"
          fill="none"
        />
      ))}
      <g stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M70 420c0-30 2-52 10-74M80 380c-14-8-22-20-22-36 14 4 22 16 22 36M82 362c12-8 18-20 16-36-12 6-18 18-16 36" />
        <path d="M560 420c0-34 4-60 14-86M572 376c-16-8-24-22-24-40 16 6 24 18 24 40M576 354c14-10 20-24 18-42-14 8-20 22-18 42" />
      </g>
    </svg>
  )
}

/**
 * The cover for a story without a photo: a pale field with a sprig and, when known, the crop or topic as a label.
 * Keeps grids even without inventing an image.
 */
export function CoverFallback({ label, className }: { label?: string | null; className?: string }) {
  return (
    <div aria-hidden="true" className={cx('relative flex items-end overflow-hidden bg-surface', className)}>
      <Sprig className="absolute -top-4 right-3 h-[120%] opacity-70" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-secondary" />
      {label && <span className="relative m-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground">{label}</span>}
    </div>
  )
}
