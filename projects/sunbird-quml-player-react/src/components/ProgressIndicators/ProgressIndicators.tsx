import { t } from '../../i18n/translations';
import type { Section } from '../../types';
import styles from './ProgressIndicators.module.scss';

/**
 * Progress indicators (spec §6.5) — pure, derived entirely from Context props.
 * Two exports:
 * - ProgressBar:  answered/total bar (role="progressbar").
 * - SectionSteps: active/completed/upcoming section dots.
 */

export interface ProgressBarProps {
  answered: number;
  total: number;
  language?: string;
}

export function ProgressBar({ answered, total, language = 'en' }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className={styles.progressBar}>
      <div className={styles.progressMeta}>
        <span className={styles.progressLabel}>{t(language, 'PROGRESS')}</span>
        <span className={styles.progressCount}>
          {answered} {t(language, 'OF')} {total}
        </span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={t(language, 'PROGRESS')}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export interface SectionStepsProps {
  sections: Section[];
  currentSectionIndex: number;
  completed: boolean[];
  language?: string;
}

export function SectionSteps({
  sections,
  currentSectionIndex,
  completed,
  language = 'en',
}: SectionStepsProps) {
  return (
    <ol className={styles.steps} aria-label={t(language, 'SECTIONS')}>
      {sections.map((section, index) => {
        const state =
          index === currentSectionIndex
            ? 'active'
            : completed[index]
              ? 'completed'
              : 'upcoming';
        return (
          <li
            key={section.identifier}
            className={`${styles.step} ${styles[state]}`}
            aria-current={state === 'active' ? 'step' : undefined}
            title={section.name}
          >
            <span className={styles.dot} aria-hidden="true">
              {index + 1}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
