import { t, readI18n } from '../../i18n/translations';
import type { Section } from '../../types';
import styles from './SectionIntro.module.scss';

/**
 * SectionIntro — per-section introduction card (Phase 6 design, spec §6.3).
 *
 * Pure presentational: a banner (section letter + question count) over an
 * instructions panel and a "Start section" CTA. Rendered inside the assessment
 * shell (header + sidebar persist). Emits `onBegin`; no Context mutation.
 */
export interface SectionIntroProps {
  section: Section;
  sectionIndex: number;
  totalSections: number;
  onBegin: () => void;
  onPrevious?: () => void;
  language?: string;
}

export function SectionIntro({ section, sectionIndex, onBegin, language = 'en' }: SectionIntroProps) {
  const letter = String.fromCharCode(65 + sectionIndex);
  const questionCount = section.children?.length ?? 0;
  const instructions = readI18n(section.instructions, language) || t(language, 'MANDATORY_NOTE');

  return (
    <div className={styles.wrap}>
      <article className={styles.card}>
        <div className={styles.banner}>
          <span className={styles.bannerBadge} aria-hidden="true">
            {letter}
          </span>
          <div className={styles.bannerText}>
            <p className={styles.bannerEyebrow}>
              {t(language, 'SECTION')} {letter}
            </p>
            <h1 className={styles.bannerTitle}>
              {questionCount} {t(language, 'QUESTIONS')}
            </h1>
          </div>
          <span className={styles.bannerDeco} aria-hidden="true" />
        </div>

        <div className={styles.body}>
          <div className={styles.instructions}>
            <h2 className={styles.instructionsHeading}>{t(language, 'INSTRUCTIONS')}</h2>
            <div
              className={styles.instructionsBody}
              dangerouslySetInnerHTML={{ __html: instructions }}
            />
          </div>

          <button type="button" className={styles.startBtn} onClick={onBegin}>
            {t(language, 'START_SECTION')} {letter} <span aria-hidden="true">→</span>
          </button>
        </div>
      </article>
    </div>
  );
}
