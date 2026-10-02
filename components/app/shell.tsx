"use client";

import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CommandMenu, type RecentCall } from "./command-menu";
import { CloseButton } from "./overlay";
import { ShellContext, type Range, type ShellApi, type ToastTone } from "./shell-context";
import { Sidebar, type SiteFilter } from "./sidebar";

const COLLAPSE_KEY = "ossian.sidebar.collapsed";

type Toast = { id: number; message: string; tone: ToastTone };

export function Shell({
  children,
  liveCount,
  recentCalls,
}: {
  children: React.ReactNode;
  liveCount: number;
  recentCalls: RecentCall[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [range, setRange] = useState<Range>("30j");
  const [site, setSite] = useState<SiteFilter>("all");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);

  const toggleCollapse = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });

  // Close the mobile drawer on navigation.
  useEffect(() => setNavOpen(false), [pathname]);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock scroll while the mobile drawer is open.
  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const api = useMemo<ShellApi>(
    () => ({ openNav: () => setNavOpen(true), openCommand: () => setCmdOpen(true), range, setRange, toast }),
    [range, toast],
  );

  const sidebarProps = { liveCount, site, onSiteChange: setSite };

  return (
    <ShellContext.Provider value={api}>
      <div className="flex min-h-dvh bg-background text-foreground">
        {/* Desktop / tablet sidebar */}
        <aside
          data-collapsed={collapsed}
          className="group/sb sticky top-0 z-40 hidden h-dvh shrink-0 border-r border-border bg-subtle transition-[width] duration-200 ease-out md:block md:w-[60px] lg:w-[248px] lg:data-[collapsed=true]:w-[60px]"
        >
          <Sidebar {...sidebarProps} collapsed={collapsed} onToggleCollapse={toggleCollapse} />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {navOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <motion.div
                className="absolute inset-0 bg-[oklch(0.15_0.01_280/0.3)] backdrop-blur-[2px] dark:bg-[oklch(0_0_0/0.55)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setNavOpen(false)}
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className="absolute inset-y-0 left-0 w-[284px] max-w-[85vw] border-r border-border bg-subtle shadow-float"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <CloseButton onClick={() => setNavOpen(false)} className="absolute top-3 right-3 z-10" />
                <Sidebar {...sidebarProps} mobile onNavigate={() => setNavOpen(false)} />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>

      <CommandMenu open={cmdOpen} onClose={() => setCmdOpen(false)} recentCalls={recentCalls} />

      {/* Toasts */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-border bg-popover px-3.5 py-3 text-[13px] shadow-float"
            >
              <span
                className={cn(
                  "[&_svg]:size-4",
                  t.tone === "success" ? "text-success" : t.tone === "danger" ? "text-danger" : "text-info",
                )}
              >
                {t.tone === "success" ? <CircleCheck /> : t.tone === "danger" ? <TriangleAlert /> : <Info />}
              </span>
              <span className="flex-1">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ShellContext.Provider>
  );
}
