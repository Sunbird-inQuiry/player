import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { Question } from '../../types';
import styles from './QuestionBody.module.scss';

/**
 * QuestionBody — generic, shared renderer for question text.
 *
 * Responsibilities ONLY:
 * - Render raw HTML body (may contain images, tables, etc.)
 * - Render KaTeX math found in `.math` / `.math-block` elements
 * - RTL support (Arabic)
 *
 * It is question-type AGNOSTIC: no MCQ/SA/MTF/SEQ/REO/FTB logic, no answer
 * handling, no scoring/telemetry/navigation. Every Phase 4 question type reuses
 * this component to render its stem.
 */
interface QuestionBodyProps {
  question: Pick<Question, 'body'>;
  language?: string;
  /** Reserved for resolving relative image paths (used by question types in Phase 4). */
  baseUrl?: string;
}

export function QuestionBody({ question, language = 'en' }: QuestionBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !question?.body) return;

    try {
      // Render the raw HTML body (images, tables, inline markup).
      el.innerHTML = question.body;

      // Find and render KaTeX expressions.
      const mathElements = el.querySelectorAll('.math');
      mathElements.forEach((elem) => {
        try {
          const text = elem.textContent || '';
          const isBlock = elem.classList.contains('math-block');
          katex.render(text, elem as HTMLElement, { displayMode: isBlock });
        } catch (err) {
          console.warn('[QuestionBody] KaTeX render error:', err);
        }
      });
    } catch (err) {
      console.error('[QuestionBody] Error rendering body:', err);
    }
  }, [question?.body]);

  const isRtl = language === 'ar';

  return (
    <div
      ref={containerRef}
      className={`${styles.body} ${isRtl ? styles.rtl : ''}`.trim()}
      lang={language}
      dir={isRtl ? 'rtl' : undefined}
    />
  );
}
