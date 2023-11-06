import { EventEmitter, Injectable } from '@angular/core';
import { IParentConfig, QumlPlayerConfig } from '../../quml-library-interface';
import { QumlLibraryService } from '../../quml-library.service';
import { UtilService } from '../../util-service';
import { eventName, TelemetryType } from '../../telemetry-constants';
import { QuestionCursor } from '../../quml-question-cursor.service';
import * as _ from 'lodash-es';
import { forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ViewerService {
  public qumlPlayerEvent = new EventEmitter<any>();
  public qumlQuestionEvent = new EventEmitter<any>();
  zoom: string;
  rotation: number;
  qumlPlayerStartTime: number;
  qumlPlayerLastPageTime: number;
  totalNumberOfQuestions: number;
  currentQuestionIndex: number;
  contentName: string;
  src: string;
  userName: string;
  version = '1.0';
  timeSpent = '0:0';
  metaData: any;
  loadingProgress: number;
  endPageSeen: boolean;
  identifiers: any;
  threshold: number;
  isAvailableLocally = false;
  isSectionsAvailable = false;
  questionSetId: string;
  parentIdentifier: string;
  sectionQuestions = [];

  constructor(
    public qumlLibraryService: QumlLibraryService,
    public utilService: UtilService,
    public questionCursor: QuestionCursor
  ) { }

  initialize(config: QumlPlayerConfig, threshold: number, questionIds: string[], parentConfig: IParentConfig) {
    this.qumlLibraryService.initializeTelemetry(config, parentConfig);
    this.identifiers = _.cloneDeep(questionIds);
    this.parentIdentifier = config.metadata.identifier;
    this.threshold = threshold;
    this.rotation = 0;
    this.totalNumberOfQuestions = config.metadata.childNodes.length || 0;
    this.qumlPlayerStartTime = this.qumlPlayerLastPageTime = new Date().getTime();
    this.currentQuestionIndex = 1;
    this.contentName = config.metadata.name;
    this.isAvailableLocally = parentConfig.isAvailableLocally;
    this.isSectionsAvailable = parentConfig?.isSectionsAvailable;
    this.src = config.metadata.artifactUrl || '';
    this.questionSetId = config.metadata.identifier;

    /* istanbul ignore else */
    if (config?.context?.userData) {
      const firstName = config.context.userData?.firstName ?? '';
      const lastName = config.context.userData?.lastName ?? '';
      this.userName = firstName + ' ' + lastName;
    }
    this.metaData = {
      pagesHistory: [],
      totalPages: 0,
      duration: 0,
      rotation: [],
      progressBar: [],
      questions: [],
      questionIds: [],
      lastQuestionId: '',
    };
    this.loadingProgress = 0;
    this.endPageSeen = false;
  }

  raiseStartEvent(currentQuestionIndex) {
    this.currentQuestionIndex = currentQuestionIndex;
    const duration = new Date().getTime() - this.qumlPlayerStartTime;
    const startEvent: any = {
      eid: 'START',
      ver: this.version,
      edata: {
        type: 'START',
        currentIndex: this.currentQuestionIndex,
        duration
      },
      metaData: this.metaData
    };

    this.qumlPlayerEvent.emit(startEvent);
    this.qumlPlayerLastPageTime = this.qumlPlayerStartTime = new Date().getTime();
    this.qumlLibraryService.start(duration);
  }

  raiseEndEvent(currentQuestionIndex, endPageSeen, score) {
    this.metaData.questions = this.sectionQuestions;
    const duration = new Date().getTime() - this.qumlPlayerStartTime;
    const endEvent: any = {
      eid: 'END',
      ver: this.version,
      edata: {
        type: 'END',
        currentPage: currentQuestionIndex,
        totalPages: this.totalNumberOfQuestions,
        duration
      },
      metaData: this.metaData
    };

    this.qumlPlayerEvent.emit(endEvent);
    this.timeSpent = this.utilService.getTimeSpentText(this.qumlPlayerStartTime);
    this.qumlLibraryService.end(duration, currentQuestionIndex, this.totalNumberOfQuestions, this.totalNumberOfQuestions, endPageSeen, score);
  }

  raiseHeartBeatEvent(type: string, telemetryType: string, pageId: number | string, nextContentId?: string) {
    const hearBeatEvent: any = {
      eid: 'HEARTBEAT',
      ver: this.version,
      edata: {
        type,
        questionIndex: this.currentQuestionIndex,
      },
      metaData: this.metaData
    };

    if (type === eventName.nextContentPlay && nextContentId) {
      hearBeatEvent.edata.nextContentId = nextContentId;
    }

    if (this.isSectionsAvailable) {
      hearBeatEvent.edata.sectionId = this.questionSetId;
    }

    this.qumlPlayerEvent.emit(hearBeatEvent);
    if (TelemetryType.interact === telemetryType) {
      this.qumlLibraryService.interact(type.toLowerCase(), pageId);
    } else if (TelemetryType.impression === telemetryType) {
      this.qumlLibraryService.impression(pageId);
    }

  }

  raiseAssesEvent(questionData, index: number, pass: string, score, resValues, duration: number) {
    const assessEvent = {
      item: questionData,
      index: index,
      pass: pass,
      score: score,
      resvalues: resValues,
      duration: duration
    }
    this.qumlPlayerEvent.emit(assessEvent);
    this.qumlLibraryService.startAssesEvent(assessEvent);
  }

  raiseResponseEvent(identifier, qType, optionSelected) {
    const responseEvent = {
      target: {
        id: identifier,
        ver: this.version,
        type: qType
      },
      values: [{
        optionSelected
      }]
    }
    this.qumlPlayerEvent.emit(responseEvent);
    this.qumlLibraryService.response(identifier, this.version, qType, optionSelected);
  }

  raiseSummaryEvent(currentQuestionIndex, endpageseen, score, summaryObj) {
    let timespent = new Date().getTime() - this.qumlPlayerStartTime;
    timespent = Number(((timespent % 60000) / 1000).toFixed(2))
    const eData = {
      type: "content",
      mode: "play",
      starttime: this.qumlPlayerStartTime,
      endtime: new Date().getTime(),
      timespent,
      pageviews: this.totalNumberOfQuestions,
      interactions: summaryObj.correct + summaryObj.wrong + summaryObj.partial,
      extra: [{
        id: "progress",
        value: ((currentQuestionIndex / this.totalNumberOfQuestions) * 100).toFixed(0).toString()
      }, {
        id: "endpageseen",
        value: endpageseen.toString()
      }, {
        id: "score",
        value: score.toString()
      }, {
        id: "correct",
        value: summaryObj.correct.toString()
      }, {
        id: "incorrect",
        value: summaryObj.wrong.toString()
      }, {
        id: "partial",
        value: summaryObj.partial.toString()
      }, {
        id: "skipped",
        value: summaryObj.skipped.toString()
      }]
    };
    const summaryEvent = {
      eid: 'QUML_SUMMARY',
      ver: this.version,
      edata: eData,
      metaData: this.metaData
    };
    this.qumlPlayerEvent.emit(summaryEvent);
    this.qumlLibraryService.summary(eData);
  }

  raiseExceptionLog(errorCode: string, errorType: string, stacktrace, traceId) {
    const exceptionLogEvent = {
      eid: "ERROR",
      edata: {
        err: errorCode,
        errtype: errorType,
        requestid: traceId || '',
        stacktrace: stacktrace || '',
      }
    }
    this.qumlPlayerEvent.emit(exceptionLogEvent)
    this.qumlLibraryService.error(stacktrace, { err: errorCode, errtype: errorType });
  }


  getQuestions(currentIndex?: number, index?: number) {
    let indentifersForQuestions;
    if (currentIndex !== undefined && index) {
      indentifersForQuestions = this.identifiers.splice(currentIndex, index);
    } else if (!currentIndex && !index) {
      indentifersForQuestions = this.identifiers.splice(0, this.threshold);
    }
    if (!_.isEmpty(indentifersForQuestions)) {
      const requests = [];
      const chunkArray = _.chunk(indentifersForQuestions, 10);
      _.forEach(chunkArray, (value) => {
        requests.push(this.questionCursor.getQuestions(value, this.parentIdentifier));
      });
      forkJoin(requests).subscribe(questions => {
        _.forEach(questions, (value) => {
          const v2QuestionMetadata = this.getTransformedQuestionMetadata(value);
          console.log('v2-transformed-questionMetadata ===>', v2QuestionMetadata);
          this.qumlQuestionEvent.emit(v2QuestionMetadata);
        });
      }, (error) => {
        this.qumlQuestionEvent.emit({
          error: error
        })
      });
    }
  }

  getQuestion() {
    if (this.identifiers.length) {
      let questionIdentifier = this.identifiers.splice(0, this.threshold);
      this.questionCursor.getQuestion(questionIdentifier[0]).subscribe((question) => {
        this.qumlQuestionEvent.emit(question);
      }, (error) => {
        this.qumlQuestionEvent.emit({
          error: error
        });
      });
    }
  }

  generateMaxAttemptEvents(currentattempt: number, maxLimitExceeded: boolean, isLastAttempt: boolean) {
    return {
      eid: 'exdata',
      ver: this.version,
      edata: {
        type: 'exdata',
        currentattempt,
        maxLimitExceeded,
        isLastAttempt
      },
      metaData: this.metaData
    };
  }

  updateSectionQuestions(id: string, questions) {
    const index = this.sectionQuestions.findIndex(section => section.id === id);
    if (index > -1) {
      this.sectionQuestions[index].questions = questions;
    } else {
      this.sectionQuestions.push({ id, questions });
    }
  }

  getSectionQuestions(id: string) {
    return this.sectionQuestions.find(section => section.id === id)?.questions || [];
  }

  pauseVideo() {
    const videoElements = Array.from(document.getElementsByTagName('video') as HTMLCollectionOf<Element>);
    videoElements.forEach((element: HTMLVideoElement) => element.pause());
  }

  /** Player V2 Transformation Logic**/

  getTransformedHierarchy(questionsetMetadata) {
    let updatedMetadata = this.getTransformedQuestionSetMetadata(questionsetMetadata);
    if (!_.isEmpty(updatedMetadata, 'children')) {
      updatedMetadata.children = this.transformChildren(updatedMetadata.children);
    }
    return updatedMetadata;
  }

  getTransformedQuestionSetMetadata(data) {
    data = this.processMaxScoreProperty(data);
    data = _.omit(data, 'version');
    data = this.processInstructions(data);
    data = this.processBloomsLevel(data);
    data = this.processBooleanProps(data);
    data = this.processTimeLimits(data);
    return data;
  }

  processMaxScoreProperty(data) {
    if (_.has(data, 'maxScore')) {
      const outcomeDeclaration = {
        maxScore: {
          cardinality: 'single',
          type: 'integer',
          defaultValue: data.maxScore
        }
      }
      data = _.omit(data, 'maxScore');
      data['outcomeDeclaration'] = outcomeDeclaration;
    }

    return data;
  }

  processInstructions(data) {
    if (_.has(data, 'instructions.default')) {
      data.instructions = data.instructions.default;
    }
    return data;
  }

  processBloomsLevel(data) {
    if (_.has(data, 'bloomsLevel')) {
      const bLevel = _.get(data, 'bloomsLevel');
      _.unset(data, 'bloomsLevel');
      _.set(data, 'complexityLevel', [bLevel.toString()]);
    }
    return data;
  }

  processBooleanProps(data: any) {
    const booleanProps = ["showSolutions", "showFeedback", "showHints", "showTimer"];
    const getBooleanValue = (str: any) => str === "Yes";

    _.forEach(booleanProps, (prop: any) => {
      if (_.has(data, prop)) {
        const propVal = data[prop];
        data[prop] = getBooleanValue(propVal);
      }
    });

    return data;
  }

  processTimeLimits(data) {
    let timeLimits = {
      questionSet: {
        min: 0,
        max: 0
      }
    }
    if (_.has(data, 'timeLimits')) {
      if (!_.isNull(data.timeLimits)) {
        const parsedTimeLimits = JSON.parse(data.timeLimits);
        timeLimits.questionSet.max = _.toInteger(parsedTimeLimits.maxTime);
      }
    }
    data.timeLimits = timeLimits;
    return data;
  }

  transformChildren(children: any) {
    const self = this;
    if (!_.isEmpty(children)) {
      _.forEach(children, (ch) => {
        if (_.has(ch, 'version')) {
          _.unset(ch, 'version');
        }
        ch = this.processBloomsLevel(ch);
        ch = this.processBooleanProps(ch);
        if (_.get(ch, 'mimeType').toLowerCase() === 'application/vnd.sunbird.questionset') {
          ch = this.processTimeLimits(ch);
          ch = this.processInstructions(ch);
          const nestedChildren = _.get(ch, 'children', []);
          self.transformChildren(nestedChildren);
        }
      });
    }
    return children;
  }

  getTransformedQuestionMetadata(data) {
    if (_.has(data, 'questions')) {
      _.forEach(data.questions, (question) => {
        if (!_.has(question, 'qumlVersion') || question.qumlVersion != 1.1) {
          question = this.processResponseDeclaration(question);
          question = this.processInteractions(question);
          question = this.processSolutions(question);
          question = this.processInstructions(question);
          question = this.processHints(question);
          question = this.processBloomsLevel(question);
          question = this.processBooleanProps(question);
          const ans = this.getAnswer(question)
          if (!_.isEmpty(ans)) {
            _.set(question, 'answer', ans);
          }
        }
      });
      return data;
    }
  }

  /** code to transform question metadata**/
  processResponseDeclaration(data) {
    let outcomeDeclaration = {};
    if (_.isEqual(_.toLower(data.primaryCategory), 'subjective question')) {
      delete data.responseDeclaration;
      delete data.interactions;

      if (_.has(data, 'maxScore') && !_.isNull(data.maxScore)) {
        outcomeDeclaration = {
          maxScore: {
            cardinality: 'single',
            type: 'integer',
            defaultValue: data.maxScore
          }
        };
        data.outcomeDeclaration = outcomeDeclaration;
      }
    } else {
      let responseDeclaration = data.responseDeclaration;
      if (!_.isEmpty(responseDeclaration)) {
        for (const key in responseDeclaration) {
          const responseData = responseDeclaration[key];

          const maxScore = {
            cardinality: _.get(responseData, 'cardinality', ''),
            type: _.get(responseData, 'type', ''),
            defaultValue: _.get(responseData, 'maxScore'),
          };

          delete responseData.maxScore;
          outcomeDeclaration['maxScore'] = maxScore;

          const correctResp = responseData.correctResponse || {};
          delete correctResp.outcomes;

          if (_.toLower(_.get(responseData, 'type')) === 'integer' && _.toLower(_.get(responseData, 'cardinality')) === 'single') {
            const correctKey = correctResp.value;
            correctResp.value = parseInt(correctKey, 10);
          }

          const mappingData = responseData.mapping || [];
          if (!_.isEmpty(mappingData)) {
            const updatedMapping = mappingData.map(mapData => ({
              value: mapData.response,
              score: _.get(mapData, 'outcomes.score', 0),
            }));

            responseData.mapping = updatedMapping;
          }

          responseDeclaration[key] = responseData;
        }

        data.responseDeclaration = responseDeclaration;
        data['outcomeDeclaration'] = outcomeDeclaration;
      }
    }
    return data;
  }

  processInteractions(data: any) {
    const interactions: any = _.get(data, 'interactions', {});
    if (!_.isEmpty(interactions)) {
      const validation: any = _.get(interactions, 'validation', {});
      const resp1: any = _.get(interactions, 'response1', {});
      const resValData: any = _.get(interactions, 'response1.validation', {});
      if (!_.isEmpty(resValData)) {
        _.forEach(resValData, (value, key) => {
          validation.set(key, value);
        });
      } else {
        _.set(resp1, 'validation', validation);
      }
      _.unset(interactions, 'validation');
      _.set(interactions, 'response1', resp1);
      _.set(data, 'interactions', interactions);
    }
    return data;
  }

  processSolutions(data) {
    const solutions = _.get(data, 'solutions', []);

    if (!_.isEmpty(solutions)) {
      const updatedSolutions = _.reduce(solutions, (result, solution) => {
        result[_.get(solution, 'id')] = this.getSolutionString(solution, _.get(data, 'media', []));
        return result;
      }, {});
  
      _.set(data, 'solutions', updatedSolutions);
    }
    return data;
  }

  getSolutionString(data, media) {
    if (!_.isEmpty(data)) {
      const type = _.get(data, 'type', '');

      switch (type) {
        case 'html': {
          return _.get(data, 'value', '');
        }

        case 'video': {
          const value = _.get(data, 'value', '');
          const mediaData = _.find(media, (item) => _.isEqual(value, _.get(item, 'id', '')));

          if (mediaData) {
            const src = _.get(mediaData, 'src', '');
            const thumbnail = _.get(mediaData, 'thumbnail', '');

            const solutionStr = `<video data-asset-variable="media_identifier" width="400" controls poster="thumbnail_url">
              <source type="video/mp4" src="media_source_url">
              <source type="video/webm" src="media_source_url">
            </video>`.replace('media_identifier', value).replace('thumbnail_url', thumbnail).replace(/media_source_url/g, src);

            return solutionStr;
          }
          return '';
        }

        default: {
          return '';
        }
      }
    }

    return '';
  }

  processHints(data): void {
    const hints = _.get(data, 'hints', []);

    if (!_.isEmpty(hints)) {
      const updatedHints = _.chain(hints)
        .map(hint => ({ [this.generateUUID()]: hint }))
        .flatten()
        .keyBy(_.values)
        .value();

      _.set(data, 'hints', updatedHints);
    }
    return data;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  getAnswer(data) {
    const interactions = _.get(data, 'interactions', {});

    if (!_.isEqual(_.get(data, 'primaryCategory'), 'Subjective Question') && !_.isEmpty(interactions)) {
      const responseData = _.get(data, 'responseDeclaration.response1', {});
      const options = _.get(interactions, 'response1.options', {});
      let formatedAnswer = '';

      let answerData = _.get(responseData, 'cardinality');

      if (answerData === 'single') {
        const correctResp = _.get(_.get(responseData, 'correctResponse', {}), 'value', 0);
        const label = options[correctResp];

        formatedAnswer = `<div class="answer-container"><div class="answer-body">${label.label}</div></div>`;
      } else {
        const correctResp = _.get(responseData, 'correctResponse.value');
        let singleAns = '<div class="answer-body">answer_html</div>';
        const answerList = [];
        _.forEach(options, (option) => {
          if (_.includes(correctResp, option.value, )) {
            const replAns = _.replace(singleAns, 'answer_html', _.get(option, 'label'))
            console.log('replAns ==>', replAns)
            answerList.push(replAns)
          }
        })
        formatedAnswer = `<div class="answer-container">${answerList.join('')}</div>`;
      }
      return formatedAnswer;
    }
    else {
      return _.get(data, 'answer', '');
    }
  }

}
