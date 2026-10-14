import Link from "next/link";

type Category = {
  id: string;
  slug: string;
  name: string;
};

type CategoryNavProps = {
  categories: Category[];
};

export function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <nav aria-label="செய்திப் பிரிவுகள்" className="customer-category-nav sticky top-11 z-40 border-y border-neutral-900 bg-white text-neutral-900 sm:top-10">
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          {/* Home */}
          <Link
            href="/"
            className="relative flex min-h-11 shrink-0 items-center px-3 text-[12px] font-extrabold text-[#e51d2a] transition sm:min-h-0 sm:py-3.5"
          >
            முகப்பு
            <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[#e51d2a]" />
          </Link>

          {/* Categories */}
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="flex min-h-11 shrink-0 items-center px-3 text-[12px] font-semibold text-neutral-600 transition hover:text-[#e51d2a] sm:min-h-0 sm:py-3.5"
            >
              {category.name}
            </Link>
          ))}

          <div className="mx-1 hidden h-5 w-px shrink-0 bg-neutral-200 sm:block" />

          <Link
            href="/regions"
            className="flex min-h-11 shrink-0 items-center px-3 text-[12px] font-semibold text-neutral-600 transition hover:text-[#e51d2a] sm:min-h-0 sm:py-3.5"
          >
            பிராந்தியங்கள்
          </Link>

          <Link
            href="/video"
            className="flex min-h-11 shrink-0 items-center px-3 text-[12px] font-semibold text-neutral-600 transition hover:text-[#e51d2a] sm:min-h-0 sm:py-3.5"
          >
            வீடியோ
          </Link>

          <Link
            href="/photo"
            className="flex min-h-11 shrink-0 items-center px-3 text-[12px] font-semibold text-neutral-600 transition hover:text-[#e51d2a] sm:min-h-0 sm:py-3.5"
          >
            புகைப்படம்
          </Link>

          <Link
            href="/archive"
            className="flex min-h-11 shrink-0 items-center px-3 text-[12px] font-semibold text-neutral-800 transition hover:text-[#e51d2a] visited:text-neutral-800 sm:min-h-0 sm:py-3.5"
          >
            காப்பகம்
          </Link>
        </div>
      </div>
    </nav>
  );
}
