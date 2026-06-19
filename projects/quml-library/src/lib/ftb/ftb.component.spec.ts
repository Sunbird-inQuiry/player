import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FtbComponent } from './ftb.component';
import { UtilService } from '../util-service';
import { SafeHtmlPipe } from '../pipes/safe-html/safe-html.pipe';

const question = {
  identifier: 'do_ftb_001',
  body: '<p>Capital of France is [[response1]]</p>',
  responseDeclaration: {
    response1: {
      cardinality: 'single',
      type: 'string',
      correctResponse: { value: 'Paris' }
    }
  },
  interactions: { response1: { type: 'text' } },
  media: []
};

const multiBlankQuestion = {
  identifier: 'do_ftb_002',
  body: '<p>[[response1]] is the capital of [[response2]]</p>',
  responseDeclaration: {
    response1: { cardinality: 'single', type: 'string', correctResponse: { value: 'Paris' } },
    response2: { cardinality: 'single', type: 'string', correctResponse: { value: 'France' } }
  },
  interactions: { response1: { type: 'text' }, response2: { type: 'text' } },
  media: []
};

const noTokenQuestion = {
  identifier: 'do_ftb_003',
  body: '<p>What is the capital of France?</p>',
  responseDeclaration: {
    response1: { cardinality: 'single', type: 'string', correctResponse: { value: 'Paris' } }
  },
  interactions: { response1: { type: 'text' } },
  media: []
};

describe('FtbComponent', () => {
  let component: FtbComponent;
  let fixture: ComponentFixture<FtbComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FtbComponent, SafeHtmlPipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [UtilService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FtbComponent);
    component = fixture.componentInstance;
    component.question = question;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should parse body into html and blank segments', () => {
    fixture.detectChanges();
    expect(component.segments.length).toBe(3);
    expect(component.segments[0].type).toBe('html');
    expect(component.segments[1].type).toBe('blank');
    expect(component.segments[1].key).toBe('response1');
    expect(component.segments[2].type).toBe('html');
  });

  it('should fall back to single html segment when no [[response]] tokens in body', () => {
    component.question = noTokenQuestion;
    fixture.detectChanges();
    expect(component.segments.length).toBe(1);
    expect(component.segments[0].type).toBe('html');
  });

  it('should initialise responseKeys and userAnswers for each blank', () => {
    fixture.detectChanges();
    expect(component.responseKeys).toEqual(['response1']);
    expect(component.userAnswers['response1']).toBe('');
  });

  it('should initialise correctAnswers from responseDeclaration', () => {
    fixture.detectChanges();
    expect(component.correctAnswers['response1']).toBe('Paris');
  });

  it('should handle multiple blanks', () => {
    component.question = multiBlankQuestion;
    fixture.detectChanges();
    expect(component.responseKeys).toEqual(['response1', 'response2']);
    expect(component.segments.filter(s => s.type === 'blank').length).toBe(2);
  });

  it('should emit componentLoaded on init', () => {
    spyOn(component.componentLoaded, 'emit');
    fixture.detectChanges();
    expect(component.componentLoaded.emit).toHaveBeenCalledWith({ identifier: 'do_ftb_001' });
  });

  it('should emit optionSelected with responses when answer changes', () => {
    fixture.detectChanges();
    spyOn(component.optionSelected, 'emit');
    component.userAnswers['response1'] = 'Paris';
    component.onAnswerChange();
    expect(component.optionSelected.emit).toHaveBeenCalledWith({
      cardinality: 'ftb',
      option: { responses: { response1: 'Paris' } },
      solutions: []
    });
  });

  it('should emit null option when all answers are empty', () => {
    fixture.detectChanges();
    spyOn(component.optionSelected, 'emit');
    component.userAnswers['response1'] = '';
    component.onAnswerChange();
    expect(component.optionSelected.emit).toHaveBeenCalledWith({
      cardinality: 'ftb',
      option: null,
      solutions: []
    });
  });

  it('should clear answers on replayed change', () => {
    fixture.detectChanges();
    component.userAnswers['response1'] = 'Berlin';
    component.replayed = true;
    component.ngOnChanges({ replayed: new SimpleChange(false, true, false) });
    expect(component.userAnswers['response1']).toBe('');
  });

  it('should clear answers and emit null on tryAgain change', () => {
    fixture.detectChanges();
    spyOn(component.optionSelected, 'emit');
    component.userAnswers['response1'] = 'Berlin';
    component.tryAgain = true;
    component.ngOnChanges({ tryAgain: new SimpleChange(false, true, false) });
    expect(component.userAnswers['response1']).toBe('');
    expect(component.optionSelected.emit).toHaveBeenCalledWith({ cardinality: 'ftb', option: null, solutions: [] });
  });

  it('should return ltr direction by default', () => {
    fixture.detectChanges();
    expect(component.dir).toBe('ltr');
  });

  it('should return rtl direction for Arabic', () => {
    fixture.detectChanges();
    component.language = 'ar';
    expect(component.dir).toBe('rtl');
  });

  it('should translate BLANK key with index', () => {
    fixture.detectChanges();
    component.language = 'en';
    expect(component.translate('BLANK', 1)).toBe('Blank 1');
  });

  it('should fall back to English when language is unknown', () => {
    fixture.detectChanges();
    component.language = 'xx';
    expect(component.translate('BLANK', 1)).toBe('Blank 1');
  });
});
