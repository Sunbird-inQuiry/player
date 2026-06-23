import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { t } from './i18n/translations';
import { readI18n, getBodyField, I18nValue } from './i18n/i18nField';

declare const katex: any;

@Directive({ standalone: false })
export abstract class BaseQuestionDirective {
  @Input() question: any;
  @Input() replayed: boolean;
  @Input() tryAgain: boolean;
  @Input() baseUrl: string;
  @Input() language: string = 'en';
  @Input() shuffleOptions: boolean;
  @Input() savedResponse: any;

  @Output() componentLoaded = new EventEmitter<any>();
  @Output() optionSelected  = new EventEmitter<any>();

  get dir(): 'ltr' | 'rtl' {
    return this.language === 'ar' ? 'rtl' : 'ltr';
  }

  translate(key: string, n?: number): string {
    return t(this.language, key, n);
  }

  /**
   * Resolves the question body for the current language.
   * Uses readI18n so I18nValue maps ({en: '...', ar: '...'}) are handled
   * with EN fallback — same contract as the editor's readI18n helper.
   */
  protected resolveBody(): string {
    let resolved = readI18n(getBodyField(this.question), this.language);

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

  /**
   * Resolves an option label for the current language.
   * Accepts I18nValue ({en: '...', ar: '...'}) or plain string.
   */
  protected resolveLabel(label: I18nValue | undefined): string {
    return readI18n(label, this.language);
  }

  protected renderLatex(): void {
    setTimeout(() => {
      const root = document.getElementById(this.question?.identifier);
      if (!root) return;
      Array.from(root.getElementsByClassName('mathText')).forEach((el: any) =>
        katex.render(el.innerHTML, el, { displayMode: false, output: 'html', throwOnError: false }));
    }, 100);
  }
}
