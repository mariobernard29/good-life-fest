"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/format";

const OLIVE = "#4f5b36";
const GRID = "#e0d8c8";
const MUTED = "#646a5c";

function ChartTooltip({ active, payload, label, money }: { active?: boolean; payload?: { value: number }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground tabular-nums">{money ? formatMoney(payload[0].value) : payload[0].value}</p>
    </div>
  );
}

/** Ingresos confirmados por día (una sola serie). */
export function SalesByDayChart({ data }: { data: { day: string; revenue_cents: number; orders: number }[] }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay ventas confirmadas.</p>;
  const rows = data.map((d) => ({ ...d, label: d.day.slice(5).split("-").reverse().join("/") }));
  return (
    <div className="h-56" role="img" aria-label="Ingresos confirmados por día">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={4}>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} width={64} tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={(v: number) => formatMoney(v).replace(".00", "")} />
          <Tooltip cursor={{ fill: "rgba(79,91,54,0.06)" }} content={<ChartTooltip money />} />
          <Bar dataKey="revenue_cents" fill={OLIVE} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Entradas vendidas por tipo (barras horizontales, una sola serie). */
export function SoldByTypeChart({ data }: { data: { name: string; sold: number; quantity_total: number }[] }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-muted-foreground">Sin tipos de entrada.</p>;
  return (
    <div style={{ height: Math.max(data.length * 44, 120) }} role="img" aria-label="Entradas vendidas por tipo">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={130} tick={{ fill: "#1e231c", fontSize: 12 }} />
          <Tooltip cursor={{ fill: "rgba(79,91,54,0.06)" }} content={<ChartTooltip />} />
          <Bar dataKey="sold" fill={OLIVE} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
