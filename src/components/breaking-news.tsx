import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

type BreakingNewsItem = {
  id: string;
  slug: string;
  title: string;
};

type BreakingNewsProps = {
  news: BreakingNewsItem[];
};

export function BreakingNews({ news }: BreakingNewsProps) {
  if (!news.length) return null;

  const renderHeadlines = (copy = false) => news.map((item, index) => (
    <div key={`${copy ? "copy-" : ""}${item.id}`} className="flex shrink-0 items-center">
      {index > 0 && <span className="mx-3 h-1 w-1 rounded-full bg-white/55 sm:mx-4" />}
      <Link
        href={`/news/${item.slug}`}
        tabIndex={copy ? -1 : undefined}
        className="group flex min-h-11 items-center gap-2 whitespace-nowrap px-3 text-xs font-semibold text-white/95 transition hover:text-white sm:min-h-10 sm:px-4"
      >
        <span>{item.title}</span>
        <ArrowRight className="h-3 w-3 opacity-70 transition group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true" />
      </Link>
    </div>
  ));

  return (
    <div role="region" aria-label="அவசரச் செய்திகள்" className="breaking-strip sticky top-0 z-50 overflow-hidden border-b border-red-950/20 bg-[#991b1b] text-white">
      <div className="mx-auto flex min-h-11 max-w-7xl items-stretch sm:min-h-10">
        {/* Label */}
        <div className="relative z-10 flex shrink-0 items-center gap-1.5 bg-[var(--customer-accent-deep)] px-3 sm:gap-2 sm:px-5">
          <Flame className="h-3.5 w-3.5 fill-current text-amber-300 sm:h-4 sm:w-4" />

          <span className="text-[11px] font-black uppercase tracking-[0.12em] sm:text-xs">
            அவசரம்
          </span>
        </div>

        {/* News ticker */}
        <div className="breaking-ticker min-w-0 flex-1 overflow-hidden" aria-label="செய்தித் தலைப்புகள் தொடர்ந்து நகரும்">
          <div className="breaking-track flex w-max items-center" style={{ animationDuration: `${Math.max(22, news.length * 8)}s` }}>
            <div className="breaking-group flex shrink-0 items-center">{renderHeadlines()}</div>
            <div className="breaking-group breaking-group-copy flex shrink-0 items-center" aria-hidden="true">{renderHeadlines(true)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
