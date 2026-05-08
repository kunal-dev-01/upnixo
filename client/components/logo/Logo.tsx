import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.svg";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <Link
      aria-label="Logo"
      href="/"
      className={`flex items-center justify-center select-none gap-0 ${className}`}
    >
      <Image
        src={logo}
        alt="Logo"
        className="size-6 object-contain"
        loading="eager"
        priority
        width={40}
        height={40}
      />

      {showText && (
        <h1 className="text-2xl font-bold leading-none tracking-tighter -ml-px">
          Pnixo
        </h1>
      )}
    </Link>
  );
}
