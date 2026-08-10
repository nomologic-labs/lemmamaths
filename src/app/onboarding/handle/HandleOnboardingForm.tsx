"use client";

import { useActionState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { claimHandle, type ClaimHandleState } from "@/lib/auth/actions";
import styles from "./HandleOnboarding.module.css";

type HandleOnboardingFormProps = {
  callbackUrl?: string;
};

const INITIAL_STATE: ClaimHandleState = {};

export function HandleOnboardingForm({ callbackUrl }: HandleOnboardingFormProps) {
  const [state, formAction, pending] = useActionState(claimHandle, INITIAL_STATE);

  return (
    <>
      <PageHeader
        eyebrow="Contribute"
        title="Choose your Lemma handle"
        lede="Your handle is the public name Lemma uses for your account. It is separate from your Google display name and normally cannot be changed later."
      />
      <Container className={styles.page}>
        <form action={formAction} className={styles.card}>
          <label className={styles.label} htmlFor="handle">
            Lemma handle
          </label>
          <p className={styles.hint}>
            3–24 characters. Lowercase letters, numbers, and hyphens. Must begin with a letter.
          </p>
          <input
            id="handle"
            name="handle"
            type="text"
            required
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={styles.input}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "handle-error" : undefined}
          />
          {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
          {state.error ? (
            <p id="handle-error" className={styles.error} role="alert">
              {state.error}
            </p>
          ) : null}
          <button type="submit" className={styles.submit} disabled={pending}>
            {pending ? "Saving…" : "Save handle"}
          </button>
        </form>
      </Container>
    </>
  );
}
