import { AlertTriangle, Info, Trash2, X } from "lucide-react"

const toneStyles = {
  danger: {
    eyebrow: "text-rose-300",
    icon: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    confirm: "bg-rose-500 text-white hover:bg-rose-400",
    defaultIcon: Trash2,
  },
  warning: {
    eyebrow: "text-amber-300",
    icon: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    confirm: "bg-amber-500 text-slate-950 hover:bg-amber-400",
    defaultIcon: AlertTriangle,
  },
  info: {
    eyebrow: "text-blue-300",
    icon: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    confirm: "bg-blue-500 text-white hover:bg-blue-400",
    defaultIcon: Info,
  },
}

function AppModal({
  isOpen,
  tone = "info",
  eyebrow,
  title,
  message,
  children,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  closeLabel = "Close dialog",
  isBusy = false,
  showCancel = false,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) {
    return null
  }

  const styles = toneStyles[tone] || toneStyles.info
  const Icon = styles.defaultIcon

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950/95 shadow-[0_24px_80px_rgba(2,6,23,0.6)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
          <div className="flex min-w-0 items-start gap-4">
            <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${styles.icon}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              {eyebrow && (
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${styles.eyebrow}`}>
                  {eyebrow}
                </p>
              )}
              <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel || onConfirm}
            disabled={isBusy}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6">
          {message && <p className="text-sm leading-6 text-slate-300">{message}</p>}
          {children}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {showCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isBusy}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles.confirm}`}
            >
              <Icon className="h-4 w-4" />
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppModal
