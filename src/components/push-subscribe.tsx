"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

function applicationKey(value: string) { const padding = "=".repeat((4 - value.length % 4) % 4); const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(base64), character => character.charCodeAt(0)); }

export function PushSubscribe({ publicKey }: { publicKey?: string }) {
  const [supported,setSupported]=useState(false); const [active,setActive]=useState(false); const [busy,setBusy]=useState(false);
  useEffect(()=>{let cancelled=false;async function initialize(){await Promise.resolve();const canSubscribe=Boolean(publicKey&&"serviceWorker" in navigator&&"PushManager" in window);if(!cancelled)setSupported(canSubscribe);if(canSubscribe){const registration=await navigator.serviceWorker.getRegistration();const subscription=await registration?.pushManager.getSubscription();if(!cancelled)setActive(Boolean(subscription));}}initialize();return()=>{cancelled=true;};},[publicKey]);
  if(!supported)return null;
  async function toggle(){setBusy(true);try{const registration=await navigator.serviceWorker.register("/sw.js");const existing=await registration.pushManager.getSubscription();if(existing){await fetch("/api/push/subscribe",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:existing.endpoint})});await existing.unsubscribe();setActive(false);}else{const permission=await Notification.requestPermission();if(permission!=="granted")return;const subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationKey(publicKey!)});await fetch("/api/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(subscription)});setActive(true);}}finally{setBusy(false);}}
  return <button type="button" onClick={toggle} disabled={busy} className="flex min-h-11 items-center gap-2 rounded-full bg-[#e51d2a] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#c91624] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-wait disabled:opacity-60">{active?<BellOff className="h-4 w-4" aria-hidden="true"/>:<Bell className="h-4 w-4" aria-hidden="true"/>}{busy?"சற்று பொறுங்கள்…":active?"செய்தி அறிவிப்புகளை நிறுத்து":"செய்தி அறிவிப்புகளை இயக்கு"}</button>;
}
