"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// /ssr variant has no hooks and no context, so it is safe in both server and
// client components. The root barrel pulls in IconContext and breaks any
// Server Component that touches it.
import { House, SlidersHorizontal, ChartLineUp } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/control", label: "Control", icon: SlidersHorizontal },
  { href: "/charts", label: "Charts", icon: ChartLineUp },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-3xl items-center gap-1 px-4 py-2">
        <span className="mr-4 text-sm font-semibold">IoT Dashboard</span>
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={16} weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
