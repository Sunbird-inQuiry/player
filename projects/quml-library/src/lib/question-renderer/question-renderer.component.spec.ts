import { NO_ERRORS_SCHEMA, SimpleChange, EventEmitter, Component, Input, Output } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionRendererComponent } from './question-renderer.component';
import { QUESTION_TYPE_REGISTRY } from '../registry/question-type.interface';

// Minimal stub that satisfies IQuestionPlayer
@Component({ standalone: false, selector: 'stub-player', template: '' })
class StubPlayerComponent {
  @Input() question: any;
  @Input() replayed: boolean;
  @Input() tryAgain: boolean;
  @Input() baseUrl: string;
  @Input() language: string = 'en';
  @Input() shuffleOptions: boolean;
  @Input() savedResponse: any;
  @Output() componentLoaded = new EventEmitter<any>();
  @Output() optionSelected  = new EventEmitter<any>();
  @Output() showAnswerClicked = new EventEmitter<any>();
  appliedCount = 0;
  applySavedResponse(): void { this.appliedCount++; }
}

const mcqQuestion = {
  identifier: 'do_mcq_001',
  primaryCategory: 'Multiple Choice Question',
  body: '<p>Test question</p>',
  media: []
};

const unknownQuestion = {
  identifier: 'do_unknown_001',
  primaryCategory: 'Unknown Type',
  body: '<p>Unknown</p>',
  media: []
};

const registry = [
  { primaryCategory: 'multiple choice question', component: StubPlayerComponent }
];

describe('QuestionRendererComponent', () => {
  let component: QuestionRendererComponent;
  let fixture: ComponentFixture<QuestionRendererComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionRendererComponent, StubPlayerComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: QUESTION_TYPE_REGISTRY, useValue: registry }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionRendererComponent);
    component = fixture.componentInstance;
    component.question = mcqQuestion;
    component.language = 'en';
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should mount the matching component from registry on init', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('stub-player')).toBeTruthy();
  });

  it('should not mount anything for unknown primaryCategory', () => {
    component.question = unknownQuestion;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('stub-player')).toBeFalsy();
  });

  it('should propagate a savedResponse change and re-apply it on the mounted component', () => {
    fixture.detectChanges();
    const inst = (component as any).componentRef.instance;
    const before = inst.appliedCount;
    const saved = { option: { value: 1 } };
    component.savedResponse = saved;
    component.ngOnChanges({ savedResponse: new SimpleChange(undefined, saved, false) });
    expect(inst.savedResponse).toBe(saved);
    expect(inst.appliedCount).toBe(before + 1);
  });

  it('should forward language change to the mounted component', () => {
    fixture.detectChanges();
    component.language = 'hi';
    component.ngOnChanges({ language: new SimpleChange('en', 'hi', false) });
    expect((component as any).componentRef.instance.language).toBe('hi');
  });

  it('should forward replayed change to the mounted component', () => {
    fixture.detectChanges();
    component.replayed = true;
    component.ngOnChanges({ replayed: new SimpleChange(false, true, false) });
    expect((component as any).componentRef.instance.replayed).toBe(true);
  });

  it('should forward tryAgain change to the mounted component', () => {
    fixture.detectChanges();
    component.tryAgain = true;
    component.ngOnChanges({ tryAgain: new SimpleChange(false, true, false) });
    expect((component as any).componentRef.instance.tryAgain).toBe(true);
  });

  it('should bubble optionSelected event from child to output', () => {
    fixture.detectChanges();
    spyOn(component.optionSelected, 'emit');
    const child = (component as any).componentRef.instance as StubPlayerComponent;
    child.optionSelected.emit({ cardinality: 'single', option: 0 });
    expect(component.optionSelected.emit).toHaveBeenCalledWith({ cardinality: 'single', option: 0 });
  });

  it('should bubble showAnswerClicked event from child to output', () => {
    fixture.detectChanges();
    spyOn(component.showAnswerClicked, 'emit');
    const child = (component as any).componentRef.instance as StubPlayerComponent;
    child.showAnswerClicked.emit({ showAnswer: true });
    expect(component.showAnswerClicked.emit).toHaveBeenCalledWith({ showAnswer: true });
  });

  it('should not crash ngOnChanges when no component is mounted', () => {
    component.question = unknownQuestion;
    fixture.detectChanges();
    expect(() => {
      component.ngOnChanges({ language: new SimpleChange('en', 'hi', false) });
    }).not.toThrow();
  });

  it('should unsubscribe all subscriptions on destroy', () => {
    fixture.detectChanges();
    const subs = (component as any).subs;
    spyOn(subs[0], 'unsubscribe');
    component.ngOnDestroy();
    expect(subs[0].unsubscribe).toHaveBeenCalled();
  });
});
