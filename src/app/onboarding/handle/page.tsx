import type { Metadata } from "next";
import { HandleOnboardingForm } from "./HandleOnboardingForm";

export const metadata: Metadata = {
  title: "Choose a handle",
  description: "Choose your public Lemma handle before entering the contributor dashboard.",
  robots: { index: false },
};

type HandleOnboardingPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function HandleOnboardingPage({ searchParams }: HandleOnboardingPageProps) {
  const { callbackUrl } = await searchParams;

  return <HandleOnboardingForm callbackUrl={callbackUrl} />;
}
