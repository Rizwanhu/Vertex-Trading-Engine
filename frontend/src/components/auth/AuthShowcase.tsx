"use client";
import Image from "next/image";

const SHOWCASE_IMAGE =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWxnb3JpdGhtaWMlMjB0cmFkaW5nfGVufDB8fDB8fHww";

export function AuthShowcase() {
  return (
    <div className="auth-showcase">
      <div className="auth-showcase-img-wrap">
        <Image
          src={SHOWCASE_IMAGE}
          alt="Algorithmic trading"
          fill
          quality={92}
          priority
          sizes="(min-width: 1280px) 580px, (min-width: 1024px) 50vw, 0px"
          className="auth-showcase-img"
        />
      </div>
      <div className="auth-showcase-vignette" aria-hidden />
      <div className="auth-showcase-fade" aria-hidden />
    </div>
  );
}
