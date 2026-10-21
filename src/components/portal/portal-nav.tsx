"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, Home, Sparkles, Ticket, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/mi-cuenta", label: "Inicio", icon: Home, exact: true },
  { href: "/mi-cuenta/entradas", label: "Entradas", icon: Ticket },
  { href: "/mi-cuenta/programa", label: "Reservar", icon: Sparkles },
  { href: "/mi-cuenta/reservas", label: "Mi agenda", icon: CalendarHeart },
  { href: "/mi-cuenta/perfil", label: "Perfil", icon: UserRound },
];

export function PortalNav({ variant }: { variant: "top" | "bottom" }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  if (variant === "top") {
    return (
      <nav aria-label="Mi cuenta" className="hidden items-center gap-1 md:flex">
        {ITEMS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={isActive(i.href, i.exact) ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm text-foreground/70 hover:bg-secondary hover:text-foreground",
              isActive(i.href, i.exact) && "bg-secondary text-foreground",
            )}
          >
            {i.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Mi cuenta"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center gap-1 py-2.5 text-[0.68rem] text-muted-foreground", active && "text-olive")}
              >
                <Icon className={cn("size-5", active && "stroke-[2.25]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
