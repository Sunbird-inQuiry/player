import { ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { waitForAsync,  ComponentFixture, TestBed } from '@angular/core/testing';
import { SafeHtmlPipe } from '../pipes/safe-html/safe-html.pipe';
import { McqSolutionsComponent } from './mcq-solutions.component';
import { UtilService } from '../util-service';

describe('SolutionsComponent', () => {
  let component: McqSolutionsComponent;
  let fixture: ComponentFixture<McqSolutionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [McqSolutionsComponent, SafeHtmlPipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [UtilService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(McqSolutionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the close event', () => {
    component.solutionVideoPlayer = new ElementRef({ pause() { } });
    spyOn(component.solutionVideoPlayer.nativeElement, 'pause');
    spyOn(component.close, 'emit');
    component.closeSolution();
    expect(component.solutionVideoPlayer.nativeElement.pause).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalledWith({ close: true });
  });

  it('#ngAfterViewInit() should call #updateSourceOfVideoElement method', () => {
    const utilService = TestBed.inject(UtilService);
    spyOn(utilService, 'updateSourceOfVideoElement').and.callThrough();
    component.baseUrl = 'https://dev.org';
    component.media =[];
    component.identifier = 'do_123';
    component.ngAfterViewInit();
    expect(utilService.updateSourceOfVideoElement).toHaveBeenCalled();
  });

});
