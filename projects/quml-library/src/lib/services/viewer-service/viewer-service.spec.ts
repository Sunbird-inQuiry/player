import { inject, TestBed } from '@angular/core/testing';
import { ViewerService } from './viewer-service';
import { mockData } from './viewer-service.spec.data';
import { QumlLibraryService } from '../../quml-library.service';
import { UtilService } from '../../util-service';
import { QuestionCursor } from '../../quml-question-cursor.service';
import { of, throwError } from 'rxjs';

describe('ViewerService', () => {
  class MockQuestionCursor {
    getQuestions(identifiers: string[], parentId?: string) { };
    getQuestion(identifier: string) { };
    getQuestionSet(identifier: string) { };
    getAllQuestionSet(identifiers: string[]) { };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ViewerService,
        UtilService,
        QumlLibraryService,
        { provide: QuestionCursor, useClass: MockQuestionCursor }],
    });
  });

  it('should be created', () => {
    const service: ViewerService = TestBed.inject(ViewerService);
    expect(service).toBeTruthy();
  });

  it('should initialize player config', () => {
    const service = TestBed.inject(ViewerService);
    const questionIds = [
      "do_21348431559137689613",
      "do_21348431640099225615"
    ];
    const qumlService = TestBed.inject(QumlLibraryService);
    spyOn(qumlService, 'initializeTelemetry');
    service.initialize(mockData.playerConfig, 3, questionIds, mockData.parentConfig);
  });

  it('should raise Start event ', () => {
    const service = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    spyOn(service.qumlPlayerEvent, 'emit');
    spyOn(qumlLibraryService, 'start');
    service.raiseStartEvent(1);
    expect(service.qumlPlayerEvent.emit).toHaveBeenCalled();
    expect(qumlLibraryService.start).toHaveBeenCalled();
  });

  it('should raise interact event', () => {
    const service = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    service.isSectionsAvailable = true;
    spyOn(qumlLibraryService, 'interact');
    service.raiseHeartBeatEvent('type', 'interact', 1);
    expect(qumlLibraryService.interact).toHaveBeenCalled();
  });

  it('should raise next content play event', () => {
    const service = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    spyOn(service.qumlPlayerEvent, 'emit');
    spyOn(qumlLibraryService, 'interact');
    service.raiseHeartBeatEvent('NEXT_CONTENT_PLAY', 'interact', 1, 'do_123');
    expect(service.qumlPlayerEvent.emit).toHaveBeenCalled();
    expect(qumlLibraryService.interact).toHaveBeenCalled();
  });

  it('should raise impression Event', () => {
    const service = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    spyOn(service.qumlPlayerEvent, 'emit');
    spyOn(qumlLibraryService, 'impression');
    service.raiseHeartBeatEvent('NEXT_CONTENT_PLAY', 'impression', 1, 'do_123');
    expect(service.qumlPlayerEvent.emit).toHaveBeenCalled();
    expect(qumlLibraryService.impression).toHaveBeenCalled();
  });

  it('should not raise any event if not provided', () => {
    const service = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    spyOn(service.qumlPlayerEvent, 'emit');
    spyOn(qumlLibraryService, 'impression');
    spyOn(qumlLibraryService, 'interact');
    service.raiseHeartBeatEvent('', '', 1, 'do_123');
    expect(service.qumlPlayerEvent.emit).toHaveBeenCalled();
    expect(qumlLibraryService.impression).not.toHaveBeenCalled();
    expect(qumlLibraryService.interact).not.toHaveBeenCalled();
  });

  it('should call getSectionQuestions', () => {
    const viewerService = TestBed.inject(ViewerService);
    viewerService.sectionQuestions = mockData.mockSectionQuestions;
    const res = viewerService.getSectionQuestions('do_21348431528472576011');
    expect(res).toBeDefined();
  });

  it('should call pauseVideo', () => {
    const viewerService = TestBed.inject(ViewerService);
    const video = document.createElement('video');
    document.body.appendChild(video);
    viewerService.pauseVideo();
    expect(video.paused).toBeTruthy();
  });

  it('should call updateSectionQuestions', () => {
    const viewerService = TestBed.inject(ViewerService);
    viewerService.sectionQuestions = mockData.mockSectionQuestions;
    viewerService.updateSectionQuestions('do_21348431528472576011', mockData.mockSectionQuestions[0].questions);
    expect(viewerService.sectionQuestions[0].questions).toBeDefined();
  });

  it('should call updateSectionQuestions', () => {
    const viewerService = TestBed.inject(ViewerService);
    viewerService.sectionQuestions = mockData.mockSectionQuestions;
    viewerService.updateSectionQuestions('do_21348431528472576012', mockData.mockSectionQuestions[0].questions);
    expect(viewerService.sectionQuestions.length).toEqual(2);
  });

  it('should call generateMaxAttemptEvents', () => {
    const viewerService = TestBed.inject(ViewerService);
    viewerService.version = '1';
    const resp = viewerService.generateMaxAttemptEvents(1, false, false);
    expect(resp).toBeDefined();
  });

  it('should call raiseExceptionLog', () => {
    const viewerService = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    spyOn(viewerService.qumlPlayerEvent, 'emit');
    spyOn(qumlLibraryService, 'error');
    const resp = viewerService.raiseExceptionLog('CPV2_INT_CONNECT_01', 'content failed to load , No Internet Available', 'content failed to load , No Internet Available', 'id');
    expect(viewerService.qumlPlayerEvent.emit).toHaveBeenCalled();
    expect(qumlLibraryService.error).toHaveBeenCalled();
  });

  it('should raiseAssesEvent', () => {
    const viewerService = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    spyOn(viewerService.qumlPlayerEvent, 'emit');
    spyOn(qumlLibraryService, 'startAssesEvent');
    viewerService.raiseAssesEvent(mockData.questionData, 1, "Yes", 1, mockData.resValues, 2);
    expect(viewerService.qumlPlayerEvent.emit).toHaveBeenCalled();
    expect(qumlLibraryService.startAssesEvent).toHaveBeenCalled();
  });

  it('should raiseResponseEvent', () => {
    const viewerService = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    const optionSelected = {
      "label": "<p><span style=\"background-color:rgb(255,255,255);color:rgb(32,33,36);\">Bill Gates</span></p>",
      "value": 1,
      "selected": true
    }
    spyOn(viewerService.qumlPlayerEvent, 'emit');
    spyOn(qumlLibraryService, 'response');
    viewerService.raiseResponseEvent("do_21348431640099225615", "MCQ", optionSelected);
    expect(viewerService.qumlPlayerEvent.emit).toHaveBeenCalled();
    expect(qumlLibraryService.response).toHaveBeenCalled();
  });

  it('should call raiseEndEvent', () => {
    const viewerService = TestBed.inject(ViewerService);
    const utilService = TestBed.inject(UtilService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    viewerService.metaData = mockData.metaData;
    viewerService.sectionQuestions = mockData.mockSectionQuestions;
    viewerService.qumlPlayerStartTime = 1646553243939;
    viewerService.version = "1.0";
    viewerService.totalNumberOfQuestions = 4;
    spyOn(viewerService.qumlPlayerEvent, 'emit');
    spyOn(utilService, 'getTimeSpentText');
    spyOn(qumlLibraryService, 'end');
    viewerService.raiseEndEvent(4, true, 2);
    expect(viewerService.qumlPlayerEvent.emit).toHaveBeenCalled();
    expect(utilService.getTimeSpentText).toHaveBeenCalled();
    expect(qumlLibraryService.end).toHaveBeenCalled();
  });

  it('should call raiseSummaryEvent', () => {
    const viewerService = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    viewerService.qumlPlayerStartTime = 1646580090765;
    viewerService.totalNumberOfQuestions = 4;
    viewerService.version = "1.0";
    spyOn(viewerService.qumlPlayerEvent, 'emit');
    spyOn(qumlLibraryService, 'summary');
    viewerService.raiseSummaryEvent(4, true, 3, {
      "skipped": 0,
      "correct": 4,
      "wrong": 0,
      "partial": 0
    });

    expect(viewerService.qumlPlayerEvent.emit).toHaveBeenCalled();
    expect(qumlLibraryService.summary).toHaveBeenCalled();
  });

  it('should call getQuestion and return the question response', () => {
    const service = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    service.identifiers = ['do_123', 'do_124'];
    spyOn(service.questionCursor, 'getQuestion').and.returnValue(of([{ id: 'do_123' }, { id: 'do_124' }] as any));
    spyOn(service.qumlQuestionEvent, 'emit');
    service.getQuestion();
    expect(service.qumlQuestionEvent.emit).toHaveBeenCalled();
    expect(service.questionCursor.getQuestion).toHaveBeenCalled();
  });

  it('should call getQuestion and return the error', () => {
    const service = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    service.identifiers = ['do_123', 'do_124'];
    spyOn(service.questionCursor, 'getQuestion').and.returnValue(throwError('Error'));
    spyOn(service.qumlQuestionEvent, 'emit');
    service.getQuestion();
    expect(service.qumlQuestionEvent.emit).toHaveBeenCalled();
    expect(service.questionCursor.getQuestion).toHaveBeenCalled();
  });

  it('should call getQuestion and should not return anything if identifiers are not present', () => {
    const service = TestBed.inject(ViewerService);
    const qumlLibraryService = TestBed.inject(QumlLibraryService);
    service.identifiers = [];
    spyOn(service.questionCursor, 'getQuestion');
    service.getQuestion();
    expect(service.questionCursor.getQuestion).not.toHaveBeenCalled();
  });

  it('should call getQuestions', () => {
    const service = TestBed.inject(ViewerService);
    service.parentIdentifier = 'do_555';
    service.identifiers = ['do_123', 'do_124'];
    spyOn(service.questionCursor, 'getQuestions').and.returnValue(of([{ id: 'do_123' }] as any));
    spyOn(service.qumlQuestionEvent, 'emit');
    service.getQuestions(0, 1)
    expect(service.questionCursor.getQuestions).toHaveBeenCalled();
    expect(service.qumlQuestionEvent.emit).toHaveBeenCalled();
  });

  it('should emit error if error received', () => {
    const service = TestBed.inject(ViewerService);
    service.parentIdentifier = 'do_555';
    service.identifiers = ['do_123', 'do_124'];
    service.threshold = 3;
    spyOn(service.questionCursor, 'getQuestions').and.returnValue(throwError('Error'));
    spyOn(service.qumlQuestionEvent, 'emit');
    service.getQuestions()
    expect(service.questionCursor.getQuestions).toHaveBeenCalled();
    expect(service.qumlQuestionEvent.emit).toHaveBeenCalled();
  });

  it('#getTransformedHierarchy() should return transformed hierarchy', () => {
    const service = TestBed.inject(ViewerService);
    spyOn(service, 'getTransformedHierarchy').and.callThrough();
    let v1Hierarchy = mockData.questionsetV1Hierarchy;
    spyOn(service, 'getTransformedQuestionSetMetadata').and.callThrough();
    spyOn(service, 'transformChildren').and.callThrough();
    const transformedData = service.getTransformedHierarchy(v1Hierarchy);
    expect(transformedData.instructions).toBe("<p>This is Simple Questionset for testing short text Questionset</p>");
    expect(transformedData.children[0].children[0].showTimer).toBeFalsy();
  });

  it('#processBloomsLevel() should set complexityLevel', () => {
    const service = TestBed.inject(ViewerService);
    spyOn(service, 'processBloomsLevel').and.callThrough();
    const data = {bloomsLevel: 'apply'};
    const complexityLevelData = service.processBloomsLevel(data);
    expect(complexityLevelData.complexityLevel.length).toEqual(1);
  })

  it('#getTransformedQuestionMetadata() should return transformed MCQ question data', () => {
    const service = TestBed.inject(ViewerService);
    spyOn(service, 'getTransformedQuestionMetadata').and.callThrough();
    const questionsList = {questions: mockData.v1Questions};
    const transformedquestionsList = service.getTransformedQuestionMetadata(questionsList);
  });

  it('#processSubjectiveResponseDeclaration() should return data if maxScore not exists', () => {
    const service = TestBed.inject(ViewerService);
    spyOn(service, 'processSubjectiveResponseDeclaration').and.callThrough();
    const subjectQData = {
      "body": "<p>What is capital of India?</p>",
      "answer": "<p>New Delhi</p>",
    }
    const processedData = service.processSubjectiveResponseDeclaration(subjectQData);
    expect(processedData.outcomeDeclaration).toBeUndefined();
  })

});
