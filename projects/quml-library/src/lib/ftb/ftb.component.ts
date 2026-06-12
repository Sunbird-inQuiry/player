import {
  Component, OnInit, OnChanges, SimpleChanges, AfterViewInit,
} from '@angular/core';
import { UtilService } from '../util-service';
import { BaseQuestionDirective } from '../base-question.directive';

interface Segment {
  type: 'html' | 'blank';
  content?: string;
  key?: string;
}

@Component({
  standalone: false,
  selector: 'quml-ftb',
  templateUrl: './ftb.component.html',
  styleUrls: ['./ftb.component.scss', '../quml-library.component.scss'],
})
export class FtbComponent extends BaseQuestionDirective implements OnInit, OnChanges, AfterViewInit {
  segments: Segment[] = [];
  responseKeys: string[] = [];
  userAnswers: Record<string, string>    = {};
  correctAnswers: Record<string, string> = {};

  constructor(public utilService: UtilService) { super(); }

  ngOnInit(): void {
    this.responseKeys = Object.keys(this.question.responseDeclaration)
      .filter(k => k.includes('response'))
      .sort();

    this.responseKeys.forEach(rk => {
      this.userAnswers[rk]    = '';
      this.correctAnswers[rk] = String(
        this.question.responseDeclaration[rk].correctResponse.value ?? '',
      );
    });

    this.segments = this.parseBody(this.resolveBody());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['language'] && !changes['language'].firstChange) {
      this.segments = this.parseBody(this.resolveBody());
    }
    if (changes['replayed'] && this.replayed) {
      this.responseKeys.forEach(rk => (this.userAnswers[rk] = ''));
    }
    if (changes['tryAgain'] && this.tryAgain) {
      this.responseKeys.forEach(rk => (this.userAnswers[rk] = ''));
      this.optionSelected.emit({ cardinality: 'ftb', option: null, solutions: [] });
    }
  }

  ngAfterViewInit(): void {
    this.renderLatex();
    this.componentLoaded.emit({ identifier: this.question.identifier });
  }

  onAnswerChange(): void {
    const isEmpty = this.responseKeys.every(rk => !this.userAnswers[rk]?.trim());
    this.optionSelected.emit({
      cardinality: 'ftb',
      option: isEmpty ? null : { responses: { ...this.userAnswers } },
      solutions: [],
    });
  }

  private parseBody(body: string): Segment[] {
    const segments: Segment[] = [];
    // Match [[responseN]] or [[response_N]] placeholders
    const pattern = /\[\[(\w+)\]\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(body)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'html', content: body.substring(lastIndex, match.index) });
      }
      segments.push({ type: 'blank', key: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < body.length) {
      segments.push({ type: 'html', content: body.substring(lastIndex) });
    }

    // Fallback: if no [[responseN]] found in body, render body + separate inputs
    if (!segments.some(s => s.type === 'blank')) {
      return [{ type: 'html', content: body }];
    }

    return segments;
  }

}
