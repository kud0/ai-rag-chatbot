import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for chat page
 * Displays while chat interface is being loaded
 */
export default function ChatLoading() {
  return (
    <div className="flex h-screen flex-col">
      {/* Page header skeleton */}
      <header className="hidden border-b bg-background lg:block">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </header>

      {/* Chat interface skeleton */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar skeleton */}
          <div className="hidden lg:flex w-64 border-r flex-col p-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          {/* Chat area skeleton */}
          <div className="flex-1 flex flex-col">
            {/* Messages area */}
            <div className="flex-1 p-4 space-y-4">
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="flex-1 space-y-2 max-w-[80%]">
                  <Skeleton className="h-4 w-full ml-auto" />
                  <Skeleton className="h-4 w-3/4 ml-auto" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>

            {/* Input area skeleton */}
            <div className="border-t p-4">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
