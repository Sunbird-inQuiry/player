import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MtfComponent } from './mtf.component';
import { UtilService } from '../util-service';
import { SafeHtmlPipe } from '../pipes/safe-html/safe-html.pipe';

const question = {
  identifier: 'do_mtf_001',
  body: '<p>Match the capitals</p>',
  qType: 'MTF',
  responseDeclaration: {
    response1: {
      cardinality: 'single',
      type: 'map',
      correctResponse: { value: { A: '1', B: '2' } }
    }
  },
  interactions: {
    response1: {
      type: 'match',
      options: {
        left:  [{ value: 'A', label: 'France' }, { value: 'B', label: 'Germany' }],
        right: [{ value: '1', label: 'Paris'  }, { value: '2', label: 'Berlin'  }]
      }
    }
  },
  solutions: [],
  media: []
};

describe('MtfComponent', () => {
  let component: MtfComponent;
  let fixture: ComponentFixture<MtfComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MtfComponent, SafeHtmlPipe],
      imports: [DragDropModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [UtilService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MtfComponent);
    component = fixture.componentInstance;
    component.question = question;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialise left and right option arrays', () => {
    fixture.detectChanges();
    expect(component.left.length).toBe(2);
    expect(component.right.length).toBe(2);
  });

  it('should set left options with correct values', () => {
    fixture.detectChanges();
    const values = component.left.map(l => l.value);
    expect(values).toContain('A');
    expect(values).toContain('B');
  });

  it('should set correctValue from responseDeclaration', () => {
    fixture.detectChanges();
    expect(component.correctValue).toEqual({ A: '1', B: '2' });
  });

  it('should emit componentLoaded on init', () => {
    spyOn(component.componentLoaded, 'emit');
    fixture.detectChanges();
    expect(component.componentLoaded.emit).toHaveBeenCalledWith({ identifier: 'do_mtf_001' });
  });

  it('should emit optionSelected with userResponse on drop', () => {
    fixture.detectChanges();
    spyOn(component.optionSelected, 'emit');
    // Simulate a drop that doesn't reorder
    component.drop({ previousIndex: 0, currentIndex: 0 } as any);
    expect(component.optionSelected.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ cardinality: 'map' })
    );
  });

  it('should shuffle right options on replayed change', () => {
    fixture.detectChanges();
    spyOn(component.optionSelected, 'emit');
    component.replayed = true;
    component.ngOnChanges({ replayed: new SimpleChange(false, true, false) });
    expect(component.optionSelected.emit).toHaveBeenCalled();
  });

  it('should emit null option on tryAgain change', () => {
    fixture.detectChanges();
    spyOn(component.optionSelected, 'emit');
    component.tryAgain = true;
    component.ngOnChanges({ tryAgain: new SimpleChange(false, true, false) });
    expect(component.optionSelected.emit).toHaveBeenCalledWith({
      cardinality: 'map',
      option: null,
      solutions: []
    });
  });

  it('should return ltr direction by default', () => {
    fixture.detectChanges();
    expect(component.dir).toBe('ltr');
  });

  it('should return rtl for Arabic', () => {
    fixture.detectChanges();
    component.language = 'ar';
    expect(component.dir).toBe('rtl');
  });

  it('should translate COL_QUESTION in Hindi', () => {
    fixture.detectChanges();
    component.language = 'hi';
    expect(component.translate('COL_QUESTION')).toBe('प्रश्न');
  });

  it('should translate COL_ANSWER in English', () => {
    fixture.detectChanges();
    component.language = 'en';
    expect(component.translate('COL_ANSWER')).toBe('Answer');
  });

  it('should resolve object label by en key', () => {
    fixture.detectChanges();
    const q = {
      ...question,
      interactions: {
        response1: {
          type: 'match',
          options: {
            left:  [{ value: 'A', label: { en: 'France', hi: 'फ्रांस' } }],
            right: [{ value: '1', label: 'Paris' }]
          }
        }
      }
    };
    component.question = q;
    component.ngOnInit();
    expect(component.left[0].labelText).toBe('France');
  });
});
