import { Component, EventEmitter, Input, Output } from '@angular/core';
import { t } from '../i18n/translations';

export interface IIndicator {
  iconText: string;
  title: string;
  class: string;
}

@Component({
  standalone: false,
  selector: 'quml-progress-indicators',
  templateUrl: './progress-indicators.component.html',
  styleUrls: ['./progress-indicators.component.scss']
})
export class ProgressIndicatorsComponent {

  @Input() language: string = 'en';
  @Output() close = new EventEmitter<boolean>();

  get indicators(): IIndicator[] {
    return [
      { iconText: '1', title: t(this.language, 'IND_CORRECT'),      class: 'correct' },
      { iconText: '1', title: t(this.language, 'IND_INCORRECT'),     class: 'incorrect' },
      { iconText: '1', title: t(this.language, 'IND_ATTEMPTED'),     class: 'attempted' },
      { iconText: '1', title: t(this.language, 'IND_NOT_VIEWED'),    class: '' },
      { iconText: '1', title: t(this.language, 'IND_SKIPPED'),       class: 'skipped' },
      { iconText: '1', title: t(this.language, 'IND_CURRENT'),       class: 'current' },
      { iconText: 'i', title: t(this.language, 'IND_INFO_PAGE'),     class: '' },
      { iconText: '<img src="./assets/flag_active.svg" alt="Flag logo: Show scoreboard">',
        title: t(this.language, 'IND_SUMMARY_PAGE'), class: '' },
    ];
  }

  translate(key: string): string {
    return t(this.language, key);
  }
}
