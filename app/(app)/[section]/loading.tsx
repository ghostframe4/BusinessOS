import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton da página de seção (docs/03 §9.2): espelha a forma final (header +
 * grid de cards) para evitar layout shift enquanto os MD são lidos do disco.
 */
export default function SectionLoading() {
  return (
    <div className="flex flex-col">
      <header className="mb-8 flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </header>

      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-busy="true"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-40 flex-col gap-3 rounded-xl border border-border p-5"
            aria-hidden
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-2/3 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-4/5 rounded-md" />
            <Skeleton className="mt-auto h-3 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
