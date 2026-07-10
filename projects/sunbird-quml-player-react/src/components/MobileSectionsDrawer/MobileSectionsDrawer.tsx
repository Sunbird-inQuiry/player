import { useEffect, useRef } from 'react';
import { t } from '../../i18n/translations';
import { Sidebar } from '../Sidebar/Sidebar';
import { CloseIcon } from '../icons';
import type { Section, AnswersMap } from '../../types';
import styles from './MobileSectionsDrawer.module.scss';

/**
 * MobileSectionsDrawer — slide-in navigator for < 768px (spec §6.6).
 *
 * Reuses Sidebar/QuestionPalette content. Accessibility (spec §6.10):
 * focus trap while open, `Esc` closes, `aria-modal`, focus returns to the toggle.
 * Pure presentational beyond the focus-management effect; no Context mutation.
 */
export interface MobileSectionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  currentSectionIndex: number;
  answers: AnswersMap;
  onSectionJump: (sectionIndex: number) => void;
  language?: string;
}

export function MobileSectionsDrawer({
  isOpen,
  onClose,
  sections,
  currentSectionIndex,
  answers,
  onSectionJump,
  language = 'en',
}: MobileSectionsDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Focus management: trap focus inside the panel, restore on close.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute('disabled'));

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={t(language, 'NAVIGATION')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>{t(language, 'NAVIGATION')}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t(language, 'CLOSE_MENU')}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <Sidebar
          sections={sections}
          currentSectionIndex={currentSectionIndex}
          answers={answers}
          onSectionJump={(i) => {
            onSectionJump(i);
            onClose();
          }}
          language={language}
        />
      </div>
    </div>
  );
}
