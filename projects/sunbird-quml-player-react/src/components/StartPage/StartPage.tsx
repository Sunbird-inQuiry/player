import { t, readI18n } from '../../i18n/translations';
import {
  ClipboardIcon,
  TimerIcon,
  GridIcon,
  AttemptsIcon,
  ChevronRightIcon,
  ShieldIcon,
} from '../icons';
import type { Section } from '../../types';
import styles from './StartPage.module.scss';

/**
 * StartPage — Assessment Overview / details screen (spec §6.1 + §6.2).
 *
 * Pure presentational: a centered column with the assessment identity, a stats
 * card, an "assessment sections" grid, and a Start CTA. All data is derived by
 * MainPlayer from Context and passed as props; this component owns no runtime
 * state and never mutates Context.
 */

/** Letter-badge palette for the first sections (later sections render without a badge). */
const BADGE_COLORS = ['#a85236', '#cc8545', '#c2703c', '#5f8268'];

export interface StartPageProps {
  title: string;
  sections: Section[];
  totalQuestions: number;
  totalSections: number;
  /** Seconds; omit/0 hides the minutes value. */
  timeLimit?: number;
  attemptsLeft?: number;
  onStart: () => void;
  /** Optional jump-to-section from a section card (defaults to Start). */
  onSectionSelect?: (index: number) => void;
  language?: string;
}

/** Format seconds as mm:ss (e.g. 900 → "15:00"). */
function formatMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function StartPage({
  title,
  sections,
  totalQuestions,
  totalSections,
  timeLimit = 0,
  attemptsLeft = 3,
  onStart,
  onSectionSelect,
  language = 'en',
}: StartPageProps) {
  const questionLabel = (n: number) =>
    `${n} ${n === 1 ? t(language, 'QUESTION').toLowerCase() : t(language, 'QUESTIONS').toLowerCase()}`;

  const stats = [
    { key: 'q', icon: <ClipboardIcon size={20} />, label: t(language, 'QUESTIONS'), value: String(totalQuestions) },
    // No time limit → omit the tile entirely (nothing meaningful to show).
    ...(timeLimit > 0
      ? [{ key: 'm', icon: <TimerIcon size={20} />, label: t(language, 'MINUTES_LABEL'), value: formatMinutes(timeLimit) }]
      : []),
    { key: 's', icon: <GridIcon size={20} />, label: t(language, 'SECTIONS'), value: String(totalSections) },
    { key: 'a', icon: <AttemptsIcon size={20} />, label: t(language, 'ATTEMPTS_LEFT'), value: String(attemptsLeft) },
  ];

  return (
    <div className={styles.overview}>
      <main className={styles.main}>
        <div className={styles.heading}>
          <div className={styles.headingText}>
            <h1 className={styles.title}>{title}</h1>
          </div>
          <span className={styles.decoCards} aria-hidden="true">
            <span className={styles.decoCard} />
            <span className={styles.decoCard} />
            <span className={styles.decoCard} />
          </span>
        </div>

        <dl className={styles.statsCard}>
          {stats.map(({ key, icon, label, value }) => (
            <div key={key} className={styles.stat}>
              <span className={styles.statIcon}>{icon}</span>
              <div className={styles.statText}>
                <dt className={styles.statLabel}>{label}</dt>
                <dd className={styles.statValue}>{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <h2 className={styles.sectionsHeading}>{t(language, 'ASSESSMENT_SECTIONS')}</h2>
        <p className={styles.sectionsNote}>{t(language, 'SECTIONS_COVER_NOTE')}</p>

        <div className={styles.grid}>
          {sections.map((section, i) => {
            const blurb = readI18n(section.description, language);
            const name = readI18n(section.name, language);
            const Tag = onSectionSelect ? 'button' : 'div';
            return (
              <Tag
                key={section.identifier}
                className={styles.sectionCard}
                {...(onSectionSelect
                  ? { type: 'button' as const, onClick: () => onSectionSelect(i) }
                  : {})}
              >
                <div className={styles.cardTop}>
                  {i < BADGE_COLORS.length && (
                    <span
                      className={styles.badge}
                      style={{ background: BADGE_COLORS[i] }}
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                  )}
                  <span className={styles.cardName}>{name}</span>
                  <ChevronRightIcon size={18} className={styles.cardChevron} />
                </div>
                <span className={styles.cardCount}>{questionLabel(section.children.length)}</span>
                {blurb && <span className={styles.cardBlurb}>{blurb}</span>}
              </Tag>
            );
          })}
        </div>

        <button type="button" className={styles.startBtn} onClick={onStart}>
          {t(language, 'START_ASSESSMENT')} <span aria-hidden="true">→</span>
        </button>

        <p className={styles.footerNote}>
          <ShieldIcon size={16} className={styles.footerIcon} />
          {t(language, 'TIMER_START_NOTE', { attempts: attemptsLeft })}
        </p>
      </main>
    </div>
  );
}
