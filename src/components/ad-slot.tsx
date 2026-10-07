// src/components/ad-slot.tsx
interface AdSlotProps {
  slotId?: string;
  format?: "leaderboard" | "in-article" | "square";
}

export function AdSlot({ format = "leaderboard" }: AdSlotProps) {
  return (
    <div className="my-6 flex flex-col items-center justify-center">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 select-none">
        — விளம்பரம் / Advertisement —
      </span>

      {/* Leaderboard Banner (Mobile: 320x100 / Desktop: 728x90) */}
      {format === "leaderboard" && (
        <div className="w-full max-w-4xl h-24 md:h-28 bg-slate-200/70 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-xs font-bold text-slate-500">விளம்பர இடம் (Leaderboard Ad Slot)</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Google AdSense / Direct Banner (728x90 / 320x100)</p>
          </div>
        </div>
      )}

      {/* In-Article Ad (Mobile & Desktop: 300x250 Medium Rectangle) */}
      {format === "in-article" && (
        <div className="w-full max-w-md h-60 bg-slate-200/70 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-xs font-bold text-slate-500">செய்திக்குள் விளம்பரம் (In-Article Ad)</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Google AdSense / 300x250 Display Ad</p>
          </div>
        </div>
      )}

      {/* Square Banner */}
      {format === "square" && (
        <div className="w-64 h-64 bg-slate-200/70 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-xs font-bold text-slate-500">விளம்பரப் பகுதி (Square Ad)</p>
            <p className="text-[10px] text-slate-400 mt-0.5">250x250 Ad Banner</p>
          </div>
        </div>
      )}
    </div>
  );
}