import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { UtilService } from '../util-service';
import { readI18n } from '../i18n/i18nField';
@Component({
  standalone: false,
  selector: 'quml-mcq-solutions',
  templateUrl: './mcq-solutions.component.html',
  styleUrls: ['./mcq-solutions.component.scss']
})
export class McqSolutionsComponent implements AfterViewInit  {
  @Input() question: any;
  @Input() options: any;
  @Input() solutions: any;
  @Input() baseUrl: string;
  @Input() media: any;
  @Input() identifier: string;
  @Input() language: string = 'en';
  /** 'list' (default, one per row) or 'pairs' (two columns) — MTF uses 'pairs'. */
  @Input() optionsLayout: string = 'list';
  @Output() close = new EventEmitter();
  @ViewChild('solutionVideoPlayer' , {static: true}) solutionVideoPlayer: ElementRef;

  showVideoSolution: boolean;
  previousActiveElement: HTMLElement;

  constructor(private utilService: UtilService){}

  /**
   * Resolves the question body for the current language. Multilingual content
   * stores body/labels/solutions as I18nValue maps ({en, ar, ...}); rendered
   * raw they show as "[object Object]", so resolve to a plain string here.
   * Image src is also resolved here (see resolveAssetSrc) so the panel does not
   * depend on the DOM-timing of the section-player's setImageZoom rewrite.
   */
  get resolvedQuestion(): string {
    return this.resolveAssetSrc(readI18n(this.question, this.language));
  }

  /** Option labels resolved to the current language (and image src). */
  get resolvedOptions(): any[] {
    return (this.options || []).map((o: any) => ({
      ...o,
      label: this.resolveAssetSrc(readI18n(o?.label, this.language)),
    }));
  }

  /**
   * Solution values resolved to the current language. The published `solutions`
   * field is a map ({id: value}); each value is an I18nValue or plain HTML.
   * Accepts a legacy array shape too.
   */
  get resolvedSolutions(): string[] {
    if (!this.solutions) return [];
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
   * Absolutises every root-relative `src`/`poster` attribute in an HTML string
   * (covers <img>, <video>, <audio> and their <source> children, plus video
   * posters) using the content host — taken from any media entry's baseUrl, or
   * the panel's baseUrl. Solution media use root-relative paths like
   * "/assets/public/content/..."; left as-is they fall back to the local proxy,
   * which doesn't host these assets. Already-absolute (http...) URLs are left
   * untouched. Runs at bind-time so panel media resolve deterministically rather
   * than racing the section-player's DOM rewrite.
   */
  private resolveAssetSrc(html: string): string {
    if (!html) { return html || ''; }
    const mediaArr: any[] = Array.isArray(this.media) ? this.media : [];
    const host = (mediaArr.find((m: any) => m.baseUrl)?.baseUrl || this.baseUrl || '').replace(/\/$/, '');
    if (!host) { return html; }
    return html.replace(/\b(src|poster)="(\/[^"]*)"/g, (_m, attr, path) => `${attr}="${host}${path}"`);
  }

  closeSolution() {
    if (this.solutionVideoPlayer) {
      this.solutionVideoPlayer.nativeElement.pause();
    }
    this.close.emit({
      close: true
    });
  }

  ngAfterViewInit() {
    this.utilService.updateSourceOfVideoElement(this.baseUrl, this.media, this.identifier);
  }

}
