import { CheckCircleIcon, InfoIcon, SpinnerIcon, WarningIcon, XCircleIcon } from "@phosphor-icons/react"
import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "@/lib/theme"
import { useT } from "@/lib/i18n"

// AgroTrends keeps its own theme store (src/lib/theme.ts) instead of next-themes.
const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useTheme()
  const t = useT()

  return (
    <Sonner
      theme={theme}
      // Sonner's default region name is "Notifications", which is the bell's panel; toasts are messages.
      containerAriaLabel={t('Messages')}
      className="toaster group"
      icons={{
        success: <CheckCircleIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <WarningIcon className="size-4" />,
        error: <XCircleIcon className="size-4" />,
        loading: <SpinnerIcon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
