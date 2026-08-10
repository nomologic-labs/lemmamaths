import type { SourceArticle } from "@/lib/articles/block-ids";

export const floatingPoint: SourceArticle = {
  slug: "floating-point-and-the-real-numbers",
  title: "Floating Point: Why 0.1 + 0.2 ≠ 0.3",
  standfirst:
    "The usual explanation is that computers are bad at decimals. The real explanation is that there are only finitely many of them, arranged in a very particular way.",
  authorIds: ["marcus-oyelaran", "tomas-lindqvist"],
  publishedOn: "2026-02-11",
  description:
    "What IEEE 754 doubles actually are, why the gap between consecutive ones grows with magnitude, and what machine epsilon does and does not promise about your answers.",
  topics: ["computer-science", "numerical-analysis"],
  tags: ["IEEE 754", "rounding error", "machine epsilon", "Python", "representation"],
  format: "article",
  readingMinutes: 9,
  review: {
    status: "peer-reviewed",
    reviewerIds: ["priya-raman", "sam-achterberg"],
    completedOn: "2026-02-03",
  },
  body: [
    {
      kind: "paragraph",
      content: [
        "The demonstration is a rite of passage. Open any language with IEEE 754 doubles, add a tenth to two tenths, and watch it fail:",
      ],
    },
    {
      kind: "code",
      language: "python",
      code: `>>> 0.1 + 0.2
0.30000000000000004
>>> 0.1 + 0.2 == 0.3
False
>>> from decimal import Decimal
>>> Decimal(0.1)          # what 0.1 actually is
Decimal('0.1000000000000000055511151231257827021181583404541015625')`,
    },
    {
      kind: "paragraph",
      content: [
        "The standard gloss — \"computers store numbers in binary, and 0.1 is not exact in binary\" — is true and explains almost nothing. It does not tell you when the error matters, how large it can get, or why the same program is accurate near 1 and useless near ",
        { kind: "math", tex: String.raw`10^{16}` },
        ". Those questions have precise answers.",
      ],
    },
    { kind: "heading", level: 2, text: "What a double is" },
    {
      kind: "statement",
      variant: "definition",
      number: "1",
      content: [
        {
          kind: "paragraph",
          content: [
            "A binary64 floating-point number is a value of the form",
          ],
        },
        {
          kind: "math",
          tex: String.raw`(-1)^{s} \times 1.b_1 b_2 \cdots b_{52} \times 2^{e}, \qquad s \in \{0,1\},\; b_i \in \{0,1\},\; -1022 \le e \le 1023,`,
          tag: "1",
        },
        {
          kind: "paragraph",
          content: [
            "where the significand ",
            { kind: "math", tex: String.raw`1.b_1 \cdots b_{52}` },
            " is read in binary. There are 53 bits of significand, of which only 52 are stored — the leading 1 is implied.",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "So the representable numbers are not spread evenly along the real line. Between ",
        { kind: "math", tex: String.raw`2^{e}` },
        " and ",
        { kind: "math", tex: String.raw`2^{e+1}` },
        " there are exactly ",
        { kind: "math", tex: String.raw`2^{52}` },
        " of them, evenly spaced with gap ",
        { kind: "math", tex: String.raw`2^{e-52}` },
        ". Every time you cross a power of two, the spacing doubles.",
      ],
    },
    {
      kind: "figure",
      src: "/figures/floating-point-spacing.png",
      alt: "A log-log plot of the gap between consecutive representable doubles against magnitude. The curve is a staircase rising in steps, each step doubling at a power of two, from about 10 to the minus 16 near 1 up to values exceeding 1 beyond 10 to the 16.",
      width: 1600,
      height: 900,
      caption: [
        "The gap to the next representable double, as a function of magnitude. The staircase doubles at every power of two. To the right of the marked point, consecutive doubles differ by more than 1 — integers are no longer all representable.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Now the failure is easy to locate. The decimal ",
        { kind: "math", tex: String.raw`0.1` },
        " is ",
        { kind: "math", tex: String.raw`1/10` },
        ", and 10 has a factor of 5, which is not a power of two — so in binary ",
        { kind: "math", tex: String.raw`0.1 = 0.0\overline{0011}` },
        " recurs forever, exactly as ",
        { kind: "math", tex: String.raw`1/3` },
        " recurs in decimal. It must be rounded to 53 bits. The same happens to ",
        { kind: "math", tex: String.raw`0.2` },
        " and to ",
        { kind: "math", tex: String.raw`0.3` },
        ", and the two roundings on the left do not happen to reproduce the rounding on the right.",
      ],
    },
    { kind: "heading", level: 2, text: "Machine epsilon, and what it bounds" },
    {
      kind: "paragraph",
      content: [
        "The relevant constant is the gap in the interval containing 1.",
      ],
    },
    {
      kind: "statement",
      variant: "definition",
      number: "2",
      content: [
        {
          kind: "paragraph",
          content: [
            "Machine epsilon ",
            { kind: "math", tex: String.raw`\varepsilon` },
            " is the difference between 1 and the next representable number above it. For binary64, ",
            { kind: "math", tex: String.raw`\varepsilon = 2^{-52} \approx 2.22 \times 10^{-16}` },
            ".",
          ],
        },
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
            { kind: "math", tex: String.raw`\mathrm{fl}(x)` },
            " denote ",
            { kind: "math", tex: String.raw`x` },
            " rounded to the nearest representable double. For any ",
            { kind: "math", tex: String.raw`x` },
            " in the normal range,",
          ],
        },
        {
          kind: "math",
          tex: String.raw`\mathrm{fl}(x) = x(1 + \delta) \quad \text{for some } |\delta| \le \tfrac{1}{2}\varepsilon,`,
          tag: "2",
        },
        {
          kind: "paragraph",
          content: [
            "and consequently each of the four arithmetic operations, correctly rounded, satisfies ",
            { kind: "math", tex: String.raw`\mathrm{fl}(a \circ b) = (a \circ b)(1 + \delta)` },
            " with the same bound.",
          ],
        },
      ],
    },
    {
      kind: "proof",
      content: [
        {
          kind: "paragraph",
          content: [
            "If ",
            { kind: "math", tex: String.raw`2^{e} \le |x| < 2^{e+1}` },
            " then the representable numbers around ",
            { kind: "math", tex: String.raw`x` },
            " are spaced ",
            { kind: "math", tex: String.raw`2^{e-52}` },
            " apart, so rounding to nearest moves ",
            { kind: "math", tex: String.raw`x` },
            " by at most half that, namely ",
            { kind: "math", tex: String.raw`2^{e-53}` },
            ". The relative error is therefore at most ",
            { kind: "math", tex: String.raw`2^{e-53}/|x| \le 2^{e-53}/2^{e} = 2^{-53} = \tfrac{1}{2}\varepsilon` },
            ". The statement about arithmetic follows because IEEE 754 requires each operation to return the correctly rounded exact result.",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Equation (2) is a bound on ",
        { kind: "emphasis", content: ["relative"] },
        " error, and that is the whole subtlety. Each individual operation is as accurate as it could possibly be. What (2) does not promise is that a ",
        { kind: "emphasis", content: ["sequence"] },
        " of operations stays accurate, because relative errors are measured against intermediate results, and an intermediate result can be much smaller than the numbers that produced it.",
      ],
    },
    { kind: "heading", level: 2, text: "Cancellation" },
    {
      kind: "statement",
      variant: "example",
      number: "4",
      content: [
        {
          kind: "paragraph",
          content: [
            "The quadratic formula, applied to ",
            { kind: "math", tex: String.raw`x^2 - 200x + 1 = 0` },
            ", computes ",
            { kind: "math", tex: String.raw`(200 - \sqrt{39996})/2` },
            " for the smaller root. The square root is about ",
            { kind: "math", tex: String.raw`199.99` },
            ", so we subtract two nearly equal numbers: the leading digits cancel, the small relative error each of them carried is now a large relative error of the difference, and the result is much less accurate than either input.",
          ],
        },
      ],
    },
    {
      kind: "code",
      language: "python",
      caption: "The same root, two ways. Only the arrangement of the arithmetic differs.",
      code: `import math

def naive(a, b, c):
    """Textbook formula. Loses accuracy when b^2 >> 4ac."""
    disc = math.sqrt(b * b - 4 * a * c)
    return (-b + disc) / (2 * a)

def stable(a, b, c):
    """Compute the well-conditioned root first, then use x1 * x2 = c / a."""
    disc = math.sqrt(b * b - 4 * a * c)
    # Adding quantities of the same sign never cancels.
    q = -0.5 * (b + math.copysign(disc, b))
    return c / q          # the root the naive formula got wrong


for scale in (2, 4, 6, 8):
    b = -2 * 10**scale
    print(f"b = {b:>10}   naive {naive(1, b, 1):.17g}   stable {stable(1, b, 1):.17g}")

# b =       -200   naive 0.0050000125000626551   stable 0.0050000125000625261
# b =     -20000   naive 0.00005000000125001     stable 0.0000500000012500000
# b =   -2000000   naive 5.0000000058430487e-07  stable 5.0000000000000004e-07
# b = -200000000   naive 5.0000000372529030e-09  stable 5.0000000000000000e-09`,
    },
    {
      kind: "paragraph",
      content: [
        "By the last line the naive formula has lost eight of its sixteen digits, and it will return exactly zero — a catastrophically wrong answer, rather than a slightly wrong one — once ",
        { kind: "math", tex: String.raw`b^2` },
        " exceeds ",
        { kind: "math", tex: String.raw`4ac/\varepsilon` },
        ". No individual operation misbehaved. Every one of them satisfied (2). The arrangement was wrong.",
      ],
    },
    { kind: "heading", level: 2, text: "Practical consequences" },
    {
      kind: "list",
      ordered: false,
      items: [
        [
          { kind: "strong", content: ["Never test floats for equality."] },
          " Compare against a tolerance, and make the tolerance relative — ",
          { kind: "code", text: "abs(a - b) <= rtol * max(abs(a), abs(b))" },
          " — because an absolute tolerance that is sensible near 1 is meaningless near ",
          { kind: "math", tex: String.raw`10^{10}` },
          ".",
        ],
        [
          { kind: "strong", content: ["Integers are exact only up to "] },
          { kind: "math", tex: String.raw`2^{53}` },
          ". Below that every integer is representable; above it, the spacing exceeds 1 and consecutive integers start sharing a representation. This is why JavaScript, which has only doubles, gained a separate ",
          { kind: "code", text: "BigInt" },
          " type.",
        ],
        [
          { kind: "strong", content: ["Never use floats for money."] },
          " Use integer minor units, or a decimal type. The failure is not hypothetical: accumulating 0.01 ten thousand times lands you off by about ",
          { kind: "math", tex: String.raw`10^{-10}` },
          ", and the direction of the error is not random.",
        ],
        [
          { kind: "strong", content: ["Sum in the right order."] },
          " Adding a long list of positive numbers smallest-first loses less than largest-first, because the running total stays small for longer. Kahan's compensated summation does better still, at the cost of three extra operations per term.",
        ],
      ],
    },
    {
      kind: "statement",
      variant: "remark",
      content: [
        {
          kind: "paragraph",
          content: [
            "It is tempting to conclude that floating point is broken. It is closer to the truth to say it is a deliberate trade: 64 bits buy you about 16 significant digits across a range spanning ",
            { kind: "math", tex: String.raw`10^{-308}` },
            " to ",
            { kind: "math", tex: String.raw`10^{308}` },
            ", with every operation correctly rounded, and the alternative — exact rational arithmetic — has denominators that grow without bound and would make the ",
            {
              kind: "link",
              href: "/articles/newtons-method-and-its-basins",
              content: ["iteration in Newton's method"],
            },
            " slower at every step. The design is sound. What is unsound is expecting it to behave like ",
            { kind: "math", tex: String.raw`\mathbb{R}` },
            ".",
          ],
        },
      ],
    },
  ],
};
