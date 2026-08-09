import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lemma keeps its agent guidance in rules/ and docs/; Next's generated AGENTS.md and
  // CLAUDE.md would be a second, unmaintained source of the same thing.
  agentRules: false,
  // The floating dev badge sits over the bottom-left of every page, which gets in the
  // way when checking layouts at small viewports.
  devIndicators: false,
  // Shiki ships every grammar and theme; only the ones imported in
  // src/lib/code/highlight.ts are bundled, so keep it out of the client graph.
  serverExternalPackages: ["shiki"],
};

export default nextConfig;
