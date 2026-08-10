import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { signInWithGoogle } from "@/lib/auth/sign-in";
import styles from "./Login.module.css";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Lemma with your personal Google account.",
  robots: { index: false },
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

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

          <form
            action={async () => {
              "use server";
              await signInWithGoogle(callbackUrl);
            }}
          >
            <button type="submit" className={styles.googleButton}>
              Continue with Google
            </button>
          </form>

          <p className={styles.note}>
            Signing in does not automatically make you an author. Editorial roles are granted
            separately once your account exists.
          </p>

          <Link href="/" className={styles.back}>
            Return to the archive
          </Link>
        </div>
      </Container>
    </>
  );
}
