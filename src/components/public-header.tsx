import Link from "next/link";
import { Search, Newspaper, Globe2 } from "lucide-react";

type PublicHeaderProps = {
  todayDate: string;
};

export function PublicHeader({
  todayDate,
}: PublicHeaderProps) {
  return (
    <header className="customer-home-header relative z-40 border-b border-stone-200 bg-white shadow-[0_8px_24px_rgba(23,32,43,0.05)]">
      {/* Top information bar */}
      <div className="hidden border-b border-slate-100 bg-[#fafaf9] sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <span className="text-[11px] font-medium text-slate-500">
            {todayDate}
          </span>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <Globe2 className="h-3.5 w-3.5 text-red-600" />
            இலங்கை & உலகச் செய்திகள்
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex h-[64px] items-center justify-between sm:h-[76px]">
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--customer-accent)] text-white shadow-[0_6px_18px_rgba(229,29,42,0.2)] transition duration-300 group-hover:scale-105 sm:h-11 sm:w-11">
              <Newspaper className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-[22px] font-black leading-none tracking-tight text-[#17202b] sm:text-[27px]">
                  சங்கதி
                </span>

                <span className="hidden rounded-full bg-red-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] text-red-600 sm:inline-block">
                  News
                </span>
              </div>

              <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.24em] text-slate-400">
                SANGATHE MEDIA
              </span>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              aria-label="தேடல்"
              className="group flex min-h-11 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-sm font-bold text-neutral-800 transition hover:border-red-300 hover:bg-red-50"
            >
              <Search className="h-[18px] w-[18px] text-[var(--customer-accent)] transition group-hover:scale-110" />
              <span>தேடல்</span>
            </Link>
          </div>
        </div>
      </div>

    </header>
  );
}
