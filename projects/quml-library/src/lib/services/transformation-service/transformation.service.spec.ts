import { TestBed } from '@angular/core/testing';
import { TransformationService } from './transformation.service';
import { mockData } from './transformation.service.spec.data';

describe('TransformationService', () => {
  let service: TransformationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransformationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getTransformedHierarchy() should return transformed hierarchy', () => {
    spyOn(service, 'getTransformedHierarchy').and.callThrough();
    let v1Hierarchy = mockData.questionsetV1Hierarchy;
    spyOn(service, 'getTransformedQuestionSetMetadata').and.callThrough();
    spyOn(service, 'transformChildren').and.callThrough();
    const transformedData = service.getTransformedHierarchy(v1Hierarchy);
    expect(transformedData.instructions).toBe("<p>This is Simple Questionset for testing short text Questionset</p>");
    expect(transformedData.children[0].children[0].showTimer).toBeFalsy();
  });

  it('#processBloomsLevel() should set complexityLevel', () => {
    spyOn(service, 'processBloomsLevel').and.callThrough();
    const data = {bloomsLevel: 'apply'};
    const complexityLevelData = service.processBloomsLevel(data);
    expect(complexityLevelData.complexityLevel.length).toEqual(1);
  })

  it('#getTransformedQuestionMetadata() should return transformed MCQ question data', () => {
    spyOn(service, 'getTransformedQuestionMetadata').and.callThrough();
    const questionsList = {questions: mockData.v1Questions};
    const transformedquestionsList = service.getTransformedQuestionMetadata(questionsList);
  });

  it('#processSubjectiveResponseDeclaration() should return data if maxScore not exists', () => {
    spyOn(service, 'processSubjectiveResponseDeclaration').and.callThrough();
    const subjectQData = {
      "body": "<p>What is capital of India?</p>",
      "answer": "<p>New Delhi</p>",
    }
    const processedData = service.processSubjectiveResponseDeclaration(subjectQData);
    expect(processedData.outcomeDeclaration).toBeUndefined();
  });

  it('#getUpdatedMapping() should return updated mapping', () => {
    spyOn(service, 'getUpdatedMapping').and.callThrough();
    const updatedMapping = service.getUpdatedMapping(mockData.v1responseDeclaration.response1);
    expect(updatedMapping[0].value).toEqual(0);
    expect(updatedMapping[0].score).toEqual(1);
  });

  it('#processHints() should return updated hints', () => {
    const data = {
      hints: ['math question', 'class 4']
    }
    spyOn(service, 'processHints').and.callThrough();
    let updatedHints = undefined;
    updatedHints = service.processHints(data);
    expect(updatedHints).toBeDefined();
  })
});
