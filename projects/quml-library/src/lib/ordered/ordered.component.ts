import {
  Component, OnInit, OnChanges, SimpleChanges, SecurityContext, AfterViewInit,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import * as _ from 'lodash-es';
import { UtilService } from '../util-service';
import { BaseQuestionDirective } from '../base-question.directive';

interface OrderedItem {
  value: string;
  label: string;
  labelText: string;
}

@Component({
  standalone: false,
  selector: 'quml-ordered',
  templateUrl: './ordered.component.html',
  styleUrls: ['./ordered.component.scss', '../quml-library.component.scss'],
})
export class OrderedComponent extends BaseQuestionDirective implements OnInit, OnChanges, AfterViewInit {

  key: string;
  resolvedBody: string = '';

  // SEQ: draggable vertical list
  items: OrderedItem[] = [];

  // REO: word-chip builder
  availableWords: OrderedItem[] = [];
  selectedWords: OrderedItem[]  = [];

  get isReo(): boolean { return this.question?.qType?.toUpperCase() === 'REO'; }
  get isSeq(): boolean { return !this.isReo; }
  get seqLayout(): string {
    switch (this.question?.templateId) {
      case 'seq-vertical-split': return 'SPLIT';
      case 'seq-horizontal':     return 'HORIZONTAL';
      default:                   return 'DEFAULT';
    }
  }

  constructor(
    public domSanitizer: DomSanitizer,
    public utilService: UtilService,
  ) { super(); }

  ngOnInit(): void {
    this.resolvedBody = this.resolveBody();
    this.key = this.utilService.getKeyValue(Object.keys(this.question.responseDeclaration));
    const processed = this.buildItems(this.getLocalizedOptions());

    if (this.isReo) {
      this.availableWords = _.shuffle(processed);
      this.selectedWords  = [];
    } else {
      this.items = _.shuffle(processed);
    }

    this.componentLoaded.emit({ identifier: this.question.identifier });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['language'] && !changes['language'].firstChange) {
      this.resolvedBody = this.resolveBody();
      const processed = this.buildItems(this.getLocalizedOptions());
      if (this.isReo) {
        this.availableWords = _.shuffle(processed);
        this.selectedWords  = [];
      } else {
        this.items = _.shuffle(processed);
      }
    }
    if (changes['replayed'] && this.replayed) { this.resetItems(); }
    if (changes['tryAgain'] && this.tryAgain) {
      this.resetItems();
      this.optionSelected.emit({ cardinality: 'ordered', option: null, solutions: [] });
    }
  }

  ngAfterViewInit(): void { this.renderLatex(); }

  // ── SEQ: drag-and-drop ──────────────────────────────────
  drop(event: CdkDragDrop<OrderedItem[]>): void {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.emitSeqAnswer();
  }

  // ── REO: word chip click-to-build ───────────────────────
  addWord(item: OrderedItem): void {
    this.availableWords = this.availableWords.filter(w => w.value !== item.value);
    this.selectedWords.push(item);
    this.emitReoAnswer();
  }

  removeWord(item: OrderedItem): void {
    this.selectedWords  = this.selectedWords.filter(w => w.value !== item.value);
    this.availableWords.push(item);
    this.emitReoAnswer();
  }

  clearAll(): void {
    this.availableWords = [...this.availableWords, ...this.selectedWords];
    this.selectedWords  = [];
    this.optionSelected.emit({ cardinality: 'ordered', option: null, solutions: [] });
  }

  private resetItems(): void {
    const processed = this.buildItems(this.getLocalizedOptions());
    if (this.isReo) {
      this.availableWords = _.shuffle(processed);
      this.selectedWords  = [];
    } else {
      this.items = _.shuffle(processed);
    }
  }

  /**
   * Returns options for the current language.
   * Checks interactions[key].i18n[lang].options first (editor's per-language store),
   * falls back to the top-level options array (English default).
   */
  private getLocalizedOptions(): any[] {
    const interaction = this.question?.interactions?.[this.key];
    if (!interaction) return [];
    return interaction.i18n?.[this.language]?.options
        ?? interaction.i18n?.['en']?.options
        ?? interaction.options
        ?? [];
  }

  private buildItems(rawOpts: any[]): OrderedItem[] {
    return this.sanitizeOptions(rawOpts);
  }

  private emitSeqAnswer(): void {
    this.optionSelected.emit({
      cardinality: 'ordered',
      option: { userOrder: this.items.map(i => i.value) },
      solutions: [],
    });
  }

  private emitReoAnswer(): void {
    this.optionSelected.emit({
      cardinality: 'ordered',
      option: { userOrder: this.selectedWords.map(i => i.value) },
      solutions: [],
    });
  }

  private sanitizeOptions(opts: any[]): OrderedItem[] {
    return (opts || []).map(o => {
      const rawHtml  = this.resolveLabel(o.label);
      const safeHtml = this.domSanitizer.sanitize(
        SecurityContext.HTML, this.domSanitizer.bypassSecurityTrustHtml(rawHtml),
      ) || '';
      return { value: String(o.value), label: safeHtml, labelText: this.stripHtml(safeHtml) };
    });
  }

  private stripHtml(html: string): string {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.innerText || el.textContent || '';
  }

}
