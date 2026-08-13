import Link from "next/link";
import { LemmaWordmark } from "@/components/brand/LemmaWordmark";
import { TOPICS } from "@/data/topics";
import { archiveHref } from "@/lib/articles/query";
import styles from "./SiteFooter.module.css";

const BROWSE = [
  { href: "/articles", label: "All articles" },
  { href: "/topics", label: "Topics" },
  { href: "/authors", label: "Authors" },
  { href: "/about", label: "About Lemma" },
];

const CONTRIBUTE = [
  { href: "/dashboard", label: "Contributor dashboard" },
  { href: "/about#writing", label: "Write for Lemma" },
  { href: "/about#review", label: "Peer review" },
];

export function SiteFooter() {
  const topicColumns = [TOPICS.slice(0, 5), TOPICS.slice(5)];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <LemmaWordmark size="md" tagline="Mathematical Publication" />
          <p className={styles.blurb}>
            A student-run journal and archive of mathematical writing — articles,
            investigations, essays and problems, refereed by students.
          </p>
        </div>

        <div>
          <h2 className={styles.columnTitle}>Browse</h2>
          <div className={styles.list}>
            {BROWSE.map((item) => (
              <Link key={item.href} href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className={styles.columnTitle}>Topics</h2>
          <div className={styles.list}>
            {topicColumns[0]!.map((topic) => (
              <Link
                key={topic.id}
                href={archiveHref({ topics: [topic.id] })}
                className={styles.link}
              >
                {topic.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className={styles.columnTitle}>More</h2>
          <div className={styles.list}>
            {topicColumns[1]!.map((topic) => (
              <Link
                key={topic.id}
                href={archiveHref({ topics: [topic.id] })}
                className={styles.link}
              >
                {topic.name}
              </Link>
            ))}
            {CONTRIBUTE.slice(0, 1).map((item) => (
              <Link key={item.href} href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>© {new Date().getFullYear()} Lemma. Written and refereed by students.</span>
          <span className={styles.prototype}>V0.1 beta</span>
        </div>
      </div>
    </footer>
  );
}
