import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { BooleanComponent } from './boolean.component';
import { UtilService } from '../util-service';

describe('BooleanComponent', () => {
  let component: BooleanComponent;
  let fixture: ComponentFixture<BooleanComponent>;
  const question = {
    "responseDeclaration": {
      "response1": {
        "cardinality": "single",
        "type": "integer",
        "correctResponse": {
          "value": 0
        },
        "mapping": []
      }
    },
    "body": "<div class='question-body'><div class='mcq-title'><p>Is the earth round?</p></div></div>",
    "interactions": {
      "response1": {
        "type": "choice",
        "options": [
          { "label": "<p>True</p>", "value": 0 },
          { "label": "<p>False</p>", "value": 1 }
        ]
      }
    },
    "templateId": "mcq-boolean",
    "primaryCategory": "Boolean Question",
    "qType": "BOOL"
  };

  const mockUtilService = {
    getKeyValue: (keys) => keys[0]
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BooleanComponent ],
      providers: [
        { provide: UtilService, useValue: mockUtilService },
        {
          provide: DomSanitizer,
          useValue: {
            sanitize: (ctx, val) => val,
            bypassSecurityTrustHtml: (val) => val
          }
        }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanComponent);
    component = fixture.componentInstance;
    component.question = question;
    component.language = 'en';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize options on ngOnInit', () => {
    component.ngOnInit();
    expect(component.mcqOptions.length).toBe(2);
    expect(component.mcqOptions[0].value).toBe(0);
    expect(component.mcqOptions[1].value).toBe(1);
  });

  it('should apply saved response', () => {
    component.savedResponse = { option: { value: 1 } };
    component.ngOnInit();
    expect(component.mcqOptions[0].selected).toBe(false);
    expect(component.mcqOptions[1].selected).toBe(true);
  });

  it('should emit optionSelected on onOptionSelect', () => {
    spyOn(component.optionSelected, 'emit');
    component.ngOnInit();
    const event = new MouseEvent('click');
    component.onOptionSelect(event, component.mcqOptions[1], 1);
    expect(component.mcqOptions[0].selected).toBe(false);
    expect(component.mcqOptions[1].selected).toBe(true);
    expect(component.optionSelected.emit).toHaveBeenCalledWith({
      name: 'optionSelect',
      option: component.mcqOptions[1],
      cardinality: 'single',
      solutions: component.solutions
    });
  });

  it('should handle OnChanges language update', () => {
    component.ngOnInit();
    spyOn(component, 'initOptions').and.callThrough();
    spyOn(component, 'applySavedResponse');
    
    const changes = {
      language: new SimpleChange('en', 'hi', false)
    };
    component.ngOnChanges(changes);
    
    expect(component.initOptions).toHaveBeenCalled();
    expect(component.applySavedResponse).toHaveBeenCalled();
  });
});
