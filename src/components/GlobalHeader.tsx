import Link from "next/link";
import { AlmiWorldBar } from "@/components/almiworld/AlmiWorldBar";
import { AuthNav } from "./AuthNav";

// AlmiKorean header. RR-398: on top, the AlmiWorld family bar (logo + Home to almiworld.com, and the same menus as
// almiworld.com) from the one generated kit; under it AlmiKorean's own wordmark, Practice, Log in and its own button. The old
// family strip (with its eBooks and WordPress links) is gone.
export function GlobalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-almi-line bg-almi-bg/95 backdrop-blur">
      <AlmiWorldBar />
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" aria-label="AlmiKorean home" className="inline-flex shrink-0 items-center gap-2">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg bg-almi-coral text-lg font-bold text-almi-ink">
            한
          </span>
          <span className="text-xl font-semibold tracking-tight text-almi-ink">AlmiKorean</span>
        </Link>
        <div className="ml-auto">
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
