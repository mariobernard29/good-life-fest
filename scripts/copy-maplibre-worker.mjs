// Copia el web worker de MapLibre a /public: el bundler no lo sirve por su cuenta.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/vendor", { recursive: true });
copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/vendor/maplibre-gl-worker.mjs");
