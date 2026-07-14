import type { ReactNode } from 'react';
import type { Question } from '../../types';
import styles from './QuestionCard.module.scss';

/**
 * QuestionCard — card chrome around a question (spec §6.7).
 *
 * Pure layout wrapper: a meta row (category/difficulty) + a body area that hosts
 * the QuestionRenderer output (passed as children) + an optional footer slot.
 * No Context, no scoring, no business logic.
 */
export interface QuestionCardProps {
  question: Question;
  children: ReactNode;
  meta?: { category?: string; difficulty?: string };
  /** Position within the section, e.g. { current: 2, total: 4 } → "2/4". */
  progress?: { current: number; total: number };
  footer?: ReactNode;
}

export function QuestionCard({ question, children, meta, progress, footer }: QuestionCardProps) {
  const category = meta?.category ?? question.primaryCategory;
  const difficulty = meta?.difficulty;
  const hasMeta = Boolean(category || difficulty || progress);

  return (
    <article className={styles.card}>
      {hasMeta && (
        <div className={styles.meta}>
          {category && <span className={styles.category}>{category}</span>}
          {difficulty && <span className={styles.difficulty}>{difficulty}</span>}
          {progress && (
            <span className={styles.progress}>
              {progress.current}/{progress.total}
            </span>
          )}
        </div>
      )}

      <div className={styles.body}>{children}</div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </article>
  );
}
