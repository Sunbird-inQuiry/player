import { useRef, useState } from 'react';
import { t, readI18n } from '../../i18n/translations';
import {
  ClipboardIcon,
  TimerIcon,
  GridIcon,
  AttemptsIcon,
  ChevronRightIcon,
  ShieldIcon,
  PreviousIcon,
} from '../icons';
import type { Section } from '../../types';
import { useIsCompactViewport } from './useIsCompactViewport';
import styles from './StartPage.module.scss';

/**
 * StartPage — Assessment Overview / details screen (spec §6.1 + §6.2).
 *
 * A centered column with the assessment identity, a stats card, an
 * "assessment sections" grid, and a Start CTA. All data is derived by
 * MainPlayer from Context and passed as props; this component never mutates
 * Context.
 *
 * Desktop/tablet/portal/editor: everything renders on one scrollable page
 * (unchanged). Mobile-app only (`useIsCompactViewport`): paged into two
 * screens — stats first, then sections + the Start/Resume CTA — so neither
 * screen needs to scroll on a short/narrow viewport. This is the one bit of
 * local UI state in this component; it never reaches Context or the parent.
 */

/** Letter-badge palette for the first sections (later sections render without a badge). */
const BADGE_COLORS = ['#a85236', '#cc8545', '#c2703c', '#5f8268'];

export interface StartPageProps {
  title: string;
  sections: Section[];
  totalQuestions: number;
  totalSections: number;
  /** Seconds; omit/0 shows "No Limit" instead of a duration. */
  timeLimit?: number;
  /** Omit/null → "No Limit" (the backend didn't send a cap), distinct from an explicit low number. */
  attemptsLeft?: number | null;
  /** True once the assessment has already been entered this attempt (e.g. via
   * the header brand button) — the clock keeps running behind Overview, so the
   * CTA and footer note should read "Resume", not "Start". */
  hasStarted?: boolean;
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
  attemptsLeft = null,
  hasStarted = false,
  onStart,
  onSectionSelect,
  language = 'en',
}: StartPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompact = useIsCompactViewport(containerRef);
  const [step, setStep] = useState<'info' | 'sections'>('info');
  // Non-compact always shows both; compact gates on `step`.
  const showInfo = !isCompact || step === 'info';
  const showSections = !isCompact || step === 'sections';

  const questionLabel = (n: number) =>
    `${n} ${n === 1 ? t(language, 'QUESTION').toLowerCase() : t(language, 'QUESTIONS').toLowerCase()}`;

  // Not sent by the backend → "No Limit" rather than hiding the tile or
  // showing a fabricated number.
  const attemptsDisplay = attemptsLeft == null ? t(language, 'NO_LIMIT') : String(attemptsLeft);

  const stats = [
    { key: 'q', icon: <ClipboardIcon size={20} />, label: t(language, 'QUESTIONS'), value: String(totalQuestions) },
    {
      key: 'm',
      icon: <TimerIcon size={20} />,
      label: t(language, 'MINUTES_LABEL'),
      value: timeLimit > 0 ? formatMinutes(timeLimit) : t(language, 'NO_LIMIT'),
    },
    { key: 's', icon: <GridIcon size={20} />, label: t(language, 'SECTIONS'), value: String(totalSections) },
    { key: 'a', icon: <AttemptsIcon size={20} />, label: t(language, 'ATTEMPTS_LEFT'), value: attemptsDisplay },
  ];

  return (
    <div className={styles.overview} ref={containerRef}>
      <main className={styles.main}>
        {showInfo && (
          // Mobile-app only: this whole block is a flex column filling the
          // screen — .statsCard is flex:1, so the card itself fills the
          // remaining height instead of leaving blank page below it.
          <div className={styles.screenInfo}>
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
          </div>
        )}

        {showSections && (
          // Mobile-app only: also a flex column, but the SECTION GRID is the
          // flex:1/scrollable piece (not the whole screen) — heading/note stay
          // pinned at top and the Start/Resume CTA + footer note stay pinned
          // at the bottom, so the CTA is always reachable without scrolling
          // even with many sections; only the grid between them scrolls.
          <div className={styles.screenSections}>
            {isCompact && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep('info')}
                aria-label={t(language, 'PREVIOUS')}
              >
                <PreviousIcon size={16} /> {t(language, 'PREVIOUS')}
              </button>
            )}

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
              {t(language, hasStarted ? 'RESUME_ASSESSMENT' : 'START_ASSESSMENT')} <span aria-hidden="true">→</span>
            </button>

            <p className={styles.footerNote}>
              <ShieldIcon size={16} className={styles.footerIcon} />
              {t(language, hasStarted ? 'TIMER_RESUME_NOTE' : 'TIMER_START_NOTE', { attempts: attemptsDisplay })}
            </p>
          </div>
        )}
      </main>

      {/* Mobile-app only — a small floating "Next" over the info screen's
          bottom-right corner (screen 1 → screen 2, see `step` above). */}
      {isCompact && showInfo && (
        <button type="button" className={styles.nextBtn} onClick={() => setStep('sections')}>
          {t(language, 'NEXT')} <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
