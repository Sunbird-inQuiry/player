import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OrderedComponent } from './ordered.component';
import { UtilService } from '../util-service';
import { SafeHtmlPipe } from '../pipes/safe-html/safe-html.pipe';

const seqQuestion = {
  identifier: 'do_seq_001',
  body: '<p>Arrange in order</p>',
  qType: 'SEQ',
  responseDeclaration: {
    response1: {
      cardinality: 'ordered',
      type: 'string',
      correctResponse: { value: ['A', 'B', 'C'] }
    }
  },
  interactions: {
    response1: {
      type: 'order',
      options: [
        { value: 'A', label: 'Step 1' },
        { value: 'B', label: 'Step 2' },
        { value: 'C', label: 'Step 3' }
      ]
    }
  },
  media: []
};

const reoQuestion = {
  identifier: 'do_reo_001',
  body: '<p>Rearrange the words</p>',
  qType: 'REO',
  responseDeclaration: {
    response1: {
      cardinality: 'ordered',
      type: 'string',
      correctResponse: { value: ['X', 'Y', 'Z'] }
    }
  },
  interactions: {
    response1: {
      type: 'order',
      options: [
        { value: 'X', label: 'Item X' },
        { value: 'Y', label: 'Item Y' },
        { value: 'Z', label: 'Item Z' }
      ]
    }
  },
  media: []
};

describe('OrderedComponent — SEQ', () => {
  let component: OrderedComponent;
  let fixture: ComponentFixture<OrderedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OrderedComponent, SafeHtmlPipe],
      imports: [DragDropModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [UtilService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderedComponent);
    component = fixture.componentInstance;
    component.question = seqQuestion;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('isSeq should be true for SEQ question', () => {
    expect(component.isSeq).toBe(true);
    expect(component.isReo).toBe(false);
  });

  it('should populate items for SEQ', () => {
    expect(component.items.length).toBe(3);
    expect(component.availableWords.length).toBe(0);
  });

  it('should emit componentLoaded on init', () => {
    spyOn(component.componentLoaded, 'emit');
    component.ngOnInit();
    expect(component.componentLoaded.emit).toHaveBeenCalledWith({ identifier: 'do_seq_001' });
  });

  it('should emit ordered answer on drop', () => {
    spyOn(component.optionSelected, 'emit');
    component.drop({ previousIndex: 0, currentIndex: 1 } as any);
    expect(component.optionSelected.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ cardinality: 'ordered', option: jasmine.objectContaining({ userOrder: jasmine.any(Array) }) })
    );
  });

  it('should reset items on replayed change', () => {
    component.replayed = true;
    component.ngOnChanges({ replayed: new SimpleChange(false, true, false) });
    expect(component.items.length).toBe(3);
  });

  it('should emit null option on tryAgain change', () => {
    spyOn(component.optionSelected, 'emit');
    component.tryAgain = true;
    component.ngOnChanges({ tryAgain: new SimpleChange(false, true, false) });
    expect(component.optionSelected.emit).toHaveBeenCalledWith({ cardinality: 'ordered', option: null, solutions: [] });
  });

  it('should return ltr by default', () => {
    expect(component.dir).toBe('ltr');
  });

  it('should return rtl for Arabic', () => {
    component.language = 'ar';
    expect(component.dir).toBe('rtl');
  });

  it('should translate MOVE_UP in Hindi', () => {
    component.language = 'hi';
    expect(component.translate('MOVE_UP')).toBe('ऊपर ले जाएं');
  });
});

describe('OrderedComponent — REO', () => {
  let component: OrderedComponent;
  let fixture: ComponentFixture<OrderedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OrderedComponent, SafeHtmlPipe],
      imports: [DragDropModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [UtilService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderedComponent);
    component = fixture.componentInstance;
    component.question = reoQuestion;
    fixture.detectChanges();
  });

  it('isReo should be true for REO question', () => {
    expect(component.isReo).toBe(true);
    expect(component.isSeq).toBe(false);
  });

  it('should populate availableWords for REO', () => {
    expect(component.availableWords.length).toBe(3);
    expect(component.selectedWords.length).toBe(0);
    expect(component.items.length).toBe(0);
  });

  it('should move word from available to selected on addWord', () => {
    spyOn(component.optionSelected, 'emit');
    const word = component.availableWords[0];
    component.addWord(word);
    expect(component.selectedWords.length).toBe(1);
    expect(component.availableWords.length).toBe(2);
    expect(component.optionSelected.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ cardinality: 'ordered', option: jasmine.objectContaining({ userOrder: [word.value] }) })
    );
  });

  it('should move word back to available on removeWord', () => {
    const word = component.availableWords[0];
    component.addWord(word);
    component.removeWord(word);
    expect(component.selectedWords.length).toBe(0);
    expect(component.availableWords.length).toBe(3);
  });

  it('should clear all selected words on clearAll', () => {
    spyOn(component.optionSelected, 'emit');
    component.addWord(component.availableWords[0]);
    component.clearAll();
    expect(component.selectedWords.length).toBe(0);
    expect(component.availableWords.length).toBe(3);
    expect(component.optionSelected.emit).toHaveBeenCalledWith({ cardinality: 'ordered', option: null, solutions: [] });
  });
});
