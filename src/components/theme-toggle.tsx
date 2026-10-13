"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

const KEY = "qa-theme";

function currentTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export function ThemeToggle({ toDark, toLight }: { toDark: string; toLight: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light" as const);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(KEY, next);
        } catch {
          /* storage unavailable: theme still applies for this page view */
        }
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-2 hover:bg-surface-2 hover:text-ink"
      aria-label={next === "dark" ? toDark : toLight}
      title={next === "dark" ? toDark : toLight}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** Inline script: applies the saved or system theme before first paint (no flash). */
export const themeScript = `(function(){try{var t=localStorage.getItem('${KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})();`;
