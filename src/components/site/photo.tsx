"use client";

import Image, { type ImageLoader } from "next/image";
import type { Photo as PhotoData } from "@/content/images";
import { cn } from "@/lib/utils";

/** Unsplash (imgix) redimensiona en su CDN: evitamos descargar originales de 6000 px. */
const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}?auto=format&fit=crop&w=${width}&q=${quality ?? 72}`;

export function Photo({
  photo,
  className,
  sizes = "100vw",
  priority,
  imgClassName,
}: {
  photo: PhotoData;
  className?: string;
  sizes?: string;
  priority?: boolean;
  imgClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        loader={photo.kind === "unsplash" ? unsplashLoader : undefined}
        className={cn("object-cover transition-transform duration-700 ease-out", imgClassName)}
      />
    </div>
  );
}
