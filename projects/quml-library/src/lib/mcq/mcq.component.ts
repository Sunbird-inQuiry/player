import { Component, OnInit, OnChanges, SimpleChanges, Input, SecurityContext, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { katex } from 'katex';
import { UtilService } from '../util-service';
import * as _ from 'lodash-es';
import { readI18n, getBodyField } from '../i18n/i18nField';

declare const katex: any;

@Component({
  standalone: false,
  selector: 'quml-mcq',
  templateUrl: './mcq.component.html',
  styleUrls: ['./mcq.component.scss', '../quml-library.component.scss'],

})
export class McqComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() shuffleOptions?: boolean;
  @Input() question?: any;
  @Input() layout?: string;
  @Input() language: string = 'en';
  @Input() replayed: boolean;
  @Input() tryAgain?: boolean;
  @Output() componentLoaded = new EventEmitter<any>();
  @Output() answerChanged = new EventEmitter<any>();
  @Output() optionSelected = new EventEmitter<number>();

  options: any;
  mcqOptions: any[] = [];
  selectedOptionTarget: any;
  showQumlPopup = false;
  solutions: Array<[]>;
  cardinality: string;
  numberOfCorrectOptions: number;

  get mcqQuestion(): string {
    return this.domSanitizer.sanitize(SecurityContext.HTML,
      this.domSanitizer.bypassSecurityTrustHtml(readI18n(getBodyField(this.question), this.language))) || '';
  }
  

  constructor(
    public domSanitizer: DomSanitizer,
    public utilService: UtilService) {
  }

  ngOnInit() {
    this.numberOfCorrectOptions = _.castArray(this.question.responseDeclaration.response1.correctResponse.value).length;
    if (this.question?.solutions) {
      this.solutions = this.question.solutions;
    }
    let key: any = this.utilService.getKeyValue(Object.keys(this.question.responseDeclaration));
    this.cardinality = this.question.responseDeclaration[key]['cardinality'];

    switch(this.question.templateId) {
      case "mcq-vertical": 
        this.layout = 'DEFAULT';
        break;
      case "mcq-horizontal": 
        this.layout = 'IMAGEGRID';
        break;
      case "mcq-vertical-split":
        this.layout = 'IMAGEQAGRID';
        break;
      case "mcq-grid-split":
        this.layout = 'MULTIIMAGEGRID';
        break;
      default:
        this.layout = 'DEFAULT';
    }

    this.renderLatex();
    this.options = this.question.interactions[key].options;
    this.initOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['language'] && !changes['language'].firstChange) {
      this.mcqOptions = [];
      this.initOptions();
    }
  }

  ngAfterViewInit() {
    const el = document.getElementsByClassName('mcq-options');
    if (el != null && el.length > 0) {
      el[0].remove();
    }
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

  renderLatex() {
    setTimeout(() => {
      this.replaceLatexText();
    }, 100);
  }

  replaceLatexText() {
    const questionElement = document.getElementById(this.question?.identifier ?? this.question?.id);
    if (questionElement != null) {
      const mathTextDivs = questionElement.getElementsByClassName('mathText');
      for (let i = 0; i < mathTextDivs.length; i++) {
        const mathExp = mathTextDivs[i];
        const textToRender = mathExp.innerHTML;
        katex.render(textToRender, mathExp, { displayMode: false, output: 'html', throwOnError: true });
      }
    }
  }

  getSelectedOptionAndResult(optionObj) {
    this.optionSelected.emit(optionObj);
  }

  showPopup() {
    this.showQumlPopup = true;
  }

  closePopUp() {
    this.showQumlPopup = false;
  }
}
