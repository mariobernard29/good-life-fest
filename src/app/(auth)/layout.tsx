import Image from "next/image";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image src="/images/hero-logo-lago.jpg" alt="Good Life Wellness Fest en el Lago de los Ávilas" fill sizes="50vw" className="object-cover" priority />
      </div>
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo className="w-32" />
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
