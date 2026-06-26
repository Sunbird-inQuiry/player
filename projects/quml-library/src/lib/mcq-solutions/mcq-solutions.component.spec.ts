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

  it('should resolve a multilingual question body to the current language', () => {
    component.question = { en: '<p>EN</p>', ar: '<p>AR</p>' };
    component.language = 'ar';
    expect(component.resolvedQuestion).toBe('<p>AR</p>');
  });

  it('should return a plain string question untouched', () => {
    component.question = '<p>plain</p>';
    expect(component.resolvedQuestion).toBe('<p>plain</p>');
  });

  it('should resolve multilingual option labels', () => {
    component.options = [{ label: { en: 'A', ar: 'ا' }, value: 0 }];
    component.language = 'ar';
    expect(component.resolvedOptions[0].label).toBe('ا');
  });

  it('should return [] options when none provided', () => {
    component.options = undefined;
    expect(component.resolvedOptions).toEqual([]);
  });

  it('should resolve solutions from a {id: value} map (multilingual)', () => {
    component.solutions = { abc: { en: '<p>sol-en</p>', ar: '<p>sol-ar</p>' } };
    component.language = 'en';
    expect(component.resolvedSolutions).toEqual(['<p>sol-en</p>']);
  });

  it('should resolve solutions whose values are plain HTML strings', () => {
    component.solutions = { abc: '<p>plain-sol</p>' };
    expect(component.resolvedSolutions).toEqual(['<p>plain-sol</p>']);
  });

  it('should drop empty solution values', () => {
    component.solutions = { abc: '' };
    expect(component.resolvedSolutions).toEqual([]);
  });

  it('should return [] solutions when none provided', () => {
    component.solutions = undefined;
    expect(component.resolvedSolutions).toEqual([]);
  });

  it('should rewrite img src for data-asset-variable images using media baseUrl', () => {
    component.media = [{ id: 'do_1', src: '/assets/x.jpg', baseUrl: 'https://cdn.test' }];
    component.question = '<figure><img src="/assets/x.jpg" data-asset-variable="do_1"></figure>';
    expect(component.resolvedQuestion).toContain('src="https://cdn.test/assets/x.jpg"');
  });

  it('should rewrite video <source> src and poster in a solution', () => {
    component.media = [{ id: 'do_v', src: '/assets/v.webm', baseUrl: 'https://cdn.test' }];
    component.solutions = { s1: '<video data-asset-variable="do_v" poster="/assets/p.jpg"><source src="/assets/v.webm"></video>' };
    const out = component.resolvedSolutions[0];
    expect(out).toContain('src="https://cdn.test/assets/v.webm"');
    expect(out).toContain('poster="https://cdn.test/assets/p.jpg"');
  });

  it('should rewrite audio <source> src in a solution', () => {
    component.media = [{ id: 'do_a', src: '/assets/a.mp3', baseUrl: 'https://cdn.test' }];
    component.solutions = { s1: '<audio data-asset-variable="do_a"><source src="/assets/a.mp3"></audio>' };
    expect(component.resolvedSolutions[0]).toContain('src="https://cdn.test/assets/a.mp3"');
  });

  it('should leave an already-absolute img untouched when no media match', () => {
    component.media = [{ id: 'do_other', src: '/a.jpg', baseUrl: 'https://cdn.test' }];
    component.question = '<img src="https://abs.test/keep.jpg" data-asset-variable="do_1">';
    expect(component.resolvedQuestion).toContain('src="https://abs.test/keep.jpg"');
  });

  it('should resolve img src inside option labels and solutions', () => {
    component.media = [{ id: 'do_1', src: '/o.jpg', baseUrl: 'https://cdn.test' }];
    component.options = [{ label: '<img src="/o.jpg" data-asset-variable="do_1">', value: 0 }];
    component.solutions = { s1: '<img src="/o.jpg" data-asset-variable="do_1">' };
    expect(component.resolvedOptions[0].label).toContain('src="https://cdn.test/o.jpg"');
    expect(component.resolvedSolutions[0]).toContain('src="https://cdn.test/o.jpg"');
  });

  it('should absolutise a relative img with no media match using the media host', () => {
    // Real case: a solution references an asset missing from `media`. It must
    // still resolve against the content host, not fall back to the local proxy.
    component.media = [{ id: 'do_other', src: '/x.jpg', baseUrl: 'https://cdn.test' }];
    component.solutions = { s1: '<img src="/assets/missing.jpg" data-asset-variable="do_1">' };
    expect(component.resolvedSolutions[0]).toContain('src="https://cdn.test/assets/missing.jpg"');
  });

  it('should absolutise relative img using baseUrl when media has no host', () => {
    component.media = [];
    component.baseUrl = 'https://portal.test';
    component.question = '<img src="/rel.jpg" data-asset-variable="do_1">';
    expect(component.resolvedQuestion).toContain('src="https://portal.test/rel.jpg"');
  });

  it('should return html untouched when there is no media and no baseUrl', () => {
    component.media = [];
    component.baseUrl = '';
    component.question = '<img src="/rel.jpg" data-asset-variable="do_1">';
    expect(component.resolvedQuestion).toBe('<img src="/rel.jpg" data-asset-variable="do_1">');
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
