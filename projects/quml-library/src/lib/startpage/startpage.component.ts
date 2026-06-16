import { Component, Input, OnInit } from '@angular/core';
import { t } from '../i18n/translations';
import { readI18n } from '../i18n/i18nField';

@Component({
  standalone: false,
  selector: 'quml-startpage',
  templateUrl: './startpage.component.html',
  styleUrls: ['./startpage.component.scss', './sb-ckeditor-styles.scss']
})
export class StartpageComponent implements OnInit {

  @Input() instructions: any;
  @Input() totalNoOfQuestions: number;
  @Input() points: number;
  @Input() time: number;
  @Input() contentName: any;
  @Input() showTimer: boolean;
  @Input() language: string = 'en';
  minutes: number;
  seconds: string | number;

  get resolvedContentName(): string {
    return readI18n(this.contentName, this.language);
  }

  get resolvedInstructions(): string {
    return readI18n(this.instructions, this.language);
  }

  translate(key: string): string {
    return t(this.language, key);
  }

  ngOnInit() {
    this.minutes = Math.floor(this.time / 60);
    this.seconds = this.time - this.minutes * 60 <  10 ? `0${this.time - this.minutes * 60}`  :  this.time - this.minutes * 60;
  }

}
