import { TestBed } from '@angular/core/testing';

import { UtilService } from './util-service';
import { options, responseDeclaration, selectedOptions, questions, outcomeDeclaration } from './util-service.spec.data';

describe('UtilService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UtilService = TestBed.inject(UtilService);
    expect(service).toBeTruthy();
  });

  it('should return unique id', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const id = service.uniqueId(32);
    expect(id).toBeDefined();
  });

  it('should return time spent text', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const time = service.getTimeSpentText(10);
    expect(time).toBeDefined();
  });

  it('#getTimeSpentText Should prepand zero to #seconds when number is less than 10 ', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const time = service.getTimeSpentText(new Date().getTime());
    expect(time).toEqual('0:00')
  });

  it('should return dynamic key', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const keys = ['responseDec', 'response1'];
    spyOn(service, 'getKeyValue').and.returnValue('response1');
    const key = service.getKeyValue(keys);
    expect(key).toEqual('response1');
  });

  it('should return question type', () => {
    const service: UtilService = TestBed.inject(UtilService);
    let qType = service.getQuestionType(questions, 0);
    expect(qType).toBe('MCQ');
  })

  it('should return question type #SA', () => {
    const service: UtilService = TestBed.inject(UtilService);
    let qType = service.getQuestionType(questions, 1);
    expect(qType).toBe('MCQ');
  })


  it('should check if the array contains the progress classes', () => {
    const service: UtilService = TestBed.inject(UtilService);
    let qType = service.canGo('correct');
    expect(qType).toBe(true);
  });

  it('should scroll the page from parent element to child', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const parent = document.createElement('div');
    service.scrollParentToChild(parent, document.createElement('div'));
    expect(parent.scrollTop).toBeDefined();
  });

  it('should scroll the page from parent element to child for mobile portrait', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const parent = document.createElement('div');
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as any);
    service.scrollParentToChild(parent, document.createElement('div'));
    expect(parent.scrollLeft).toBeDefined();
  });

  it('should sum objects by key', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const sum = service.sumObjectsByKey({ a: 1, b: 2 }, { a: 3, b: 4 });
    expect(sum).toEqual({ a: 4, b: 6 });
  });
  
  it('should call getMultiselectScore when shuffle is false', () => {
    const service: UtilService = TestBed.inject(UtilService);
    spyOn(service, 'getMultiselectScore').and.callThrough();
    const score = service.getMultiselectScore(options, responseDeclaration, false, outcomeDeclaration);
    expect(score).toEqual(2);
  })

  it('#getMultiselectScore() should return score 2 when shuffle is false and both anwsers corrected. ', () => {
    const service: UtilService = TestBed.inject(UtilService);
    spyOn(service, 'getMultiselectScore').and.callThrough();
    const selectedOptions = [{
      label: "<p>2 September 1929</p>",
      value: 1
      }, 
      {
          label: "<p>15 October 1931</p>",
          value: 2
      }];
    const score = service.getMultiselectScore(selectedOptions, responseDeclaration, false, outcomeDeclaration);
    expect(score).toEqual(2);
  })

  it('should call getMultiselectScore when shuffle is false return score 0', () => {
    const service: UtilService = TestBed.inject(UtilService);
    spyOn(service, 'getMultiselectScore').and.callThrough();
    const score = service.getMultiselectScore([options[0]], responseDeclaration, false, outcomeDeclaration);
    expect(score).toEqual(0);
  })

  it('should call getMultiselectScore when shuffle is false return score 1', () => {
    const service: UtilService = TestBed.inject(UtilService);
    spyOn(service, 'getMultiselectScore').and.callThrough();
    const score = service.getMultiselectScore([options[1]], responseDeclaration, false, outcomeDeclaration);
    expect(score).toEqual(1);
  })

  it('should call getMultiselectScore when shuffle is true', () => {
    const service: UtilService = TestBed.inject(UtilService);
    spyOn(service, 'getMultiselectScore').and.callThrough();
    const score = service.getMultiselectScore(([options[1]]), responseDeclaration, true, outcomeDeclaration);
    expect(score).toEqual(0.5);
  })

  it('should call getMultiselectScore when shuffle is true return score 0', () => {
    const service: UtilService = TestBed.inject(UtilService);
    spyOn(service, 'getMultiselectScore').and.callThrough();
    const score = service.getMultiselectScore(([options[0]]), responseDeclaration, true, outcomeDeclaration);
    expect(score).toEqual(0);
  })

  it('should call getMultiselectScore when shuffle is true return score 1', () => {
    const service: UtilService = TestBed.inject(UtilService);
    spyOn(service, 'getMultiselectScore').and.callThrough();
    const score = service.getMultiselectScore((options), responseDeclaration, true, outcomeDeclaration);
    expect(score).toEqual(1);
  })

  it('should check weather array has duplictes', () => {
    const service: UtilService = TestBed.inject(UtilService);
    spyOn(service, 'hasDuplicates').and.callThrough();
    let duplicates = service.hasDuplicates(selectedOptions, options[0]);
    expect(duplicates).toBeTruthy();
  });


  it('#updateSourceOfVideoElement() Should sets src for video element', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const video = document.createElement('video');
    video.poster = 'assets/public/content/assets/do_2137930188655902721387/gateway-of-india.jpg';
    video.setAttribute('data-asset-variable', 'do_113143853080248320171');
    video.controls = true;

    if (video.canPlayType('video/mp4')) {
      var source1 = document.createElement('source');
      source1.setAttribute('type', 'video/mp4');
      source1.setAttribute('src', 'assets/public/content/assets/do_2137980528723230721410/sample-5s.mp4'); 
      video.appendChild(source1);
      
    }

    if (video.canPlayType('video/webm')) {
      var source2 = document.createElement('source');
      source2.setAttribute('type', 'video/webm');
      source2.setAttribute('src', 'assets/public/content/assets/do_2137980528723230721410/sample-5s.mp4'); 
      video.appendChild(source2);
    } 
    document.getElementsByTagName = jasmine.createSpy('getElementsByTagName').and.returnValue([video]);
    service.updateSourceOfVideoElement('https://dev.sunbird.org', questions[0].media, 'do_1234')
    expect(video.poster).toBe('https://dev.sunbird.org/do_1234/assets/public/content/assets/do_2137930188655902721387/gateway-of-india.jpg')
  });

  it('#updateSourceOfVideoElement() Should sets src with #baseURL when its exists', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const video = document.createElement('video');
    video.poster = 'assets/public/content/assets/do_2137930188655902721387/gateway-of-india.jpg';
    video.setAttribute('data-asset-variable', 'do_113143853080248320171');
    video.controls = true;

    if (video.canPlayType('video/mp4')) {
      var source1 = document.createElement('source');
      source1.setAttribute('type', 'video/mp4');
      source1.setAttribute('src', 'assets/public/content/assets/do_2137980528723230721410/sample-5s.mp4'); 
      video.appendChild(source1);
      
    }

    if (video.canPlayType('video/webm')) {
      var source2 = document.createElement('source');
      source2.setAttribute('type', 'video/webm');
      source2.setAttribute('src', 'assets/public/content/assets/do_2137980528723230721410/sample-5s.mp4'); 
      video.appendChild(source2);
    } 
    document.getElementsByTagName = jasmine.createSpy('getElementsByTagName').and.returnValue([video]);
    service.updateSourceOfVideoElement(null, questions[0].media, 'do_1234')
    expect(video.poster).toBe('https://dev.sunbird.org/assets/public/content/assets/do_2137930188655902721387/gateway-of-india.jpg')
  });

  it('#updateSourceOfVideoElement() Should not sets when asset variable attribut not available', () => {
    const service: UtilService = TestBed.inject(UtilService);
    const video = document.createElement('video');
    video.poster = 'assets/public/content/assets/do_2137930188655902721387/gateway-of-india.jpg';
    video.controls = true;
    document.getElementsByTagName = jasmine.createSpy('getElementsByTagName').and.returnValue([video]);
    service.updateSourceOfVideoElement(null, questions[0].media, 'do_1234')
    expect(video.poster).toBe('http://localhost:9876/assets/public/content/assets/do_2137930188655902721387/gateway-of-india.jpg')
  });

});
