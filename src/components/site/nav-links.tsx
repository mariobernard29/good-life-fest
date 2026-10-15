"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Button } from "@/components/ui/button";
import { FEST } from "@/content/festival";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

export function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground",
              active && "bg-secondary text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="rounded-full lg:hidden" aria-label="Abrir menú">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] max-w-sm bg-background">
        <SheetHeader>
          <SheetTitle className="display text-2xl">Menú</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4" aria-label="Menú móvil">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="display rounded-lg px-2 py-3 text-3xl text-foreground/90 hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-6 grid gap-2">
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full">
              <a href={FEST.instagramUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                <InstagramIcon className="size-4" /> Instagram
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full">
              <Link href="/mi-cuenta" onClick={() => setOpen(false)}>
                Mi cuenta
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12 rounded-full">
              <Link href="/entradas" onClick={() => setOpen(false)}>
                Boletos
              </Link>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
