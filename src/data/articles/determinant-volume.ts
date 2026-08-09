import type { Article } from "../types";

export const determinantVolume: Article = {
  slug: "why-the-determinant-measures-volume",
  title: "Why the Determinant Measures Volume",
  standfirst:
    "The formula comes first in most courses and the meaning comes later, if at all. Taking the meaning as the definition makes the formula inevitable.",
  authorIds: ["leila-farouk"],
  publishedOn: "2026-06-18",
  description:
    "Three geometric properties — multilinearity, the alternating property, and a unit cube of volume one — force the determinant to be exactly what it is. A derivation from area rather than from cofactors.",
  topics: ["linear-algebra"],
  tags: ["determinants", "volume", "multilinear algebra", "proof"],
  format: "article",
  readingMinutes: 11,
  featured: true,
  review: {
    status: "peer-reviewed",
    reviewerIds: ["nadia-okonkwo", "hana-sato"],
    completedOn: "2026-06-09",
  },
  body: [
    {
      kind: "paragraph",
      content: [
        "The determinant is usually introduced as a recipe. For a ",
        { kind: "math", tex: String.raw`2 \times 2` },
        " matrix you are told to compute ",
        { kind: "math", tex: String.raw`ad - bc`, },
        "; for larger matrices you are handed cofactor expansion and left to get on with it. The recipe works, but nothing about it explains why the answer should be zero exactly when the matrix is singular, or why the determinant of a product is the product of the determinants.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "There is a better order of presentation. Decide first what the determinant is ",
        { kind: "emphasis", content: ["for"] },
        " — measuring how a linear map scales volume — write down the three properties any such measurement must have, and then show that those three properties admit exactly one function. The formula falls out at the end as a theorem rather than arriving at the start as an assertion.",
      ],
    },
    { kind: "heading", level: 2, text: "Signed area in the plane" },
    {
      kind: "paragraph",
      content: [
        "Take two vectors ",
        { kind: "math", tex: String.raw`\mathbf{u}, \mathbf{v} \in \mathbb{R}^2` },
        " and let ",
        { kind: "math", tex: String.raw`A(\mathbf{u}, \mathbf{v})` },
        " denote the signed area of the parallelogram they span. Signed, because we want to distinguish the pair ",
        { kind: "math", tex: String.raw`(\mathbf{u}, \mathbf{v})` },
        " from the pair ",
        { kind: "math", tex: String.raw`(\mathbf{v}, \mathbf{u})` },
        ": one is a right-handed frame and the other is not, and a measurement that forgets the difference will not be able to detect when a map turns space inside out.",
      ],
    },
    {
      kind: "statement",
      variant: "definition",
      number: "1",
      content: [
        {
          kind: "paragraph",
          content: [
            "A function ",
            { kind: "math", tex: String.raw`D : (\mathbb{R}^n)^n \to \mathbb{R}` },
            " is an ",
            { kind: "emphasis", content: ["n-dimensional volume form"] },
            " if it is linear in each argument separately, vanishes whenever two of its arguments are equal, and satisfies ",
            { kind: "math", tex: String.raw`D(\mathbf{e}_1, \dots, \mathbf{e}_n) = 1` },
            " on the standard basis.",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Each condition is a statement about area that you would accept without argument if someone drew it for you. Linearity in the first argument says that stretching one edge of a parallelogram by a factor of ",
        { kind: "math", tex: String.raw`\lambda` },
        " stretches its area by ",
        { kind: "math", tex: String.raw`\lambda` },
        ", and that laying two parallelograms edge to edge adds their areas:",
      ],
    },
    {
      kind: "math",
      tex: String.raw`A(\lambda\mathbf{u} + \mathbf{u}', \mathbf{v}) = \lambda A(\mathbf{u}, \mathbf{v}) + A(\mathbf{u}', \mathbf{v}).`,
      tag: "1",
    },
    {
      kind: "paragraph",
      content: [
        "The alternating condition says a degenerate parallelogram — one whose two edges point along the same line — has no area at all. And the normalisation says the unit square has area one, which is only a choice of units.",
      ],
    },
    {
      kind: "figure",
      src: "/figures/determinant-parallelogram.png",
      alt: "Two parallelograms drawn on the same base. The first is spanned by vectors u and v; the second is spanned by u and v plus two copies of u, so it is taller and slanted, but both have the same height above the base and therefore the same area.",
      width: 1600,
      height: 660,
      caption: [
        "Shearing costs nothing. Replacing ",
        { kind: "math", tex: String.raw`\mathbf{v}` },
        " by ",
        { kind: "math", tex: String.raw`\mathbf{v} + \lambda\mathbf{u}` },
        " slides the far edge along the direction of the base, leaving the perpendicular height — and so the area — unchanged. This is the alternating property and linearity working together, and it is the whole content of row reduction.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "That last observation deserves emphasis, because it is the entire justification for Gaussian elimination as a way of computing determinants. Expanding ",
        { kind: "math", tex: String.raw`A(\mathbf{u}, \mathbf{v} + \lambda\mathbf{u})` },
        " by linearity gives ",
        { kind: "math", tex: String.raw`A(\mathbf{u}, \mathbf{v}) + \lambda A(\mathbf{u}, \mathbf{u})` },
        ", and the second term vanishes because its arguments coincide. Adding a multiple of one column to another leaves the determinant alone — not as a computational trick, but because sliding a shape along its own base does not change how much space it occupies.",
      ],
    },
    { kind: "heading", level: 2, text: "Antisymmetry is not an extra assumption" },
    {
      kind: "paragraph",
      content: [
        "It is worth noticing how little we had to assume. We never said that swapping two arguments flips the sign; that comes for free.",
      ],
    },
    {
      kind: "statement",
      variant: "lemma",
      number: "2",
      content: [
        {
          kind: "paragraph",
          content: [
            "If ",
            { kind: "math", tex: String.raw`D` },
            " is multilinear and vanishes when two arguments are equal, then interchanging any two arguments negates ",
            { kind: "math", tex: String.raw`D` },
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
            "Fix all arguments but two, and write ",
            { kind: "math", tex: String.raw`D(\mathbf{x}, \mathbf{y})` },
            " for the resulting function of those two. By hypothesis ",
            { kind: "math", tex: String.raw`D(\mathbf{x} + \mathbf{y}, \mathbf{x} + \mathbf{y}) = 0` },
            ". Expanding by linearity in each slot,",
          ],
        },
        {
          kind: "math",
          tex: String.raw`0 = D(\mathbf{x},\mathbf{x}) + D(\mathbf{x},\mathbf{y}) + D(\mathbf{y},\mathbf{x}) + D(\mathbf{y},\mathbf{y}) = D(\mathbf{x},\mathbf{y}) + D(\mathbf{y},\mathbf{x}),`,
        },
        {
          kind: "paragraph",
          content: [
            "since the two outer terms vanish. Hence ",
            { kind: "math", tex: String.raw`D(\mathbf{y},\mathbf{x}) = -D(\mathbf{x},\mathbf{y})` },
            ".",
          ],
        },
      ],
    },
    { kind: "heading", level: 2, text: "There is only one such function" },
    {
      kind: "statement",
      variant: "theorem",
      number: "3",
      content: [
        {
          kind: "paragraph",
          content: [
            "There is exactly one ",
            { kind: "math", tex: String.raw`n` },
            "-dimensional volume form, and for the matrix ",
            { kind: "math", tex: String.raw`A` },
            " whose columns are ",
            { kind: "math", tex: String.raw`\mathbf{a}_1, \dots, \mathbf{a}_n` },
            " it is given by",
          ],
        },
        {
          kind: "math",
          tex: String.raw`\det A = \sum_{\sigma \in S_n} \operatorname{sgn}(\sigma) \prod_{i=1}^{n} a_{\sigma(i)\,i}.`,
          tag: "2",
        },
      ],
    },
    {
      kind: "proof",
      content: [
        {
          kind: "paragraph",
          content: [
            "Write each column in the standard basis as ",
            { kind: "math", tex: String.raw`\mathbf{a}_i = \sum_{j=1}^{n} a_{ji}\,\mathbf{e}_j` },
            " and expand ",
            { kind: "math", tex: String.raw`D(\mathbf{a}_1, \dots, \mathbf{a}_n)` },
            " using linearity in every slot at once. The result is a sum over all functions ",
            { kind: "math", tex: String.raw`f : \{1,\dots,n\} \to \{1,\dots,n\}` },
            ":",
          ],
        },
        {
          kind: "math",
          tex: String.raw`D(\mathbf{a}_1,\dots,\mathbf{a}_n) = \sum_{f} \left(\prod_{i=1}^{n} a_{f(i)\,i}\right) D(\mathbf{e}_{f(1)}, \dots, \mathbf{e}_{f(n)}).`,
        },
        {
          kind: "paragraph",
          content: [
            "If ",
            { kind: "math", tex: String.raw`f` },
            " is not injective then two of the arguments of ",
            { kind: "math", tex: String.raw`D` },
            " are the same basis vector, and that term is zero. So only the ",
            { kind: "math", tex: String.raw`n!` },
            " permutations survive. For a permutation ",
            { kind: "math", tex: String.raw`\sigma` },
            ", Lemma 2 lets us sort the arguments back into the order ",
            { kind: "math", tex: String.raw`\mathbf{e}_1, \dots, \mathbf{e}_n` },
            " one transposition at a time, picking up a factor of ",
            { kind: "math", tex: String.raw`-1` },
            " each time; the accumulated factor is ",
            { kind: "math", tex: String.raw`\operatorname{sgn}(\sigma)` },
            ", which is well defined precisely because the parity of a permutation does not depend on how it is written. Therefore ",
            { kind: "math", tex: String.raw`D(\mathbf{e}_{\sigma(1)},\dots,\mathbf{e}_{\sigma(n)}) = \operatorname{sgn}(\sigma)\,D(\mathbf{e}_1,\dots,\mathbf{e}_n) = \operatorname{sgn}(\sigma)` },
            " by normalisation, and substituting gives (2).",
          ],
        },
        {
          kind: "paragraph",
          content: [
            "Every step was forced, so any two volume forms agree; and a direct check that (2) is multilinear, alternating and equal to one at the identity shows that at least one exists.",
          ],
        },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Two familiar facts are now immediate. A matrix is singular exactly when its columns are linearly dependent, in which case the parallelepiped they span is flat and has zero volume — so ",
        { kind: "math", tex: String.raw`\det A = 0` },
        ". And because ",
        { kind: "math", tex: String.raw`B \mapsto \det(AB)` },
        " is itself multilinear and alternating in the columns of ",
        { kind: "math", tex: String.raw`B` },
        ", it must equal ",
        { kind: "math", tex: String.raw`\det(A)\det(B)` },
        " by uniqueness — applying two maps in sequence multiplies the two volume scalings, which is the only thing volume could possibly do.",
      ],
    },
    {
      kind: "statement",
      variant: "example",
      number: "4",
      content: [
        {
          kind: "paragraph",
          content: [
            "The matrix ",
            { kind: "math", tex: String.raw`A = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}` },
            " sends the unit square to the parallelogram spanned by ",
            { kind: "math", tex: String.raw`(2,0)` },
            " and ",
            { kind: "math", tex: String.raw`(1,3)` },
            ". Shearing the second column by ",
            { kind: "math", tex: String.raw`-\tfrac{1}{2}` },
            " times the first replaces it with ",
            { kind: "math", tex: String.raw`(0,3)` },
            " without changing the area, leaving a rectangle of area ",
            { kind: "math", tex: String.raw`2 \times 3 = 6` },
            ". And indeed ",
            { kind: "math", tex: String.raw`\det A = 2\cdot 3 - 1 \cdot 0 = 6` },
            ".",
          ],
        },
      ],
    },
    { kind: "heading", level: 2, text: "Computing it honestly" },
    {
      kind: "paragraph",
      content: [
        "Formula (2) is a fine theorem and a terrible algorithm: it has ",
        { kind: "math", tex: String.raw`n!` },
        " terms, so a ",
        { kind: "math", tex: String.raw`20 \times 20` },
        " determinant would need more additions than there are seconds in the age of the universe. The shearing argument gives the practical method instead. Row reduce to triangular form, tracking the two operations that do change the answer — swapping rows negates it, scaling a row scales it — and read the determinant off the diagonal.",
      ],
    },
    {
      kind: "code",
      language: "python",
      caption: "Gaussian elimination with partial pivoting. O(n³) rather than O(n!).",
      code: `def determinant(matrix):
    """Determinant by LU factorisation with partial pivoting."""
    a = [row[:] for row in matrix]      # work on a copy
    n = len(a)
    det = 1.0

    for col in range(n):
        # Pivot on the largest available entry: dividing by a tiny pivot
        # is the main source of error in this algorithm.
        pivot = max(range(col, n), key=lambda r: abs(a[r][col]))
        if abs(a[pivot][col]) < 1e-12:
            return 0.0                  # a column of zeros: singular

        if pivot != col:
            a[col], a[pivot] = a[pivot], a[col]
            det = -det                  # Lemma 2, in code

        det *= a[col][col]

        for row in range(col + 1, n):
            factor = a[row][col] / a[col][col]
            for k in range(col, n):
                # Shearing: subtracting a multiple of one row from
                # another leaves the determinant untouched.
                a[row][k] -= factor * a[col][k]

    return det


print(determinant([[2, 1], [0, 3]]))            # 6.0
print(determinant([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))  # ~0.0, singular`,
    },
    {
      kind: "statement",
      variant: "remark",
      content: [
        {
          kind: "paragraph",
          content: [
            "The comparison against ",
            { kind: "math", tex: String.raw`10^{-12}` },
            " in the pivot check is doing something subtler than it looks, and it is not really a mathematical statement at all — it is an admission that we are working in floating point. A genuinely singular matrix will rarely produce an exact zero pivot on a computer. Deciding how small is small enough is the subject of ",
            {
              kind: "link",
              href: "/articles/floating-point-and-the-real-numbers",
              content: ["a separate article"],
            },
            ".",
          ],
        },
      ],
    },
    { kind: "heading", level: 2, text: "Where this goes next" },
    {
      kind: "paragraph",
      content: [
        "Definition 1 never mentioned matrices. It asked for a multilinear alternating function on ",
        { kind: "math", tex: String.raw`n` },
        " vectors, and that object — the ",
        { kind: "math", tex: String.raw`n` },
        "-fold exterior product — is what the determinant really is. Following that thread leads to differential forms, to the change-of-variables factor ",
        { kind: "math", tex: String.raw`|\det J|` },
        " in multivariable integration, and eventually to the statement that Stokes' theorem and the fundamental theorem of calculus are the same theorem. All of it starts with wanting to measure a parallelogram.",
      ],
    },
  ],
};
