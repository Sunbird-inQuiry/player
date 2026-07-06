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
  footer?: ReactNode;
}

export function QuestionCard({ question, children, meta, footer }: QuestionCardProps) {
  const category = meta?.category ?? question.primaryCategory;
  const difficulty = meta?.difficulty;
  const hasMeta = Boolean(category || difficulty);

  return (
    <article className={styles.card}>
      {hasMeta && (
        <div className={styles.meta}>
          {category && <span className={styles.category}>{category}</span>}
          {difficulty && <span className={styles.difficulty}>{difficulty}</span>}
        </div>
      )}

      <div className={styles.body}>{children}</div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </article>
  );
}
