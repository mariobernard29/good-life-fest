"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarRange,
  ClipboardList,
  DoorOpen,
  Handshake,
  LayoutDashboard,
  Menu,
  Mic2,
  ScanLine,
  Settings,
  Store,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Permission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

const NAV: { group: string; items: { href: string; label: string; icon: React.ElementType; perm: Permission; exact?: boolean }[] }[] = [
  {
    group: "Operación",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard.view", exact: true },
      { href: "/admin/ventas", label: "Ventas y taquilla", icon: BadgeDollarSign, perm: "orders.view" },
      { href: "/admin/asistentes", label: "Asistentes", icon: Users, perm: "attendees.view" },
      { href: "/admin/accesos", label: "Accesos", icon: DoorOpen, perm: "checkin.view_log" },
      { href: "/admin/incidencias", label: "Incidencias", icon: AlertTriangle, perm: "incidents.manage" },
    ],
  },
  {
    group: "Programa",
    items: [
      { href: "/admin/actividades", label: "Clases y talleres", icon: CalendarRange, perm: "sessions.manage" },
      { href: "/admin/conferencias", label: "Conferencias", icon: Mic2, perm: "sessions.manage" },
      { href: "/admin/reservas", label: "Reservas", icon: ClipboardList, perm: "reservations.manage" },
    ],
  },
  {
    group: "Configuración",
    items: [
      { href: "/admin/entradas", label: "Tipos de entrada", icon: Ticket, perm: "ticket_types.manage" },
      { href: "/admin/expositores", label: "Expositores", icon: Store, perm: "content.manage" },
      { href: "/admin/patrocinadores", label: "Patrocinadores", icon: Handshake, perm: "content.manage" },
      { href: "/admin/usuarios", label: "Personal y permisos", icon: UserCog, perm: "staff.manage" },
      { href: "/admin/configuracion", label: "Evento", icon: Settings, perm: "settings.manage" },
    ],
  },
];

function NavList({ permissions, onNavigate }: { permissions: Set<string>; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6" aria-label="Administración">
      {NAV.map((g) => {
        const items = g.items.filter((i) => permissions.has(i.perm));
        if (!items.length) return null;
        return (
          <div key={g.group}>
            <p className="eyebrow mb-2 px-3 text-[0.62rem]">{g.group}</p>
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/75 hover:bg-sidebar-accent hover:text-foreground",
                        active && "bg-sidebar-accent font-medium text-foreground",
                      )}
                    >
                      <Icon className="size-4" /> {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {permissions.has("checkin.perform") && (
        <Link href="/check-in" onClick={onNavigate} className="flex items-center justify-center gap-2 rounded-lg bg-olive px-3 py-2.5 text-sm font-medium text-primary-foreground">
          <ScanLine className="size-4" /> Abrir control de acceso
        </Link>
      )}
    </nav>
  );
}

export function AdminShell({
  permissions,
  eventName,
  userEmail,
  roleLabel,
  children,
}: {
  permissions: string[];
  eventName: string;
  userEmail: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const perms = new Set(permissions);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Logo className="w-32" href="/admin" />
        <p className="mt-2 truncate text-xs text-muted-foreground">{eventName}</p>
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavList permissions={perms} />
        </div>
        <div className="mt-4 border-t border-sidebar-border pt-3 text-xs">
          <p className="truncate font-medium">{userEmail}</p>
          <p className="text-muted-foreground">{roleLabel}</p>
          <Link href="/mi-cuenta" className="mt-1 inline-block text-olive hover:underline">
            Ir a mi cuenta
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <Logo className="w-28" href="/admin" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú de administración">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-4">
              <SheetHeader className="px-0">
                <SheetTitle className="text-left text-sm">{eventName}</SheetTitle>
              </SheetHeader>
              <NavList permissions={perms} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
