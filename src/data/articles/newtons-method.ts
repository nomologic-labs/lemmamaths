import type { SourceArticle } from "@/lib/articles/block-ids";

export const newtonsMethod: SourceArticle = {
  slug: "newtons-method-and-its-basins",
  title: "Newton's Method and Its Basins of Attraction",
  standfirst:
    "The algorithm doubles its correct digits every step, right up until it doesn't. What happens at the boundary is more interesting than the convergence proof.",
  authorIds: ["tomas-lindqvist"],
  publishedOn: "2026-05-27",
  description:
    "A proof of quadratic convergence near a simple root, and then a look at what the method does far from one: the basins for z³ − 1 meet in a set where every point is on the boundary of all three.",
  topics: ["numerical-analysis", "computer-science"],
  tags: ["root finding", "iteration", "convergence", "fractals", "Python"],
  format: "investigation",
  readingMinutes: 13,
  review: {
    status: "peer-reviewed",
    reviewerIds: ["priya-raman", "marcus-oyelaran"],
    completedOn: "2026-05-18",
  },
  body: [
    {
      kind: "paragraph",
      content: [
        "Newton's method is the first genuinely fast algorithm most people meet. You want a root of ",
        { kind: "math", tex: String.raw`f`, },
        ", you have a guess ",
        { kind: "math", tex: String.raw`x_n` },
        " that is nearly right, so you replace ",
        { kind: "math", tex: String.raw`f` },
        " by its tangent line there and take the root of that instead:",
      ],
    },
    {
      kind: "math",
      tex: String.raw`x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}.`,
      tag: "1",
    },
    {
      kind: "paragraph",
      content: [
        "Started near a simple root the iteration is extraordinary — the number of correct digits roughly doubles at every step, so six iterations from a one-digit guess will exhaust double precision. Started elsewhere it can cycle forever, run off to infinity, or land on a root nowhere near where you began. This article proves the first behaviour and then goes looking for the second.",
      ],
    },
    { kind: "heading", level: 2, text: "Quadratic convergence" },
    {
      kind: "statement",
      variant: "theorem",
      number: "1",
      content: [
        {
          kind: "paragraph",
          content: [
            "Let ",
            { kind: "math", tex: String.raw`f` },
            " be twice continuously differentiable on a neighbourhood of a root ",
            { kind: "math", tex: String.raw`r` },
            " with ",
            { kind: "math", tex: String.raw`f'(r) \neq 0` },
            ". Then there is a ",
            { kind: "math", tex: String.raw`\delta > 0` },
            " and a constant ",
            { kind: "math", tex: String.raw`C` },
            " such that if ",
            { kind: "math", tex: String.raw`|x_0 - r| < \delta` },
            ", the iterates of (1) satisfy",
          ],
        },
        {
          kind: "math",
          tex: String.raw`|x_{n+1} - r| \le C\,|x_n - r|^2 \qquad \text{for all } n \ge 0,`,
        },
        {
          kind: "paragraph",
          content: [
            "and in particular ",
            { kind: "math", tex: String.raw`x_n \to r` },
            ".",
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
            "Write ",
            { kind: "math", tex: String.raw`e_n = x_n - r` },
            ". Taylor's theorem with Lagrange remainder, expanded about ",
            { kind: "math", tex: String.raw`x_n` },
            " and evaluated at ",
            { kind: "math", tex: String.raw`r` },
            ", gives some ",
            { kind: "math", tex: String.raw`\xi_n` },
            " between ",
            { kind: "math", tex: String.raw`r` },
            " and ",
            { kind: "math", tex: String.raw`x_n` },
            " with",
          ],
        },
        {
          kind: "math",
          tex: String.raw`0 = f(r) = f(x_n) - e_n f'(x_n) + \tfrac{1}{2} e_n^2 f''(\xi_n).`,
        },
        {
          kind: "paragraph",
          content: [
            "Divide through by ",
            { kind: "math", tex: String.raw`f'(x_n)` },
            ", which is nonzero for ",
            { kind: "math", tex: String.raw`x_n` },
            " close enough to ",
            { kind: "math", tex: String.raw`r` },
            " by continuity, and rearrange using (1):",
          ],
        },
        {
          kind: "math",
          tex: String.raw`e_{n+1} = x_{n+1} - r = e_n - \frac{f(x_n)}{f'(x_n)} = \frac{f''(\xi_n)}{2 f'(x_n)}\, e_n^2.`,
          tag: "2",
        },
        {
          kind: "paragraph",
          content: [
            "Choose ",
            { kind: "math", tex: String.raw`\delta_0` },
            " small enough that on ",
            { kind: "math", tex: String.raw`[r - \delta_0, r + \delta_0]` },
            " we have ",
            { kind: "math", tex: String.raw`|f''| \le M` },
            " and ",
            { kind: "math", tex: String.raw`|f'| \ge m > 0` },
            ", and set ",
            { kind: "math", tex: String.raw`C = M/(2m)` },
            ". Then (2) gives ",
            { kind: "math", tex: String.raw`|e_{n+1}| \le C|e_n|^2` },
            ". Finally take ",
            { kind: "math", tex: String.raw`\delta = \min(\delta_0, 1/(2C))` },
            "; then ",
            { kind: "math", tex: String.raw`|e_0| < \delta` },
            " forces ",
            { kind: "math", tex: String.raw`|e_1| \le C|e_0|^2 < |e_0|/2` },
            ", so the iterates stay in the interval and the bound applies at every step. Since ",
            { kind: "math", tex: String.raw`|e_n| \le 2^{-n}|e_0|` },
            ", they converge to ",
            { kind: "math", tex: String.raw`r` },
            ".",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Equation (2) is where the doubling comes from, and it also shows what breaks it. If ",
        { kind: "math", tex: String.raw`f'(r) = 0` },
        " — a repeated root — the constant ",
        { kind: "math", tex: String.raw`C` },
        " is unbounded and the argument collapses. For a root of multiplicity ",
        { kind: "math", tex: String.raw`m` },
        " the method still converges, but only linearly, with each step removing a fixed fraction ",
        { kind: "math", tex: String.raw`1 - 1/m` },
        " of the error. Using ",
        { kind: "math", tex: String.raw`x_{n+1} = x_n - m f(x_n)/f'(x_n)` },
        " restores the quadratic rate, if you happen to know ",
        { kind: "math", tex: String.raw`m` },
        " in advance.",
      ],
    },
    {
      kind: "statement",
      variant: "example",
      number: "2",
      content: [
        {
          kind: "paragraph",
          content: [
            "Take ",
            { kind: "math", tex: String.raw`f(x) = x^2 - 2` },
            " from ",
            { kind: "math", tex: String.raw`x_0 = 1` },
            ". The iteration is ",
            { kind: "math", tex: String.raw`x_{n+1} = \tfrac{1}{2}(x_n + 2/x_n)` },
            ", the Babylonian square-root method, which predates Newton by about three thousand years. The errors against ",
            { kind: "math", tex: String.raw`\sqrt{2}` },
            " run",
          ],
        },
        {
          kind: "list",
          ordered: true,
          items: [
            [{ kind: "math", tex: String.raw`x_1 = 1.5` }, ", error ", { kind: "math", tex: String.raw`8.6 \times 10^{-2}` }],
            [{ kind: "math", tex: String.raw`x_2 = 1.41\overline{6}` }, ", error ", { kind: "math", tex: String.raw`2.5 \times 10^{-3}` }],
            [{ kind: "math", tex: String.raw`x_3 = 1.414215\ldots` }, ", error ", { kind: "math", tex: String.raw`2.1 \times 10^{-6}` }],
            [{ kind: "math", tex: String.raw`x_4 = 1.414213562\ldots` }, ", error ", { kind: "math", tex: String.raw`1.6 \times 10^{-12}` }],
          ],
        },
        {
          kind: "paragraph",
          content: [
            "Two, three, six, twelve correct digits. The fifth iterate is correct to every bit a double can hold.",
          ],
        },
      ],
    },
    { kind: "heading", level: 2, text: "Leaving the neighbourhood" },
    {
      kind: "paragraph",
      content: [
        "Theorem 1 is a local statement, and the word ",
        { kind: "emphasis", content: ["local"] },
        " is carrying all the weight. It says nothing about which root you reach, or whether you reach one at all, from a starting point that is merely plausible rather than close. To see what happens globally, it is easiest to move to the complex plane, where the roots of a polynomial are all present and accounted for.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Consider ",
        { kind: "math", tex: String.raw`f(z) = z^3 - 1` },
        ", whose roots are the three cube roots of unity ",
        { kind: "math", tex: String.raw`1, \omega, \omega^2` },
        " with ",
        { kind: "math", tex: String.raw`\omega = e^{2\pi i/3}` },
        ". The iteration becomes",
      ],
    },
    {
      kind: "math",
      tex: String.raw`z_{n+1} = z_n - \frac{z_n^3 - 1}{3z_n^2} = \frac{2z_n^3 + 1}{3z_n^2}.`,
      tag: "3",
    },
    {
      kind: "paragraph",
      content: [
        "The ",
        { kind: "emphasis", content: ["basin of attraction"] },
        " of a root is the set of starting points whose iterates converge to it. Near each root the basin contains a disc, by Theorem 1. The question is what the three basins look like away from the roots, and in particular what separates them.",
      ],
    },
    {
      kind: "code",
      language: "python",
      caption: "Colouring the plane by which root each starting point reaches.",
      code: `import numpy as np

ROOTS = np.array([1, -0.5 + 0.8660254j, -0.5 - 0.8660254j])

def basins(width=1400, height=1400, extent=1.8, max_iter=40, tol=1e-9):
    """For each starting point, record which root it converges to."""
    xs = np.linspace(-extent, extent, width)
    ys = np.linspace(-extent, extent, height)
    z = xs[None, :] + 1j * ys[:, None]

    which = np.full(z.shape, -1, dtype=np.int8)   # -1 = no root yet
    steps = np.zeros(z.shape, dtype=np.int16)

    for n in range(max_iter):
        unresolved = which < 0
        if not unresolved.any():
            break

        # Guard the derivative: z = 0 is the one point where the map is
        # undefined, and it sits exactly on the boundary of all three basins.
        zu = z[unresolved]
        zu = np.where(np.abs(zu) < 1e-15, 1e-15, zu)
        z[unresolved] = (2 * zu**3 + 1) / (3 * zu**2)

        for k, root in enumerate(ROOTS):
            hit = unresolved & (np.abs(z - root) < tol)
            which[hit] = k
            steps[hit] = n

    return which, steps


which, steps = basins()
print(f"unresolved after 40 iterations: {(which < 0).sum()} points")`,
    },
    {
      kind: "figure",
      src: "/figures/newton-basins.png",
      alt: "A square region of the complex plane coloured in three warm tones, one per cube root of unity. Each colour forms a large lobe around its root, but the three colours interleave along their shared boundary in ever finer bulbs, and the same pattern repeats at every scale.",
      width: 1400,
      height: 1400,
      caption: [
        "Basins of attraction for ",
        { kind: "math", tex: String.raw`z^3 - 1` },
        " over ",
        { kind: "math", tex: String.raw`[-1.8, 1.8]^2` },
        ", shaded by how many iterations were needed. The three roots sit at the centres of the largest lobes. Note that no two colours ever share a simple arc of boundary — a third is always wedged in between.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "The picture makes a claim that is worth stating carefully, because it sounds impossible the first time you read it.",
      ],
    },
    {
      kind: "statement",
      variant: "proposition",
      number: "3",
      content: [
        {
          kind: "paragraph",
          content: [
            "For ",
            { kind: "math", tex: String.raw`f(z) = z^3 - 1` },
            ", the three basins have a common boundary: a point lies on the boundary of one basin if and only if it lies on the boundary of all three.",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "So there is no curve you could draw separating basin ",
        { kind: "math", tex: String.raw`A` },
        " from basin ",
        { kind: "math", tex: String.raw`B` },
        " in the way a border separates two countries. Every neighbourhood of every boundary point contains starting values leading to all three roots. That common boundary is the Julia set of the map (3), and its existence is not an artefact of the picture's resolution — zooming in reveals the same interleaving at every scale, which is exactly what the self-similar bulbs in the figure are showing.",
      ],
    },
    {
      kind: "statement",
      variant: "remark",
      content: [
        {
          kind: "paragraph",
          content: [
            "This has a practical consequence that is easy to state and easy to forget. If your starting guess lands anywhere near the boundary, the root you converge to is not merely hard to predict — it is unstable under a perturbation of any size, including one bit in the last place of a floating-point number. Newton's method is fast where it works, but ",
            { kind: "emphasis", content: ["where"] },
            " it works is genuinely complicated, and a production root-finder therefore brackets the root with bisection first and only switches to Newton once it is provably inside a region where Theorem 1 applies. Brent's method is the usual way of doing this.",
          ],
        },
      ],
    },
    { kind: "heading", level: 2, text: "What to take away" },
    {
      kind: "paragraph",
      content: [
        "Quadratic convergence is a theorem about a neighbourhood, and the neighbourhood can be very small. The proof tells you the constant is ",
        { kind: "math", tex: String.raw`M/2m` },
        ", a ratio of the second derivative's size to the first derivative's, so the method is fastest exactly where the function is closest to being a straight line — which is not news, since a straight line is what we replaced it with. The fractal is what you get for assuming that a local theorem was a global one.",
      ],
    },
  ],
};
