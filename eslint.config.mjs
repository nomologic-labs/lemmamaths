// eslint-config-next 16 ships flat configs directly, so they are composed here rather
// than translated through FlatCompat.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "scripts/**", "next-env.d.ts"] },
  ...coreWebVitals,
  ...typescript,
];

export default config;
