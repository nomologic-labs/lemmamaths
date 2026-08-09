import type { Article } from "../types";

export const continuedFractions: Article = {
  slug: "continued-fractions-and-best-approximations",
  title: "Continued Fractions and Best Approximations",
  standfirst:
    "Why 355/113 is a freakishly good approximation to π, and why no fraction with a smaller denominator comes close.",
  authorIds: ["daniel-whitmore"],
  publishedOn: "2026-05-05",
  description:
    "The continued fraction algorithm, the recurrence generating its convergents, and the theorem that these convergents are the only best rational approximations there are.",
  topics: ["number-theory", "arithmetic"],
  tags: ["continued fractions", "Diophantine approximation", "pi", "recurrence", "Python"],
  format: "article",
  readingMinutes: 12,
  review: {
    status: "peer-reviewed",
    reviewerIds: ["marcus-oyelaran", "nadia-okonkwo"],
    completedOn: "2026-04-27",
  },
  body: [
    {
      kind: "paragraph",
      content: [
        "Everyone knows ",
        { kind: "math", tex: String.raw`22/7` },
        " as an approximation to ",
        { kind: "math", tex: String.raw`\pi` },
        ". Fewer people know ",
        { kind: "math", tex: String.raw`355/113` },
        ", which agrees with ",
        { kind: "math", tex: String.raw`\pi` },
        " to seven signficant figures — an accuracy of ",
        { kind: "math", tex: String.raw`2.7 \times 10^{-7}` },
        " from a denominator of only 113. That is a suspiciously good deal, and it is not a coincidence. Both fractions are produced by the same algorithm, and there is a theorem saying that this algorithm produces every fraction which is unusually good in this sense, and nothing else.",
      ],
    },
    { kind: "heading", level: 2, text: "The algorithm" },
    {
      kind: "paragraph",
      content: [
        "Given a real number ",
        { kind: "math", tex: String.raw`x` },
        ", peel off its integer part, invert what remains, and repeat:",
      ],
    },
    {
      kind: "math",
      tex: String.raw`a_0 = \lfloor x \rfloor, \qquad x_1 = \frac{1}{x - a_0}, \qquad a_k = \lfloor x_k \rfloor, \qquad x_{k+1} = \frac{1}{x_k - a_k}.`,
      tag: "1",
    },
    {
      kind: "paragraph",
      content: [
        "The sequence of integers ",
        { kind: "math", tex: String.raw`[a_0; a_1, a_2, \dots]` },
        " is the continued fraction expansion of ",
        { kind: "math", tex: String.raw`x` },
        ", shorthand for the nested expression",
      ],
    },
    {
      kind: "math",
      tex: String.raw`x = a_0 + \cfrac{1}{a_1 + \cfrac{1}{a_2 + \cfrac{1}{a_3 + \ddots}}}.`,
    },
    {
      kind: "paragraph",
      content: [
        "The process stops exactly when ",
        { kind: "math", tex: String.raw`x` },
        " is rational, because the step ",
        { kind: "math", tex: String.raw`x_{k+1} = 1/(x_k - a_k)` },
        " applied to a rational number is precisely a step of the Euclidean algorithm on its numerator and denominator, and that terminates. So irrational numbers have infinite expansions, and this gives an immediate — if impractical — irrationality test.",
      ],
    },
    {
      kind: "statement",
      variant: "example",
      number: "1",
      content: [
        {
          kind: "paragraph",
          content: [
            "For ",
            { kind: "math", tex: String.raw`\pi = 3.14159265\ldots` },
            " the expansion begins ",
            { kind: "math", tex: String.raw`[3; 7, 15, 1, 292, 25, 1, 7, \dots]` },
            ". For ",
            { kind: "math", tex: String.raw`\sqrt{2}` },
            " it is ",
            { kind: "math", tex: String.raw`[1; 2, 2, 2, \dots]` },
            ", periodic forever — a general fact about quadratic irrationals, due to Lagrange. And the golden ratio ",
            { kind: "math", tex: String.raw`\varphi` },
            " is ",
            { kind: "math", tex: String.raw`[1; 1, 1, 1, \dots]` },
            ", which will matter shortly.",
          ],
        },
      ],
    },
    { kind: "heading", level: 2, text: "Convergents, and the recurrence that generates them" },
    {
      kind: "paragraph",
      content: [
        "Truncating the expansion after ",
        { kind: "math", tex: String.raw`a_k` },
        " gives a rational number ",
        { kind: "math", tex: String.raw`p_k/q_k` },
        ", the ",
        { kind: "math", tex: String.raw`k` },
        "th ",
        { kind: "emphasis", content: ["convergent"] },
        ". Collapsing the nested fraction from the bottom up each time would be tedious; happily the convergents satisfy a two-term recurrence.",
      ],
    },
    {
      kind: "statement",
      variant: "proposition",
      number: "2",
      content: [
        {
          kind: "paragraph",
          content: [
            "With ",
            { kind: "math", tex: String.raw`p_{-1} = 1, q_{-1} = 0, p_{-2} = 0, q_{-2} = 1` },
            ", the convergents satisfy",
          ],
        },
        {
          kind: "math",
          tex: String.raw`p_k = a_k p_{k-1} + p_{k-2}, \qquad q_k = a_k q_{k-1} + q_{k-2},`,
          tag: "2",
        },
        { kind: "paragraph", content: ["and consecutive convergents satisfy"] },
        {
          kind: "math",
          tex: String.raw`p_k q_{k-1} - p_{k-1} q_k = (-1)^{k-1}.`,
          tag: "3",
        },
      ],
    },
    {
      kind: "proof",
      content: [
        {
          kind: "paragraph",
          content: [
            "Both parts are inductions. For (2), observe that the ",
            { kind: "math", tex: String.raw`k` },
            "th convergent of ",
            { kind: "math", tex: String.raw`[a_0; a_1, \dots, a_k]` },
            " equals the ",
            { kind: "math", tex: String.raw`(k-1)` },
            "th convergent of the shorter sequence ",
            { kind: "math", tex: String.raw`[a_0; a_1, \dots, a_{k-2}, a_{k-1} + 1/a_k]` },
            ". Applying the inductive hypothesis to that sequence and clearing the fraction gives exactly (2).",
          ],
        },
        {
          kind: "paragraph",
          content: [
            "For (3), the base case ",
            { kind: "math", tex: String.raw`p_0 q_{-1} - p_{-1} q_0 = -1` },
            " holds by the initial conditions. Assuming it at ",
            { kind: "math", tex: String.raw`k-1` },
            " and substituting (2),",
          ],
        },
        {
          kind: "math",
          tex: String.raw`p_k q_{k-1} - p_{k-1} q_k = (a_k p_{k-1} + p_{k-2}) q_{k-1} - p_{k-1}(a_k q_{k-1} + q_{k-2}) = -(p_{k-1} q_{k-2} - p_{k-2} q_{k-1}),`,
        },
        {
          kind: "paragraph",
          content: [
            "which is ",
            { kind: "math", tex: String.raw`-(-1)^{k-2} = (-1)^{k-1}` },
            ".",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Identity (3) is doing more than it appears. Since ",
        { kind: "math", tex: String.raw`p_k q_{k-1} - p_{k-1} q_k = \pm 1` },
        ", any common divisor of ",
        { kind: "math", tex: String.raw`p_k` },
        " and ",
        { kind: "math", tex: String.raw`q_k` },
        " divides 1 — so every convergent is automatically in lowest terms, with no cancellation step required. Dividing (3) by ",
        { kind: "math", tex: String.raw`q_k q_{k-1}` },
        " also gives the size of each correction,",
      ],
    },
    {
      kind: "math",
      tex: String.raw`\frac{p_k}{q_k} - \frac{p_{k-1}}{q_{k-1}} = \frac{(-1)^{k-1}}{q_k q_{k-1}},`,
    },
    {
      kind: "paragraph",
      content: [
        "which alternates in sign and shrinks rapidly, since (2) makes the ",
        { kind: "math", tex: String.raw`q_k` },
        " grow at least as fast as the Fibonacci numbers. The convergents therefore bracket ",
        { kind: "math", tex: String.raw`x` },
        " from alternating sides and close in geometrically.",
      ],
    },
    {
      kind: "code",
      language: "python",
      caption: "The expansion and its convergents, computed exactly from a Fraction.",
      code: `from fractions import Fraction
from math import floor


def continued_fraction(x, terms=12):
    """Expansion coefficients a_0, a_1, ... of a real number."""
    coefficients = []
    for _ in range(terms):
        a = floor(x)
        coefficients.append(a)
        remainder = x - a
        if remainder == 0:
            break            # x was rational and we have finished
        x = 1 / remainder
    return coefficients


def convergents(coefficients):
    """Apply the recurrence p_k = a_k p_{k-1} + p_{k-2} of Proposition 2."""
    p_prev, p = 0, 1         # p_{-2}, p_{-1}
    q_prev, q = 1, 0         # q_{-2}, q_{-1}
    for a in coefficients:
        p, p_prev = a * p + p_prev, p
        q, q_prev = a * q + q_prev, q
        yield Fraction(p, q)


PI = Fraction(5_419_351, 1_725_033)      # correct to 13 decimal places

for c in convergents(continued_fraction(PI, terms=6)):
    error = abs(PI - c)
    print(f"{str(c):>12}   error {float(error):.3e}   q^-2 = {1/c.denominator**2:.3e}")

#            3   error 1.416e-01   q^-2 = 1.000e+00
#         22/7   error 1.264e-03   q^-2 = 2.041e-02
#      333/106   error 8.322e-05   q^-2 = 8.900e-05
#      355/113   error 2.668e-07   q^-2 = 7.832e-05
# 103993/33102   error 5.779e-10   q^-2 = 9.126e-10`,
    },
    {
      kind: "paragraph",
      content: [
        "Look at the fourth line. The error of ",
        { kind: "math", tex: String.raw`355/113` },
        " is nearly three hundred times smaller than ",
        { kind: "math", tex: String.raw`1/q^2` },
        ", where the other convergents sit at roughly the same order as it. The reason is visible in the expansion: the next coefficient is ",
        { kind: "math", tex: String.raw`a_4 = 292` },
        ", enormous by the standards of a typical continued fraction. A large coefficient means the ",
        { kind: "emphasis", content: ["previous"] },
        " convergent was already doing almost all the work.",
      ],
    },
    {
      kind: "figure",
      src: "/figures/continued-fraction-convergents.png",
      alt: "A logarithmic scatter plot of approximation error against denominator. Points for the convergents of pi lie far below a reference line for 1 over q squared, with the point for 355 over 113 dropping conspicuously further below the line than its neighbours. A dense cloud of non-convergent fractions sits above the line.",
      width: 1600,
      height: 1000,
      caption: [
        "Approximation error ",
        { kind: "math", tex: String.raw`|\pi - p/q|` },
        " against denominator, log–log. Every fraction with ",
        { kind: "math", tex: String.raw`q \le 400` },
        " is plotted in grey; the convergents are marked. Nothing beats a convergent, and ",
        { kind: "math", tex: String.raw`355/113` },
        " sits far below the ",
        { kind: "math", tex: String.raw`1/q^2` },
        " reference line because the next partial quotient is 292.",
      ],
    },
    { kind: "heading", level: 2, text: "The best approximation theorem" },
    {
      kind: "paragraph",
      content: [
        "All of this suggests that the convergents are special. They are, and in the strongest sense one could ask for.",
      ],
    },
    {
      kind: "statement",
      variant: "theorem",
      number: "3",
      content: [
        {
          kind: "paragraph",
          content: [
            "Let ",
            { kind: "math", tex: String.raw`x` },
            " be irrational and let ",
            { kind: "math", tex: String.raw`p/q` },
            " be a rational number with ",
            { kind: "math", tex: String.raw`q \ge 1` },
            ". If",
          ],
        },
        {
          kind: "math",
          tex: String.raw`\left| x - \frac{p}{q} \right| < \frac{1}{2q^2},`,
        },
        {
          kind: "paragraph",
          content: [
            "then ",
            { kind: "math", tex: String.raw`p/q` },
            " is a convergent of ",
            { kind: "math", tex: String.raw`x` },
            ". Conversely, every convergent satisfies ",
            { kind: "math", tex: String.raw`|x - p_k/q_k| < 1/q_k^2` },
            ", and no fraction with denominator at most ",
            { kind: "math", tex: String.raw`q_k` },
            " lies closer to ",
            { kind: "math", tex: String.raw`x` },
            " than ",
            { kind: "math", tex: String.raw`p_k/q_k` },
            " does.",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "So the grey cloud in the figure is not merely sparse below the line — it is provably empty below ",
        { kind: "math", tex: String.raw`1/2q^2` },
        " except at the marked points. If you want a good rational approximation to anything, running (1) is not ",
        { kind: "emphasis", content: ["a"] },
        " way to find it; up to the constant, it is the only way.",
      ],
    },
    {
      kind: "statement",
      variant: "remark",
      content: [
        {
          kind: "paragraph",
          content: [
            "Turning the question around gives the golden ratio a claim to being the ",
            { kind: "emphasis", content: ["worst"] },
            " approximable irrational number. Its expansion ",
            { kind: "math", tex: String.raw`[1; 1, 1, 1, \dots]` },
            " has the smallest possible partial quotients everywhere, so its convergents improve as slowly as convergents can, and Hurwitz's theorem shows the constant ",
            { kind: "math", tex: String.raw`1/\sqrt{5}` },
            " it forces cannot be improved for any irrational. This is the actual reason sunflower seeds and pine cones arrange themselves at ",
            { kind: "math", tex: String.raw`137.5^\circ` },
            ": a rotation by the least well-approximated number is the rotation that takes longest to nearly repeat, which packs new growth into the gaps left by old growth.",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "There is a pleasing circularity to end on. The algorithm in (1) is the Euclidean algorithm, roughly 2,300 years old and originally about finding common measures of line segments. Run it on an irrational length and it fails to terminate — which is exactly the discovery, attributed to the Pythagoreans, that started the trouble. What we have done here is to notice that the sequence of failures is itself worth writing down.",
      ],
    },
  ],
};
