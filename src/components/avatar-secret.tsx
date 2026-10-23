"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { siteConfig } from "../../site.config";

export function AvatarSecret() {
  const router = useRouter();
  const pathname = usePathname();
  const sequence = useRef({ count: 0, at: 0, unlocking: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hint, setHint] = useState("");
  useEffect(() => {
    const reset = (event?: Event) => {
      if (event?.target instanceof Element && event.target.closest(".avatar-secret")) return;
      if (event && sequence.current.unlocking) return;
      sequence.current = { count: 0, at: 0, unlocking: false }; setHint(""); clearTimeout(timer.current);
    };
    reset();
    document.addEventListener("pointerdown", reset);
    return () => { document.removeEventListener("pointerdown", reset); clearTimeout(timer.current); };
  }, [pathname]);

  function click() {
    if (sequence.current.unlocking) return;
    const now = performance.now();
    const count = now - sequence.current.at <= 1000 ? sequence.current.count + 1 : 1;
    sequence.current = { count, at: now, unlocking: false };
    clearTimeout(timer.current);
    if (count === 1) setHint("");
    if (count === 5) setHint("你再点一次试试");
    if (count === 8) {
      sequence.current.unlocking = true; setHint("真拿你没办法");
      timer.current = setTimeout(() => router.push("/play"), 900); return;
    }
    timer.current = setTimeout(() => { sequence.current.count = 0; setHint(""); }, 2200);
  }

  return <span className="avatar-secret">
    <button type="button" className="avatar-secret-button" onClick={click} aria-label={`${siteConfig.name} 的头像`}>
      <Image className="brand-mark" src={siteConfig.avatar} width={28} height={28} alt="" />
    </button>
    <span className="avatar-secret-hint" role="status" aria-live="polite">{hint && <span key={hint}>{hint}</span>}</span>
  </span>;
}
