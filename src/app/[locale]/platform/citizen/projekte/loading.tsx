import { CardSkeleton } from '@/components/ui/skeleton'

export default function ProjectsLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
