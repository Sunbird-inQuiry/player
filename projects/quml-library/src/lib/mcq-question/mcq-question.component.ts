import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'quml-mcq-question',
  templateUrl: './mcq-question.component.html',
  styleUrls: ['./mcq-question.component.scss']
})
export class McqQuestionComponent {

  @Input() mcqQuestion: any;
  @Output() showPopup = new EventEmitter();
  @Input() layout: any;

  showQumlPopup() {
    this.showPopup.emit();
  }

}
