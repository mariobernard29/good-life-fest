import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGOS = {
  // Good Life Wellness (marca paraguas): logotipo nuevo, recortado sin modificaciones.
  wellness: {
    dark: "/images/logo-wellness.png",
    light: "/images/logo-wellness-light.png",
    width: 438,
    height: 108,
    alt: "Good Life Wellness",
    home: "/",
  },
  // Good Life Wellness Fest (el festival).
  fest: {
    dark: "/images/logo-wordmark.png",
    light: "/images/logo-wordmark-light.png",
    width: 438,
    height: 109,
    alt: "Good Life Wellness Fest",
    home: "/festival",
  },
} as const;

/** Logotipo oficial (archivo original recortado, sin modificaciones de diseño). */
export function Logo({
  brand = "fest",
  variant = "dark",
  className,
  href,
  priority,
}: {
  brand?: keyof typeof LOGOS;
  variant?: "dark" | "light";
  className?: string;
  /** Destino del enlace; `null` = sin enlace. Por defecto, el inicio de cada marca. */
  href?: string | null;
  priority?: boolean;
}) {
  const logo = LOGOS[brand];
  const img = (
    <Image
      src={variant === "light" ? logo.light : logo.dark}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      priority={priority}
      className={cn("h-auto w-36 sm:w-40", className)}
    />
  );
  if (href === null) return img;
  return (
    <Link href={href ?? logo.home} aria-label={`${logo.alt} — inicio`} className="inline-flex shrink-0">
      {img}
    </Link>
  );
}
