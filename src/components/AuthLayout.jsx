import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mobile-safe auth shell: dvh (dynamic viewport height) tracks the *visible*
// screen — 100vh on phones is taller than what's on screen (browser bars,
// home indicator), which pushed the Log in button out of frame. min-h (not
// h) lets the page grow and scroll when the keyboard or small screens eat
// space, and safe-area padding keeps the button clear of iOS home bars.
export default function AuthLayout({ icon: Icon, title, subtitle = null, footer = null, showBack = false, children = null }) {
  const navigate = useNavigate();
  const goBack = () => window.history.state?.idx > 0 ? navigate(-1) : navigate("/");
  return (
    <div className="min-h-screen supports-[height:100dvh]:min-h-dvh w-full bg-background px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center supports-[height:100dvh]:min-h-[calc(100dvh-3rem)]">
        {showBack && (
          <button type="button" onClick={goBack} aria-label="Go back"
            className="no-callout mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <div className="mb-6 text-center sm:mb-10">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary sm:mb-4 sm:h-14 sm:w-14">
            <Icon className="h-6 w-6 text-primary-foreground sm:h-7 sm:w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
          {children}
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </div>
  );
}