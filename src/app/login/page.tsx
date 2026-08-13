import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowRightIcon } from "@/components/ui/icons";
import { getMissingAuthEnvVars } from "@/lib/auth/env";
import { signInWithGoogle } from "@/lib/auth/sign-in";
import styles from "./Login.module.css";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Lemma with your personal Google account.",
  robots: { index: false },
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string; missing?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, error, missing } = await searchParams;
  const missingEnvVars = getMissingAuthEnvVars();
  const configurationError =
    error === "Configuration" || missingEnvVars.length > 0
      ? (missing?.split(",").filter(Boolean) ?? missingEnvVars)
      : [];

  return (
    <>
      <PageHeader
        eyebrow="Contribute"
        title="Sign in"
        lede="Lemma contributors sign in with a personal Google account. Your school does not need to manage access."
      />
      <Container className={styles.page}>
        <div className={styles.card}>
          <p className={styles.intro}>
            Use the Google account you already have. Lemma will ask you to choose a public
            handle the first time you sign in — that handle is separate from your Google
            display name.
          </p>

          {configurationError.length > 0 ? (
            <div className={styles.configError} role="alert">
              <p className={styles.configErrorTitle}>Authentication is not configured yet</p>
              <p className={styles.configErrorBody}>
                Copy <code>.env.example</code> to <code>.env.local</code> and set these
                environment variables before signing in:
              </p>
              <ul className={styles.configErrorList}>
                {configurationError.map((name) => (
                  <li key={name}>
                    <code>{name}</code>
                  </li>
                ))}
              </ul>
              <p className={styles.configErrorBody}>
                For local development, set <code>AUTH_URL=http://localhost:3000</code> and add
                the Google redirect URI{" "}
                <code>http://localhost:3000/api/auth/callback/google</code> in Google Cloud
                Console. Apply database migrations with <code>npm run db:migrate</code>.
              </p>
            </div>
          ) : null}

          <form
            action={async () => {
              "use server";
              await signInWithGoogle(callbackUrl);
            }}
          >
            <button
              type="submit"
              className={styles.googleButton}
              disabled={configurationError.length > 0}
            >
              Sign in with Google
            </button>
          </form>

          <p className={styles.note}>
            Signing in creates a contributor account with the status Pending. An administrator
            approves it before you can write, submit, or review articles.
          </p>

          <Link href="/" className={styles.back}>
            <ArrowRightIcon size={16} />
            Return to the archive
          </Link>
        </div>
      </Container>
    </>
  );
}
