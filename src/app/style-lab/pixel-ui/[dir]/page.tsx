/*
 * 1案を実寸（スマホ幅）で通して見るページ。
 * 上部のバーで案を切り替えられるようにして、実機での比較をやりやすくしている。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SCREENS } from "../MockScreens";
import { DIRECTIONS } from "../directions";
import styles from "../pixel-ui.module.css";

export function generateStaticParams() {
  return DIRECTIONS.map(({ id }) => ({ dir: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dir: string }>;
}): Promise<Metadata> {
  const { dir } = await params;
  const direction = DIRECTIONS.find((d) => d.id === dir);

  return {
    title: direction
      ? `${direction.name} ${direction.tagline} | ピクセルUI 方向性比較`
      : "ピクセルUI 方向性比較",
    robots: { index: false, follow: false },
  };
}

export default async function PixelUiDirectionPage({
  params,
}: {
  params: Promise<{ dir: string }>;
}) {
  const { dir } = await params;
  const direction = DIRECTIONS.find((d) => d.id === dir);

  if (!direction) {
    notFound();
  }

  return (
    <main className={styles.fullPage}>
      <div className={styles.fullBar}>
        <span className={styles.fullBarTitle}>
          {direction.name}
          <small>{direction.tagline}</small>
        </span>

        {DIRECTIONS.map(({ id, name }) => (
          <Link
            key={id}
            href={`/style-lab/pixel-ui/${id}`}
            className={`${styles.switchLink} ${id === direction.id ? styles.switchOn : ""}`}
          >
            {name}
          </Link>
        ))}

        <Link href="/style-lab/pixel-ui" className={styles.switchLink}>
          比較へ
        </Link>
      </div>

      <div className={styles.fullScreens}>
        {SCREENS.map(({ id, label, Component }) => (
          <section key={id} className={styles.fullScreen} aria-label={label}>
            <span className={styles.fullScreenTag}>{label}</span>
            <Component s={direction.styles} />
          </section>
        ))}
      </div>
    </main>
  );
}
