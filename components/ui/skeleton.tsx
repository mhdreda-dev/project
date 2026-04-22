import { cn } from '@/lib/utils'

/**
 * Generic shimmer placeholder. Compose it into page-specific skeletons —
 * don't make page loading states "visible" with raw animate-pulse blocks
 * because the shimmer direction is a design signal (left → right) users
 * learn to trust as "something is loading, not broken".
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-slate-100',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-[shimmer_1.4s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
        className,
      )}
      {...props}
    />
  )
}
