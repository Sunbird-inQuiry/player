import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as _ from 'lodash-es';
import { UtilService } from '../util-service';
import { readI18n, getBodyField } from '../i18n/i18nField';

@Component({
  standalone: false,
  selector: 'quml-sa',
  templateUrl: './sa.component.html',
  styleUrls: ['./sa.component.scss', '../quml-library.component.scss']
})
export class SaComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() question?: any;
  @Input() replayed?: boolean;
  @Input() baseUrl: string;
  @Input() language: string = 'en';
  @Output() componentLoaded    = new EventEmitter<any>();
  @Output() optionSelected     = new EventEmitter<any>(); // required by IQuestionPlayer; SA never emits it
  @Output() showAnswerClicked  = new EventEmitter<any>();

  showAnswer = false;
  solutions: any;

  get questionHtml(): string {
    return readI18n(getBodyField(this.question), this.language);
  }

  get answer(): string {
    return readI18n(this.question?.answer, this.language) || this.getFtbAnswer() || '';
  }

  /**
   * Solution values resolved to the current language. `solutions` is a map
   * ({id: value}); each value is an I18nValue ({en, ar, ...}) or plain HTML.
   * Bound raw they render as "[object Object]", so resolve to strings here.
   */
  get resolvedSolutions(): string[] {
    if (!this.solutions) { return []; }
    const values = Array.isArray(this.solutions) ? this.solutions : Object.values(this.solutions);
    return values
      .map((v: any) => {
        // Legacy shape: an array of { type, value, src } objects — unwrap to the
        // payload. New shape: an I18nValue map or plain HTML string — use as-is.
        const raw = v && typeof v === 'object' && 'value' in v ? v.value : v;
        return this.resolveAssetSrc(readI18n(raw, this.language));
      })
      .filter(Boolean);
  }

  /**
   * Absolutises root-relative src/poster (img/video/audio/source) in solution
   * HTML using the question's media host, so image/video/audio solutions load
   * from the content host instead of the asset-less local proxy.
   */
  private resolveAssetSrc(html: string): string {
    if (!html) { return html || ''; }
    const mediaArr: any[] = Array.isArray(this.question?.media) ? this.question.media : [];
    const host = (mediaArr.find((m: any) => m.baseUrl)?.baseUrl || this.baseUrl || '').replace(/\/$/, '');
    if (!host) { return html; }
    return html.replace(/\b(src|poster)="(\/[^"]*)"/g, (_m, attr, path) => `${attr}="${host}${path}"`);
  }

  constructor( public domSanitizer: DomSanitizer, private utilService: UtilService ) { }

  ngOnInit() {
    this.solutions = _.isEmpty(this.question?.solutions) ? null : this.question?.solutions;
  }

  /**
   * Restore hook (part of the question-type contract). Short answer is subjective
   * and never emits/persists an answer, so there is intentionally nothing to
   * restore — the blank input on revisit is correct.
   */
  applySavedResponse(): void { /* no-op: SA has no persisted answer */ }

  private getFtbAnswer(): string | null {
    const rd = this.question?.responseDeclaration;
    if (!rd) { return null; }
    const values = Object.values(rd)
      .map((r: any) => readI18n(r?.correctResponse?.value, this.language))
      .filter(Boolean);
    return values.length ? values.join(', ') : null;
  }

  ngAfterViewInit() {
    this.handleKeyboardAccessibility();
    this.utilService.updateSourceOfVideoElement(this.baseUrl, this.question?.media, this.question?.identifier);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.replayed) {
      this.showAnswer = false;
    } else if (this.question?.isAnswerShown) {
      this.showAnswer = true;
    }
  }

  showAnswerToUser() {
    this.showAnswer = true;
    this.showAnswerClicked.emit({
      showAnswer: this.showAnswer
    });
  }

  onEnter(event) {
    /* istanbul ignore else */
    if (event.keyCode === 13) {
      event.stopPropagation();
      this.showAnswerToUser();
    }
  }

  handleKeyboardAccessibility() {
    const elements = Array.from(document.getElementsByClassName('option-body'));
    elements.forEach((element: HTMLElement) => {
      /* istanbul ignore else */
      if (element.offsetHeight) {
        const children = Array.from(element.querySelectorAll("a"));
        children.forEach((child: HTMLElement) => {
            child.setAttribute('tabindex', '-1');
        });
      }
    });
  }
}
