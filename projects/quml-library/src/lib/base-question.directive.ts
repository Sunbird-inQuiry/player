import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { t } from './i18n/translations';

declare const katex: any;

/**
 * Shared base for FTB, MTF, and Ordered question components.
 * Holds common inputs, outputs, and utility methods so subclasses
 * only contain their own interaction logic.
 */
@Directive({ standalone: false })
export abstract class BaseQuestionDirective {
  @Input() question: any;
  @Input() replayed: boolean;
  @Input() tryAgain: boolean;
  @Input() baseUrl: string;
  @Input() language: string = 'en';
  @Input() shuffleOptions: boolean;

  @Output() componentLoaded = new EventEmitter<any>();
  @Output() optionSelected  = new EventEmitter<any>();

  /** 'rtl' for Arabic, 'ltr' for everything else. */
  get dir(): 'ltr' | 'rtl' {
    return this.language === 'ar' ? 'rtl' : 'ltr';
  }

  /** Looks up a UI string in the current language with optional {n} substitution. */
  translate(key: string, n?: number): string {
    return t(this.language, key, n);
  }

  /**
   * Returns the question body as a plain string.
   * If the body is a bilingual object {en: '...', hi: '...'},
   * picks the current language, falling back to 'en'.
   */
  protected resolveBody(): string {
    const body = this.question?.body;
    let resolved: string = (body && typeof body === 'object')
      ? (body[this.language] ?? body['en'] ?? '')
      : (body ?? '');

    const imageMedia: any[] = (this.question?.media ?? []).filter((m: any) => m.type === 'image');
    if (imageMedia.length && resolved.includes('<figure')) {
      let idx = 0;
      resolved = resolved.replace(/<figure\b[^>]*class="[^"]*\bimage\b[^"]*"[^>]*>\s*<\/figure>/g, () => {
        const m = imageMedia[idx++];
        if (!m) return '<figure class="image"></figure>';
        const src = m.src?.startsWith('http') ? m.src : (m.baseUrl ?? '') + m.src;
        return `<figure class="image"><img src="${src}" style="max-width:100%"></figure>`;
      });
    }

    return resolved;
  }

  /** Re-renders any KaTeX math elements inside this question's container. */
  protected renderLatex(): void {
    setTimeout(() => {
      const root = document.getElementById(this.question?.identifier);
      if (!root) return;
      Array.from(root.getElementsByClassName('mathText')).forEach((el: any) =>
        katex.render(el.innerHTML, el, { displayMode: false, output: 'html', throwOnError: false }));
    }, 100);
  }
}
