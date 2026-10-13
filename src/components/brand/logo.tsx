import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Logotipo oficial (archivo original recortado, sin modificaciones de diseño). */
export function Logo({
  variant = "dark",
  className,
  href = "/",
  priority,
}: {
  variant?: "dark" | "light";
  className?: string;
  href?: string | null;
  priority?: boolean;
}) {
  const img = (
    <Image
      src={variant === "light" ? "/images/logo-wordmark-light.png" : "/images/logo-wordmark.png"}
      alt="Good Life Wellness Fest"
      width={438}
      height={109}
      priority={priority}
      className={cn("h-auto w-36 sm:w-40", className)}
    />
  );
  if (!href) return img;
  return (
    <Link href={href} aria-label="Good Life Wellness Fest — inicio" className="inline-flex shrink-0">
      {img}
    </Link>
  );
}
