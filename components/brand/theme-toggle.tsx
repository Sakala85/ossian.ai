"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      setTheme((localStorage.getItem("ossian-theme") as Theme) || "system");
    } catch {}
  }, []);

  const choose = (t: Theme) => {
    setTheme(t);
    try {
      localStorage.setItem("ossian-theme", t);
    } catch {}
    apply(t);
  };

  const opts: { v: Theme; icon: React.ReactNode; label: string }[] = [
    { v: "light", icon: <Sun />, label: "Clair" },
    { v: "dark", icon: <Moon />, label: "Sombre" },
    { v: "system", icon: <Monitor />, label: "Système" },
  ];

  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-full border border-border bg-muted p-0.5", className)}>
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-label={o.label}
          title={o.label}
          onClick={() => choose(o.v)}
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-full transition-colors [&_svg]:size-3.5",
            theme === o.v ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
