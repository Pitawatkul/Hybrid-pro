import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // next-pwa injects a `webpack` config even when disabled in dev, which
  // Turbopack (the Next.js 16 default for `next dev`) refuses to run with.
  // An empty turbopack config silences that check for dev; `next build` uses
  // the explicit --webpack flag (see package.json) so PWA generation still works.
  turbopack: {},
};

export default withPWA(nextConfig);
