import { NO_ERRORS_SCHEMA } from '@angular/core';
import { waitForAsync,  ComponentFixture, TestBed } from '@angular/core/testing';
import { SafeHtmlPipe } from '../pipes/safe-html/safe-html.pipe';

import { StartpageComponent } from './startpage.component';

describe('StartpageComponent', () => {
  let component: StartpageComponent;
  let fixture: ComponentFixture<StartpageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StartpageComponent, SafeHtmlPipe ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartpageComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#ngOnInit() should prepend 0 to #seconds when number is less than 10', () => {
    component.time = 125;
    component.ngOnInit();
    expect(component.seconds).toEqual('05');
  });

  it('#ngOnInit() should not prepend 0 to #seconds when number is greater than 10', () => {
    component.time = 130;
    component.ngOnInit();
    expect(component.seconds).toEqual(10);
  });

});
