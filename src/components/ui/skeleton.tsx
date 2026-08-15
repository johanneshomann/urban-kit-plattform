// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { cn } from '@/lib/cn'

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[color-mix(in_srgb,var(--app-ink)_10%,transparent)]', className)}
    />
  )
}

/** Borderless white card with pulsing text bars — dashboard token style. */
export function CardSkeleton() {
  return (
    <div className="rounded-xl p-4 space-y-3 shadow-sm bg-[var(--app-white)]">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  )
}
