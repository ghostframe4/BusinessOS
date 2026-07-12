import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton da página de seção (docs/03 §9.2): espelha a forma final (header +
 * grid de cards) para evitar layout shift enquanto os MD são lidos do disco.
 */
export default function SectionLoading() {
  return (
    <>
      {/* Faixa do topbar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3 px-6 md:px-8">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>

      {/* Bloco de título */}
      <div className="px-6 pb-2 pt-6 md:px-8">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-56 rounded-2xl" />
            <Skeleton className="h-4 w-40 rounded-full" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full" />
        </header>
      </div>

      <div
        className="grid grid-cols-1 gap-5 px-6 pb-10 pt-6 sm:grid-cols-2 md:px-8 xl:grid-cols-3"
        aria-busy="true"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-44 flex-col gap-3 rounded-3xl bg-card p-6 shadow-sm"
            aria-hidden
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-2/3 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-4/5 rounded-full" />
            <Skeleton className="mt-auto h-3 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </>
  );
}
