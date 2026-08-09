import { Fragment } from "react";
import Image from "next/image";
import type { ArticleBlock, StatementVariant } from "@/data/types";
import { DisplayMath } from "@/components/ui/Math";
import { CodeBlock } from "./blocks/CodeBlock";
import { Inline } from "./blocks/Inline";
import styles from "./ArticleBody.module.css";

const STATEMENT_LABELS: Record<StatementVariant, string> = {
  definition: "Definition",
  theorem: "Theorem",
  lemma: "Lemma",
  proposition: "Proposition",
  corollary: "Corollary",
  example: "Example",
  remark: "Remark",
  exercise: "Exercise",
};

/**
 * Renders an article body.
 *
 * The block union in src/data/types.ts is closed, so every branch here is a kind Lemma
 * has decided to publish, and there is no escape hatch through which article data
 * becomes arbitrary markup. Adding a kind means adding a case, which is the point: the
 * compiler asks for the renderer whenever the content model grows.
 *
 * Figures are numbered as they are encountered rather than in the data, so an author
 * inserting a figure halfway through does not have to renumber the ones after it.
 */
export function ArticleBody({ blocks }: { blocks: readonly ArticleBlock[] }) {
  const numbered = withFigureNumbers(blocks);

  return (
    <div className={styles.body}>
      {numbered.map(({ block, figureNumber }, index) => (
        <Block key={index} block={block} figureNumber={figureNumber} />
      ))}
    </div>
  );
}

/** Assign consecutive figure numbers without mutating during JSX render. */
function withFigureNumbers(
  blocks: readonly ArticleBlock[],
): { block: ArticleBlock; figureNumber: number }[] {
  return blocks.reduce<{ items: { block: ArticleBlock; figureNumber: number }[]; count: number }>(
    (acc, block) => {
      if (block.kind !== "figure") {
        return { items: [...acc.items, { block, figureNumber: 0 }], count: acc.count };
      }
      const figureNumber = acc.count + 1;
      return { items: [...acc.items, { block, figureNumber }], count: figureNumber };
    },
    { items: [], count: 0 },
  ).items;
}

function Block({ block, figureNumber }: { block: ArticleBlock; figureNumber: number }) {
  switch (block.kind) {
    case "heading": {
      const id = headingId(block.text);
      return block.level === 2 ? (
        <h2 id={id} className={styles.h2}>
          {block.text}
        </h2>
      ) : (
        <h3 id={id} className={styles.h3}>
          {block.text}
        </h3>
      );
    }

    case "paragraph":
      return (
        <p className={styles.paragraph}>
          <Inline nodes={block.content} />
        </p>
      );

    case "math":
      return (
        <div className={styles.wide}>
          <DisplayMath tex={block.tex} tag={block.tag} />
        </div>
      );

    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className={styles.list}>
          {block.items.map((item, index) => (
            <li key={index}>
              <Inline nodes={item} />
            </li>
          ))}
        </List>
      );
    }

    case "statement":
      return (
        <section className={styles.statement} data-variant={block.variant}>
          <span className={styles.statementLabel}>
            {STATEMENT_LABELS[block.variant]}
            {block.number ? ` ${block.number}` : ""}
            {block.title && <span className={styles.statementName}> · {block.title}</span>}
          </span>
          <Nested blocks={block.content} />
        </section>
      );

    case "proof":
      return (
        <section className={styles.proof}>
          <ProofContent block={block} />
        </section>
      );

    case "figure":
      return (
        <figure className={styles.figure}>
          <div className={styles.figureFrame}>
            <Image
              className={styles.figureImage}
              src={block.src}
              alt={block.alt}
              width={block.width}
              height={block.height}
              sizes="(min-width: 48rem) 46rem, 100vw"
            />
          </div>
          {block.caption && (
            <figcaption className={styles.caption}>
              <span className={styles.captionIndex}>Figure {figureNumber}. </span>
              <Inline nodes={block.caption} />
            </figcaption>
          )}
        </figure>
      );

    case "code":
      return (
        <div className={styles.wide}>
          <CodeBlock code={block.code} language={block.language} caption={block.caption} />
        </div>
      );

    case "quote":
      return (
        <blockquote className={styles.quote}>
          <p>
            <Inline nodes={block.content} />
          </p>
          {block.attribution && <span className={styles.attribution}>{block.attribution}</span>}
        </blockquote>
      );
  }
}

/**
 * The "Proof." lead-in runs into the first paragraph rather than sitting on its own
 * line, which is how it is set in print and what keeps a two-line proof from occupying
 * four lines. The tombstone closes the last paragraph for the same reason; a proof that
 * ends on an equation gets it on a line of its own instead.
 */
function ProofContent({ block }: { block: Extract<ArticleBlock, { kind: "proof" }> }) {
  const label = (
    <span className={styles.proofLabel}>Proof{block.of ? ` of ${block.of}` : ""}</span>
  );
  const qed = <span className={styles.qed} aria-hidden="true" />;

  let lastParagraph = -1;
  block.content.forEach((child, index) => {
    if (child.kind === "paragraph") lastParagraph = index;
  });

  return (
    <>
      {block.content.map((child, index) => {
        if (child.kind === "paragraph") {
          return (
            <p key={index} className={styles.paragraph}>
              {index === 0 && <>{label} </>}
              <Inline nodes={child.content} />
              {index === lastParagraph && qed}
            </p>
          );
        }
        if (index === 0) {
          return (
            <Fragment key={index}>
              <p className={styles.paragraph}>{label}</p>
              <Block block={child} figureNumber={0} />
            </Fragment>
          );
        }
        return <Block key={index} block={child} figureNumber={0} />;
      })}
      {lastParagraph === -1 && <p className={styles.paragraph}>{qed}</p>}
    </>
  );
}

function Nested({ blocks }: { blocks: readonly ArticleBlock[] }) {
  const numbered = withFigureNumbers(blocks);
  return (
    <>
      {numbered.map(({ block, figureNumber }, index) => (
        <Block key={index} block={block} figureNumber={figureNumber} />
      ))}
    </>
  );
}

/** Stable ids so the contents list and deep links agree. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
