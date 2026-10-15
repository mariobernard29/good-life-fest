import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="display text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "warning" | "danger" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "warning" && "text-warning", tone === "danger" && "text-destructive")}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Meter({ label, value, max, sub }: { label: ReactNode; value: number; max: number; sub?: ReactNode }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const over = value > max;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate">{label}</span>
        <span className={cn("shrink-0 tabular-nums text-muted-foreground", over && "font-medium text-destructive")}>
          {value}/{max} · {max > 0 ? Math.round((value / max) * 100) : 0}%
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full", over ? "bg-destructive" : pct >= 90 ? "bg-sunset" : "bg-olive")} style={{ width: `${pct}%` }} />
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

const TONES = {
  green: "bg-success/12 text-success",
  amber: "bg-warning/15 text-warning",
  red: "bg-destructive/10 text-destructive",
  gray: "bg-secondary text-muted-foreground",
  olive: "bg-accent text-olive",
} as const;

export function Pill({ tone = "gray", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone])}>{children}</span>;
}

export const ORDER_STATUS: Record<string, { label: string; tone: keyof typeof TONES }> = {
  pending: { label: "Pendiente", tone: "amber" },
  awaiting_payment: { label: "Pago por confirmar", tone: "amber" },
  paid: { label: "Pagado", tone: "green" },
  failed: { label: "Fallido", tone: "red" },
  expired: { label: "Vencido", tone: "gray" },
  cancelled: { label: "Cancelado", tone: "gray" },
  refunded: { label: "Reembolsado", tone: "red" },
  partially_refunded: { label: "Reembolso parcial", tone: "amber" },
};

export const TICKET_STATUS: Record<string, { label: string; tone: keyof typeof TONES }> = {
  pending_payment: { label: "Pago pendiente", tone: "amber" },
  valid: { label: "Válido", tone: "green" },
  checked_in: { label: "Ingresó", tone: "olive" },
  cancelled: { label: "Cancelado", tone: "red" },
  refunded: { label: "Reembolsado", tone: "red" },
};

export const CHANNEL_LABEL: Record<string, string> = { online: "En línea", box_office: "Taquilla", complimentary: "Cortesía" };
export const PAYMENT_LABEL: Record<string, string> = {
  stripe: "En línea",
  cash: "Efectivo",
  card_terminal: "Terminal",
  transfer: "Transferencia",
  complimentary: "Cortesía",
};

export function SearchForm({ placeholder, defaultValue, children }: { placeholder: string; defaultValue?: string; children?: ReactNode }) {
  return (
    <form className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" role="search">
      <div className="relative flex-1 sm:min-w-64">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      {children}
      <Button type="submit" variant="outline" className="h-10">
        Filtrar
      </Button>
    </form>
  );
}

export function FilterSelect({ name, value, options, label }: { name: string; value?: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <select name={name} defaultValue={value ?? ""} aria-label={label} className="h-10 rounded-lg border border-input bg-card px-3 text-sm">
      <option value="">{label}: todos</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Pagination({ page, total, pageSize, params }: { page: number; total: number; pageSize: number; params: Record<string, string | undefined> }) {
  const pages = Math.max(Math.ceil(total / pageSize), 1);
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
    sp.set("pagina", String(p));
    return `?${sp.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total} registro{total === 1 ? "" : "s"} · página {page} de {pages}
      </span>
      <div className="flex gap-1">
        <Button asChild variant="outline" size="sm" aria-disabled={page <= 1} className={cn(page <= 1 && "pointer-events-none opacity-40")}>
          <Link href={href(page - 1)}>
            <ChevronLeft /> Anterior
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" aria-disabled={page >= pages} className={cn(page >= pages && "pointer-events-none opacity-40")}>
          <Link href={href(page + 1)}>
            Siguiente <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl border border-border bg-card">{children}</div>;
}

/** Botones de descarga Excel / PDF hacia un route handler de /admin/exportar. */
export function ExportLinks({ href, label, params }: { href: string; label?: string; params?: Record<string, string | undefined> }) {
  const url = (formato: "xlsx" | "pdf") => {
    const sp = new URLSearchParams({ formato });
    Object.entries(params ?? {}).forEach(([k, v]) => v && sp.set(k, v));
    return `${href}?${sp.toString()}`;
  };
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1" role="group" aria-label={`Exportar ${label ?? ""}`.trim()}>
      <span className="flex items-center gap-1.5 pr-1 pl-2.5 text-xs text-muted-foreground">
        <Download className="size-3.5" /> {label ? `Exportar ${label.toLowerCase()}` : "Exportar"}
      </span>
      <Button asChild size="sm" variant="ghost" className="rounded-full">
        <a href={url("xlsx")} download>
          <FileSpreadsheet /> Excel
        </a>
      </Button>
      <Button asChild size="sm" variant="ghost" className="rounded-full">
        <a href={url("pdf")} download>
          <FileText /> PDF
        </a>
      </Button>
    </div>
  );
}
