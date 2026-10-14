// src/components/site-footer.tsx
import Link from "next/link";
import { Newspaper, ShieldCheck, Mail, Globe } from "lucide-react";
import { subscribeNewsletter } from "@/actions/newsletter";
import { PushSubscribe } from "@/components/push-subscribe";

export function SiteFooter() {
  const socialLinks=[{label:"Facebook",url:process.env.NEXT_PUBLIC_FACEBOOK_URL},{label:"YouTube",url:process.env.NEXT_PUBLIC_YOUTUBE_URL},{label:"WhatsApp",url:process.env.NEXT_PUBLIC_WHATSAPP_URL},{label:"X",url:process.env.NEXT_PUBLIC_X_URL}].filter((item):item is {label:string;url:string}=>Boolean(item.url));
  return (
    <footer className="bg-slate-950 text-slate-300 font-sans border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <Newspaper className="h-7 w-7 text-red-500" />
              <span className="text-2xl font-black text-white tracking-tight">சங்கதி</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              சங்கதி டிஜிட்டல் ஊடக வலையமைப்பு. நடுநிலையான, நம்பகமான, உடனடி செய்திகளை வழங்கும் முன்னணி செய்தித் தளம்.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400 text-xs">
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> இலங்கை</span>
              <span>•</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> சரிபார்க்கப்பட்டது</span>
            </div>
          </div>

          {/* Quick News Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 border-l-2 border-red-500 pl-2">
              செய்திப் பிரிவுகள்
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/category/local-news" className="hover:text-white transition">உள்ளூர் செய்திகள்</Link></li>
              <li><Link href="/category/politics" className="hover:text-white transition">அரசியல்</Link></li>
              <li><Link href="/category/business-economy" className="hover:text-white transition">பொருளாதாரம்</Link></li>
              <li><Link href="/category/sports" className="hover:text-white transition">விளையாட்டு</Link></li>
              <li><Link href="/category/world" className="hover:text-white transition">உலகம்</Link></li>
            </ul>
          </div>

          {/* Google Trust & Legal Pages (RFP Section 24) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 border-l-2 border-red-500 pl-2">
              கொள்கைகள் & விதிகளும்
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/about-us" className="hover:text-white transition">எங்களைப் பற்றி (About Us)</Link></li>
              <li><Link href="/editorial-policy" className="hover:text-white transition">ஆசிரியர் கொள்கை (Editorial Policy)</Link></li>
              <li><Link href="/corrections-policy" className="hover:text-white transition">திருத்தக் கொள்கை (Corrections)</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition">தனியுரிமைக் கொள்கை (Privacy Policy)</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-white transition">விதிமுறைகள் (Terms)</Link></li>
              <li><Link href="/copyright" className="hover:text-white transition">பதிப்புரிமை (Copyright)</Link></li>
              <li><Link href="/contact-us" className="hover:text-white transition">தொடர்புகளுக்கு (Contact Us)</Link></li>
            </ul>
          </div>

          {/* Contact & Social Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 border-l-2 border-red-500 pl-2">
              செய்தி அறை தொடர்பு
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              செய்தித் தகவல்கள், திருத்தங்கள் மற்றும் வாசகர் கருத்துகளுக்கு எம்முடன் இணையுங்கள்.
            </p>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-red-400" /> news@sangathe.com</p>
              <p className="text-slate-400 text-[11px]">யாழ்ப்பாணம் & கொழும்பு, இலங்கை.</p>
            </div>
            {socialLinks.length>0&&<div className="mt-3 flex flex-wrap gap-2">{socialLinks.map(item=><a key={item.label} href={item.url} target="_blank" rel="noreferrer" className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold hover:border-red-500 hover:text-white">{item.label}</a>)}</div>}
            <form action={subscribeNewsletter} className="mt-4"><input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true"/><label className="text-xs font-bold text-white">செய்திமடல் சந்தா<input type="email" name="email" required placeholder="உங்கள் மின்னஞ்சல்" className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#e51d2a] focus:ring-2 focus:ring-red-500/25"/></label><button className="mt-2 min-h-11 w-full rounded-full bg-[#e51d2a] px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#c91624] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300">சந்தா பதிவு</button></form>
            <div className="mt-3"><PushSubscribe publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}/></div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-slate-900 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} சங்கதி (Sangathe Media). அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.</p>
          <p>Designed for High Performance & Google News Standards.</p>
        </div>
      </div>
    </footer>
  );
}
