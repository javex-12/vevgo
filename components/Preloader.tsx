"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MIN_SHOW = 1050;
const MAX_SHOW = 3200;
const LIFT_MS = 850;

/**
 * Brand splash. It is the same lockup as the header, so the first thing people
 * see is the thing they will keep seeing at the top of every page. The panel
 * waits for the first screen of photos to load, then lifts away like a blind.
 */
export function Preloader() {
  const [phase, setPhase] = useState<"showing" | "leaving" | "gone">("showing");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const skip = window.setTimeout(() => setPhase("gone"), 0);
      return () => window.clearTimeout(skip);
    }

    const startedAt = performance.now();
    const timers: number[] = [];
    let lifted = false;

    const lift = () => {
      if (lifted) return;
      lifted = true;
      window.clearTimeout(cap);
      const wait = Math.max(0, MIN_SHOW - (performance.now() - startedAt));
      timers.push(window.setTimeout(() => setPhase("leaving"), wait));
      timers.push(window.setTimeout(() => setPhase("gone"), wait + LIFT_MS));
    };

    // Never keep people waiting on a slow image.
    const cap = window.setTimeout(lift, MAX_SHOW);

    if (document.readyState === "complete") {
      lift();
    } else {
      window.addEventListener("load", lift, { once: true });
    }

    return () => {
      window.clearTimeout(cap);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("load", lift);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`intro ${phase === "leaving" ? "intro--out" : ""}`}
      role="status"
      aria-label="Loading Vevgo"
    >
      <div className="intro__inner">
        <div className="intro__logo">
          <Image
            src="/brand/vevgo-wordmark-520.png"
            alt="Vevgo"
            width={520}
            height={157}
            priority
            className="h-10 w-auto sm:h-12"
          />
        </div>
        <p className="intro__tag">Fresh groceries, delivered</p>
        <div className="intro__bar" aria-hidden>
          <span />
        </div>
      </div>
    </div>
  );
}
