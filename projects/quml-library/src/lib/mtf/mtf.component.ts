import {
  Component, OnInit, OnChanges, SimpleChanges, AfterViewInit,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import * as _ from 'lodash-es';
import { UtilService } from '../util-service';
import { BaseQuestionDirective, SanitizedOption } from '../base-question.directive';

type MtfOption = SanitizedOption;

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
  solutions: any = [];
  resolvedBody: string = '';

  constructor(public utilService: UtilService) { super(); }

  ngOnInit(): void {
    this.resolvedBody = this.resolveBody();
    this.key = this.utilService.getKeyValue(Object.keys(this.question.responseDeclaration));
    const opts = this.question.interactions[this.key].options;
    this.left  = this.sanitizeOptions(opts.left);
    // Shuffle right items so user has to actually match them
    this.right = _.shuffle(this.sanitizeOptions(opts.right));
    this.applySavedResponse();
    this.correctValue = this.question.responseDeclaration[this.key].correctResponse.value || {};
    // Raw solutions (same shape MCQ emits) so the shared solution panel can
    // render them via the keyvalue pipe when "Show Answer" is clicked.
    this.solutions    = this.question.solutions || [];
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

  /**
   * Reorders the right column to the learner's previously saved pairing on
   * revisit. userResponse maps leftValue → rightValue; pairing is left[i] ↔
   * right[i] by position, so the saved right-value sequence is the right values
   * in left order — reorderByValues (on the base) then satisfies that mapping.
   */
  override applySavedResponse(): void {
    const userResponse = this.savedResponse?.option?.userResponse;
    if (_.isEmpty(userResponse)) { return; }
    const valueOrder = this.left.map(l => String(userResponse[l.value]));
    this.right = this.reorderByValues(this.right, valueOrder);
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
      solutions: this.solutions,
    });
  }

}
