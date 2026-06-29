import { Directive, EventEmitter, Input, Output, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as _ from 'lodash-es';
import { t } from './i18n/translations';
import { readI18n, getBodyField, I18nValue } from './i18n/i18nField';

declare const katex: any;

/** Sanitized option shape shared by the option-list question types (mtf/seq/reo). */
export interface SanitizedOption {
  value: string;
  label: string;
  labelText: string;
}

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

  private readonly _sanitizer = inject(DomSanitizer);

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

  /** Strips HTML tags from a string, returning its plain text. */
  protected stripHtml(html: string): string {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.innerText || el.textContent || '';
  }

  /**
   * Sanitizes a list of `{ value, label }` options into `{ value, label, labelText }`.
   * Shared by mtf/seq/reo, whose option shapes are identical; `label` is the
   * sanitized HTML and `labelText` its plain-text form for accessibility/aria.
   */
  protected sanitizeOptions(opts: any[]): SanitizedOption[] {
    return (opts || []).map(o => {
      const rawHtml  = this.resolveLabel(o.label);
      const safeHtml = this._sanitizer.sanitize(
        SecurityContext.HTML, this._sanitizer.bypassSecurityTrustHtml(rawHtml),
      ) || '';
      return { value: String(o.value), label: safeHtml, labelText: this.stripHtml(safeHtml) };
    });
  }

  /**
   * Reorders `list` so its items appear in the order named by `valueOrder`
   * (matched by `.value`), with any items not named appended in their original
   * order. Pure — returns a new array. This is the shared "restore a saved
   * sequence of values, append leftovers" core for mtf (right column) and seq.
   */
  protected reorderByValues<T extends { value: string }>(list: T[], valueOrder: string[]): T[] {
    const byValue = new Map(list.map(item => [item.value, item]));
    const ordered: T[] = [];
    (valueOrder || []).forEach(v => {
      const item = byValue.get(String(v));
      if (item) { ordered.push(item); byValue.delete(String(v)); }
    });
    byValue.forEach(item => ordered.push(item));
    return ordered;
  }

  /**
   * Restore hook: re-applies `savedResponse` to the component's visible state on
   * revisit. Default is a no-op (types with nothing to persist, e.g. SA). Each
   * question type overrides this. The renderer calls it on mount AND whenever
   * `savedResponse` changes, so restore is decoupled from the mount lifecycle
   * (and stays correct even when the slide view is reused via trackBy).
   */
  applySavedResponse(): void { /* no-op by default */ }
}
