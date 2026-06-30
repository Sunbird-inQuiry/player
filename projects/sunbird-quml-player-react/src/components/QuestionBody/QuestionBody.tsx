import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { resolveMediaHtml } from '../../utils/media';
import type { MediaItem } from '../../utils/media';
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
  question: Pick<Question, 'body' | 'media'>;
  language?: string;
  /** Content base URL for resolving relative image/asset paths. */
  baseUrl?: string;
}

export function QuestionBody({ question, language = 'en', baseUrl = '' }: QuestionBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !question?.body) return;

    try {
      // Render the raw HTML body with images resolved (figure placeholders from
      // media, asset-variable + relative <img> src via baseUrl) then KaTeX.
      el.innerHTML = resolveMediaHtml(question.body, question.media as MediaItem[], baseUrl);

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
  }, [question?.body, question?.media, baseUrl]);

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
