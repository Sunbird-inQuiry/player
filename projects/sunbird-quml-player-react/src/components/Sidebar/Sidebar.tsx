import { t, readI18n } from '../../i18n/translations';
import type { Section, AnswersMap } from '../../types';
import styles from './Sidebar.module.scss';

/**
 * Sidebar — persistent section navigator (Phase 6 design).
 *
 * Pure presentational `nav` landmark: a list of section cards (letter badge,
 * name, blurb, answered/total status). The active section is highlighted. Status
 * is derived from Context-supplied props; jump intent is emitted via
 * `onSectionJump` (MainPlayer maps it to setCurrentSection). No Context mutation.
 */
export interface SidebarProps {
  sections: Section[];
  currentSectionIndex: number;
  answers: AnswersMap;
  onSectionJump: (sectionIndex: number) => void;
  language?: string;
  /** Reserved — per-question jumps (used by the question palette where shown). */
  onQuestionJump?: (questionIndex: number) => void;
}

function answeredCount(section: Section, answers: AnswersMap): number {
  return section.children.reduce((n, q) => (answers[q.identifier] ? n + 1 : n), 0);
}

export function Sidebar({
  sections,
  currentSectionIndex,
  answers,
  onSectionJump,
  language = 'en',
}: SidebarProps) {
  return (
    <nav className={styles.sidebar} aria-label={t(language, 'NAVIGATION')}>
      <p className={styles.label}>{t(language, 'SECTIONS')}</p>

      <ul className={styles.list}>
        {sections.map((section, index) => {
          const isActive = index === currentSectionIndex;
          const total = section.children.length;
          const answered = answeredCount(section, answers);
          const blurb = readI18n(section.description, language);
          const letter = String.fromCharCode(65 + index);
          return (
            <li key={section.identifier}>
              <button
                type="button"
                className={`${styles.card} ${isActive ? styles.active : ''}`.trim()}
                onClick={() => onSectionJump(index)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span
                  className={`${styles.badge} ${isActive ? styles.badgeActive : ''}`.trim()}
                  aria-hidden="true"
                >
                  {letter}
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>{section.name}</span>
                  {blurb && <span className={styles.blurb}>{blurb}</span>}
                  <span className={styles.status}>
                    <span className={styles.answered}>✓ {answered}</span>
                    <span className={styles.remaining}>○ {total}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
