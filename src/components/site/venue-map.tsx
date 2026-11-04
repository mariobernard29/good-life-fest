"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Mosaicos vectoriales libres (OpenFreeMap / OpenStreetMap), recoloreados con la paleta de la marca.
const BASE_STYLE = "https://tiles.openfreemap.org/styles/positron";

const VENUE: [number, number] = [-109.0467, 25.8306];
const DOWNTOWN: [number, number] = [-108.9858, 25.7904];

const C = {
  land: "#f1eadc",
  residential: "#ebe2d0",
  building: "#e0d5bf",
  park: "#cfd6bb",
  wood: "#c3cdab",
  water: "#9fb2a0",
  roadMinor: "#fbf6ec",
  roadMajor: "#f6e3c4",
  motorway: "#d9a86c",
  casing: "#dccfb6",
  label: "#4f5b36",
  labelSoft: "#7b8466",
  halo: "#f4eee3",
};

/** Ajusta cada capa del estilo base a los colores de Good Life. */
function brandStyle(style: StyleSpecification): StyleSpecification {
  style.layers = style.layers
    .filter((l) => !l.id.startsWith("boundary") && !l.id.startsWith("label_country") && !l.id.includes("shield") && !l.id.startsWith("aeroway"))
    .map((layer) => {
      const l = layer as typeof layer & { paint?: Record<string, unknown>; layout?: Record<string, unknown> };
      const paint = { ...(l.paint ?? {}) };
      const id = l.id;
      if (l.type === "background") paint["background-color"] = C.land;
      else if (id === "water") paint["fill-color"] = C.water;
      else if (id === "waterway") paint["line-color"] = C.water;
      else if (id === "park") paint["fill-color"] = C.park;
      else if (id.startsWith("landcover")) paint["fill-color"] = C.wood;
      else if (id === "landuse_residential") paint["fill-color"] = C.residential;
      else if (id === "building") {
        paint["fill-color"] = C.building;
        paint["fill-outline-color"] = C.casing;
      } else if (l.type === "line" && id.includes("casing")) paint["line-color"] = C.casing;
      else if (l.type === "line" && id.includes("motorway")) paint["line-color"] = C.motorway;
      else if (l.type === "line" && id.includes("major")) paint["line-color"] = C.roadMajor;
      else if (l.type === "line" && (id.includes("highway") || id.includes("road"))) paint["line-color"] = C.roadMinor;
      else if (l.type === "line" && id.includes("rail")) paint["line-color"] = C.casing;
      else if (l.type === "symbol") {
        paint["text-color"] = id.startsWith("label_city") || id.startsWith("label_town") ? C.label : C.labelSoft;
        paint["text-halo-color"] = C.halo;
        paint["text-halo-width"] = 1.4;
        if (id.startsWith("water")) paint["text-color"] = "#55705c";
      }
      return { ...l, paint } as typeof layer;
    });
  return style;
}

function arc(a: [number, number], b: [number, number], steps = 48): [number, number][] {
  const ctrl: [number, number] = [(a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.35, (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.35];
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * ctrl[0] + t * t * b[0], u * u * a[1] + 2 * u * t * ctrl[1] + t * t * b[1]];
  });
}

/** Círculo aproximado de `km` de radio alrededor de un punto. */
function circle([lng, lat]: [number, number], km: number, steps = 64): [number, number][] {
  const dLat = km / 110.574;
  const dLng = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)];
  });
}

function markerEl(className: string, html: string) {
  const el = document.createElement("div");
  el.className = className;
  el.innerHTML = html;
  return el;
}

export function VenueMap({ venueLabel, cityLabel }: { venueLabel: string; cityLabel: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: MapLibreMap | undefined;
    let cancelled = false;
    const el = box.current;
    if (!el) return;

    // Se carga solo cuando el mapa está por entrar en pantalla.
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const [maplibre, style] = await Promise.all([
          import("maplibre-gl"),
          fetch(BASE_STYLE).then((r) => r.json() as Promise<StyleSpecification>),
        ]);
        if (cancelled) return;
        maplibre.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        map = new maplibre.Map({
          container: el,
          style: brandStyle(style),
          center: reduced ? VENUE : [-109.0, 25.79],
          zoom: reduced ? 14 : 10.5,
          pitch: reduced ? 35 : 0,
          bearing: reduced ? -12 : 0,
          attributionControl: { compact: true },
          cooperativeGestures: true,
        });
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => {
          if (!map) return;
          // Arco punteado (no es la ruta en calle) del centro de la ciudad a la sede.
          map.addSource("route", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: arc(DOWNTOWN, VENUE) } },
          });
          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-cap": "round" },
            paint: { "line-color": "#c58a4a", "line-width": 2.5, "line-dasharray": [1, 2.2] },
          });

          // OpenStreetMap aún no tiene dibujado el lago: marcamos la zona del recinto.
          map.addSource("venue-zone", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circle(VENUE, 0.32)] } },
          });
          map.addLayer({ id: "venue-zone", type: "fill", source: "venue-zone", paint: { "fill-color": "#a9b494", "fill-opacity": 0.35 } });
          map.addLayer({ id: "venue-zone-line", type: "line", source: "venue-zone", paint: { "line-color": "#4f5b36", "line-width": 1.2, "line-dasharray": [2, 2], "line-opacity": 0.7 } });

          new maplibre.Marker({
            element: markerEl("map-pin", `<span class="map-pin__pulse"></span><span class="map-pin__dot">✦</span><span class="map-pin__label">${venueLabel}<small>Good Life Wellness Fest</small></span>`),
            anchor: "center",
          })
            .setLngLat(VENUE)
            .addTo(map);
          new maplibre.Marker({ element: markerEl("map-tag", cityLabel), anchor: "center" }).setLngLat(DOWNTOWN).addTo(map);

          if (!reduced) {
            map.flyTo({ center: VENUE, offset: [-70, 30], zoom: 14, pitch: 40, bearing: -12, duration: 4200, essential: true });
          }
        });
      },
      { rootMargin: "200px" },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      map?.remove();
    };
  }, [venueLabel, cityLabel]);

  return <div ref={box} className="venue-map h-full w-full" role="region" aria-label={`Mapa: ${venueLabel}, ${cityLabel}`} />;
}
