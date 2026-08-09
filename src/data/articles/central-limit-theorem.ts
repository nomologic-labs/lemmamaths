import type { Article } from "../types";

export const centralLimitTheorem: Article = {
  slug: "the-central-limit-theorem-simulated",
  title: "The Central Limit Theorem, Simulated",
  standfirst:
    "Everyone is shown the bell curve emerging from a pile of dice. Far fewer are shown how fast it emerges, or what makes it arrive slowly.",
  authorIds: ["priya-raman"],
  publishedOn: "2026-07-28",
  description:
    "What the central limit theorem actually claims, why n = 30 is folklore rather than mathematics, and a simulation showing skewness — not sample size alone — governing the rate of convergence.",
  topics: ["statistics-probability"],
  tags: ["central limit theorem", "convergence", "simulation", "Berry–Esseen", "Python"],
  format: "investigation",
  readingMinutes: 10,
  review: {
    status: "peer-reviewed",
    reviewerIds: ["marcus-oyelaran", "aoife-brennan"],
    completedOn: "2026-07-20",
  },
  body: [
    {
      kind: "paragraph",
      content: [
        "The central limit theorem is the reason statistics works at all, and it is also the single most over-stated result in the subject. It is routinely paraphrased as \"averages are normally distributed\" or, worse, as \"anything with enough contributions is normal\". Neither is what it says.",
      ],
    },
    {
      kind: "statement",
      variant: "theorem",
      title: "Lindeberg–Lévy",
      number: "1",
      content: [
        {
          kind: "paragraph",
          content: [
            "Let ",
            { kind: "math", tex: String.raw`X_1, X_2, \dots` },
            " be independent and identically distributed with mean ",
            { kind: "math", tex: String.raw`\mu` },
            " and finite variance ",
            { kind: "math", tex: String.raw`\sigma^2 > 0` },
            ". Write ",
            { kind: "math", tex: String.raw`\bar{X}_n = \frac{1}{n}\sum_{i=1}^{n} X_i` },
            ". Then",
          ],
        },
        {
          kind: "math",
          tex: String.raw`\frac{\sqrt{n}\,(\bar{X}_n - \mu)}{\sigma} \;\xrightarrow{\;d\;}\; \mathcal{N}(0, 1),`,
          tag: "1",
        },
        {
          kind: "paragraph",
          content: [
            "meaning that the distribution function of the left-hand side converges pointwise to ",
            { kind: "math", tex: String.raw`\Phi` },
            ".",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Three restrictions in that statement do real work. The variance must be finite, which rules out the heavy-tailed distributions where averaging never settles down. The convergence is ",
        { kind: "emphasis", content: ["in distribution"] },
        ", not pointwise or almost surely — it is a statement about probabilities, not about any particular sequence of averages. And it is a statement about the limit, with no rate attached. Nothing in Theorem 1 tells you whether ",
        { kind: "math", tex: String.raw`n = 30` },
        " is enough.",
      ],
    },
    { kind: "heading", level: 2, text: "What actually controls the rate" },
    {
      kind: "paragraph",
      content: [
        "There is a theorem that does attach a rate, and it names the culprit explicitly.",
      ],
    },
    {
      kind: "statement",
      variant: "theorem",
      title: "Berry–Esseen",
      number: "2",
      content: [
        {
          kind: "paragraph",
          content: [
            "If in addition ",
            { kind: "math", tex: String.raw`\rho = \mathbb{E}|X_1 - \mu|^3` },
            " is finite, then for every ",
            { kind: "math", tex: String.raw`n` },
            " and every ",
            { kind: "math", tex: String.raw`x` },
            ",",
          ],
        },
        {
          kind: "math",
          tex: String.raw`\left| \mathbb{P}\!\left( \frac{\sqrt{n}(\bar{X}_n - \mu)}{\sigma} \le x \right) - \Phi(x) \right| \;\le\; \frac{C\rho}{\sigma^3 \sqrt{n}},`,
          tag: "2",
        },
        {
          kind: "paragraph",
          content: [
            "where ",
            { kind: "math", tex: String.raw`C` },
            " is an absolute constant, known to be below ",
            { kind: "math", tex: String.raw`0.47` },
            ".",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Read the right-hand side of (2) carefully. The error decays like ",
        { kind: "math", tex: String.raw`n^{-1/2}` },
        " — slowly — and it is multiplied by ",
        { kind: "math", tex: String.raw`\rho/\sigma^3` },
        ", a scale-free measure of how lopsided the underlying distribution is. Two populations with the same variance but different skewness converge at rates differing by whatever factor their third moments differ by. The sample size is only half the story, and the ",
        { kind: "math", tex: String.raw`n = 30` },
        " rule of thumb is a statement about the mildly skewed distributions that happen to appear in textbooks.",
      ],
    },
    { kind: "heading", level: 2, text: "Watching it happen" },
    {
      kind: "paragraph",
      content: [
        "To see the effect, we sample from two distributions chosen to have identical means and variances but very different third moments: a symmetric uniform distribution, and an exponential distribution, which is strongly right-skewed with ",
        { kind: "math", tex: String.raw`\rho/\sigma^3 = 2` },
        ".",
      ],
    },
    {
      kind: "code",
      language: "python",
      caption: "Standardised sample means for two populations with matched mean and variance.",
      code: `import numpy as np

rng = np.random.default_rng(20260728)
TRIALS = 200_000

def standardised_means(sampler, mu, sigma, n):
    """Draw TRIALS samples of size n and standardise each sample mean."""
    samples = sampler(size=(TRIALS, n))
    return np.sqrt(n) * (samples.mean(axis=1) - mu) / sigma

# Uniform on [0, 1]: symmetric, so the third central moment is exactly 0.
uniform = (lambda size: rng.uniform(0.0, 1.0, size), 0.5, 1 / np.sqrt(12))

# Exponential rescaled to the same mean and variance. Skewness is 2,
# and Berry-Esseen predicts it will lag the uniform case badly.
scale = 1 / np.sqrt(12)
exponential = (lambda size: rng.exponential(scale, size) + 0.5 - scale, 0.5, scale)

for n in (1, 2, 5, 30):
    for name, (sampler, mu, sigma) in (("uniform", uniform), ("exponential", exponential)):
        z = standardised_means(sampler, mu, sigma, n)
        # Sample skewness: the quantity Berry-Esseen says should shrink like 1/sqrt(n).
        skew = ((z - z.mean()) ** 3).mean() / z.std() ** 3
        print(f"n={n:>2}  {name:<12} skewness={skew:+.3f}")`,
    },
    {
      kind: "figure",
      src: "/figures/clt-convergence.png",
      alt: "Eight histograms in two rows of four. The top row shows standardised sample means from a uniform distribution at sample sizes 1, 2, 5 and 30; the shape is already close to the overlaid normal curve by n equals 2. The bottom row shows the same for an exponential distribution, which is visibly right-skewed at n equals 1 and 2, still noticeably asymmetric at n equals 5, and only close to normal by n equals 30.",
      width: 1600,
      height: 920,
      caption: [
        "Standardised sample means from 200,000 trials, with the standard normal density overlaid. Both rows have the same mean and variance at every sample size — only the skewness differs.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "The top row converges almost immediately: the sum of two independent uniforms is already the triangular distribution, and by ",
        { kind: "math", tex: String.raw`n = 5` },
        " the difference from a normal curve is hard to see by eye. The bottom row takes until ",
        { kind: "math", tex: String.raw`n = 30` },
        " to look symmetric, and the measured skewness confirms it: it falls as ",
        { kind: "math", tex: String.raw`2/\sqrt{n}` },
        ", exactly the ",
        { kind: "math", tex: String.raw`n^{-1/2}` },
        " decay that (2) predicts, from a starting value twice as large.",
      ],
    },
    {
      kind: "statement",
      variant: "remark",
      content: [
        {
          kind: "paragraph",
          content: [
            "The histograms are also quietly making an argument about where the approximation is worst. Near the centre the fit is excellent even at small ",
            { kind: "math", tex: String.raw`n` },
            "; it is in the tails that the skewed case stays wrong for longest. That matters, because the tails are precisely where hypothesis tests and confidence intervals live. A normal approximation that looks convincing in a histogram can still put your 99% interval in the wrong place.",
          ],
        },
      ],
    },
    { kind: "heading", level: 2, text: "A distribution where none of this applies" },
    {
      kind: "paragraph",
      content: [
        "It is worth seeing the hypothesis fail. The Cauchy distribution, with density ",
        { kind: "math", tex: String.raw`\frac{1}{\pi(1 + x^2)}` },
        ", has no mean and infinite variance. Averaging Cauchy samples does not help at all: the mean of ",
        { kind: "math", tex: String.raw`n` },
        " independent Cauchy variables is again Cauchy, with exactly the same spread as a single observation.",
      ],
    },
    {
      kind: "math",
      tex: String.raw`X_1, \dots, X_n \sim \operatorname{Cauchy}(0,1) \;\;\Longrightarrow\;\; \bar{X}_n \sim \operatorname{Cauchy}(0,1).`,
    },
    {
      kind: "paragraph",
      content: [
        "Collecting a million observations tells you no more about the centre than collecting one. This is not a pathology invented to make a point — it is what happens whenever the tail is heavy enough that the occasional enormous observation dominates the sum, and financial returns and network traffic both misbehave in this direction.",
      ],
    },
    {
      kind: "statement",
      variant: "exercise",
      number: "3",
      content: [
        {
          kind: "paragraph",
          content: [
            "Modify the simulation to draw from a lognormal distribution with ",
            { kind: "math", tex: String.raw`\sigma = 1` },
            ", whose skewness is about ",
            { kind: "math", tex: String.raw`6.2` },
            ". Estimate the sample size at which the measured skewness of the standardised mean first falls below ",
            { kind: "math", tex: String.raw`0.1` },
            ", and check the answer against the ",
            { kind: "math", tex: String.raw`n^{-1/2}` },
            " prediction. It is a good deal larger than thirty.",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "The honest summary is this. The central limit theorem guarantees a destination, Berry–Esseen bounds the speed, and the speed depends on a property of your data — its skewness — that you can estimate before assuming anything. Estimating it takes three lines of code, which is less effort than defending the number thirty.",
      ],
    },
  ],
};
