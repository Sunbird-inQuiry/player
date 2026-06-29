import { Component, OnInit, OnChanges, SimpleChanges, Input, SecurityContext, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilService } from '../util-service';
import * as _ from 'lodash-es';
import { readI18n, getBodyField } from '../i18n/i18nField';

@Component({
  standalone: false,
  selector: 'quml-boolean',
  templateUrl: './boolean.component.html',
  styleUrls: ['./boolean.component.scss', '../quml-library.component.scss'],
})
export class BooleanComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() shuffleOptions?: boolean;
  @Input() savedResponse?: any;
  @Input() question?: any;
  @Input() layout?: string;
  @Input() language: string = 'en';
  @Input() replayed: boolean;
  @Input() tryAgain?: boolean;
  @Output() componentLoaded = new EventEmitter<any>();
  @Output() answerChanged = new EventEmitter<any>();
  @Output() optionSelected = new EventEmitter<any>();

  options: any;
  mcqOptions: any[] = [];
  solutions: Array<[]>;
  cardinality: string = 'single';
  numberOfCorrectOptions: number = 1;

  get mcqQuestion(): string {
    return this.domSanitizer.sanitize(SecurityContext.HTML,
      this.domSanitizer.bypassSecurityTrustHtml(readI18n(getBodyField(this.question), this.language))) || '';
  }

  constructor(
    public domSanitizer: DomSanitizer,
    public utilService: UtilService
  ) { }

  ngOnInit() {
    this.numberOfCorrectOptions = _.castArray(this.question.responseDeclaration.response1.correctResponse.value).length;
    if (this.question?.solutions) {
      this.solutions = this.question.solutions;
    }
    let key: any = this.utilService.getKeyValue(Object.keys(this.question.responseDeclaration));
    this.cardinality = this.question.responseDeclaration[key]['cardinality'];

    this.options = this.question.interactions[key].options;
    this.initOptions();
    this.applySavedResponse();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['language'] && !changes['language'].firstChange) {
      this.mcqOptions = [];
      this.initOptions();
      this.applySavedResponse();
    }
    if (changes['replayed'] && this.replayed) {
      this.mcqOptions.forEach(mo => mo.selected = false);
    }
    if (changes['tryAgain'] && this.tryAgain) {
      this.mcqOptions.forEach(mo => mo.selected = false);
    }
  }

  applySavedResponse(): void {
    const option = this.savedResponse?.option;
    if (_.isEmpty(option)) { return; }
    const selectedValues = _.castArray(option).map((o: any) => String(o?.value));
    this.mcqOptions.forEach(mo => {
      mo.selected = selectedValues.includes(String(mo.value));
    });
  }

  ngAfterViewInit() {
    // Component loaded hook
  }

  initOptions() {
    for (let j = 0; j < this.options.length; j++) {
      const option = this.options[j];
      const resolvedLabel = readI18n(option.label, this.language);
      const sanitizedLabel = this.domSanitizer.sanitize(
        SecurityContext.HTML, this.domSanitizer.bypassSecurityTrustHtml(resolvedLabel)
      ) || '';
      this.mcqOptions.push({
        label: sanitizedLabel,
        selected: false,
        value: option.value,
        url: option.url,
      });
    }
  }

  onOptionSelect(event: MouseEvent | KeyboardEvent, mcqOption, index: number) {
    if (this.tryAgain) { return; }
    this.mcqOptions.forEach((mo, idx) => {
      mo.selected = (idx === index);
    });
    this.optionSelected.emit({
      name: 'optionSelect',
      option: mcqOption,
      cardinality: 'single',
      solutions: this.solutions
    });
  }

  onEnter(event: KeyboardEvent, mcqOption, index: number) {
    if (event.key === 'Enter') {
      event.stopPropagation();
      this.onOptionSelect(event, mcqOption, index);
    }
  }
}
