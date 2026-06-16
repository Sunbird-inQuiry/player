import {
  Component, OnInit, OnChanges, SimpleChanges, SecurityContext, AfterViewInit,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import * as _ from 'lodash-es';
import { UtilService } from '../util-service';
import { BaseQuestionDirective } from '../base-question.directive';

interface MtfOption {
  value: string;
  label: string;
  labelText: string;
}

@Component({
  standalone: false,
  selector: 'quml-mtf',
  templateUrl: './mtf.component.html',
  styleUrls: ['./mtf.component.scss', '../quml-library.component.scss'],
})
export class MtfComponent extends BaseQuestionDirective implements OnInit, OnChanges, AfterViewInit {

  key: string;
  left: MtfOption[]  = [];
  right: MtfOption[] = [];
  correctValue: Record<string, string> = {};
  solutions: string[] = [];
  resolvedBody: string = '';

  constructor(
    public domSanitizer: DomSanitizer,
    public utilService: UtilService,
  ) { super(); }

  ngOnInit(): void {
    this.resolvedBody = this.resolveBody();
    this.key = this.utilService.getKeyValue(Object.keys(this.question.responseDeclaration));
    const opts = this.question.interactions[this.key].options;
    this.left  = this.sanitizeOptions(opts.left);
    // Shuffle right items so user has to actually match them
    this.right = _.shuffle(this.sanitizeOptions(opts.right));
    this.correctValue = this.question.responseDeclaration[this.key].correctResponse.value || {};
    this.solutions    = this.question.solutions ? _.values(this.question.solutions) : [];
    this.componentLoaded.emit({ identifier: this.question.identifier });
    setTimeout(() => this.emitAnswer());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['language'] && !changes['language'].firstChange) {
      this.resolvedBody = this.resolveBody();
    }
    if (changes['replayed'] && this.replayed) {
      this.right = _.shuffle([...this.right]);
      this.emitAnswer();
    }
    if (changes['tryAgain'] && this.tryAgain) {
      this.right = _.shuffle([...this.right]);
      this.optionSelected.emit({ cardinality: 'map', option: null, solutions: [] });
    }
  }

  ngAfterViewInit(): void { this.renderLatex(); }

  drop(event: CdkDragDrop<MtfOption[]>): void {
    moveItemInArray(this.right, event.previousIndex, event.currentIndex);
    this.emitAnswer();
  }

  private emitAnswer(): void {
    // Pairing: left[i] ↔ right[i] by position after reorder
    const userResponse: Record<string, string> = {};
    this.left.forEach((l, i) => {
      if (this.right[i]) { userResponse[l.value] = this.right[i].value; }
    });
    this.optionSelected.emit({
      cardinality: 'map',
      option: { userResponse },
      solutions: [],
    });
  }

  private sanitizeOptions(opts: any[]): MtfOption[] {
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
