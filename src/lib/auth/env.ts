import "server-only";

const REQUIRED_AUTH_ENV_VARS = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

export type RequiredAuthEnvVar = (typeof REQUIRED_AUTH_ENV_VARS)[number];

function isConfigured(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !trimmed.startsWith("replace-with-");
}

/** Returns env var names that must be set before Google OAuth can run. */
export function getMissingAuthEnvVars(): RequiredAuthEnvVar[] {
  return REQUIRED_AUTH_ENV_VARS.filter((name) => !isConfigured(process.env[name]));
}

export function isAuthConfigured(): boolean {
  return getMissingAuthEnvVars().length === 0;
}
