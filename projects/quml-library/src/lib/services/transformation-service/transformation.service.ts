import { Injectable } from '@angular/core';
import * as _ from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class TransformationService {

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
  let parsedTimeLimits;
  if (_.has(data, 'timeLimits') && !_.isNull(data.timeLimits)) {
    if (_.isString(data.timeLimits)) {
      parsedTimeLimits = JSON.parse(data.timeLimits);
    } else {
      parsedTimeLimits = data.timeLimits;
    }

    data.timeLimits = {
      questionSet: {
        min: 0,
        max: parsedTimeLimits?.maxTime ? _.toInteger(parsedTimeLimits.maxTime) : 0
      }
    };
  }

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

  processResponseDeclaration(data) {
    let outcomeDeclaration = {};
    if (_.isEqual(_.toLower(data.primaryCategory), 'subjective question')) {
      data = this.processSubjectiveResponseDeclaration(data);
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
          responseData.mapping = this.getUpdatedMapping(responseData);
          responseDeclaration[key] = responseData;
        }
        data.responseDeclaration = responseDeclaration;
        data['outcomeDeclaration'] = outcomeDeclaration;
      }
    }
    return data;
  }

  processSubjectiveResponseDeclaration(subjectiveMetadata) {
    let outcomeDeclaration = {};
    delete subjectiveMetadata.responseDeclaration;
    delete subjectiveMetadata.interactions;
    if (_.has(subjectiveMetadata, 'maxScore') && !_.isNull(subjectiveMetadata.maxScore)) {
      outcomeDeclaration = {
        maxScore: {
          cardinality: 'single',
          type: 'integer',
          defaultValue: subjectiveMetadata.maxScore
        }
      };
      subjectiveMetadata.outcomeDeclaration = outcomeDeclaration;
      return subjectiveMetadata;
    }
    return subjectiveMetadata;
  }

  getUpdatedMapping(responseData) {
    const mappingData = responseData.mapping || [];
    if (!_.isEmpty(mappingData)) {
      const updatedMapping = mappingData.map(mapData => ({
        value: mapData.response,
        score: _.get(mapData, 'outcomes.score', 0),
      }));
      return updatedMapping;
    }
    return mappingData;
  }

  processInteractions(data: any) {
    const interactions: any = _.get(data, 'interactions', {});
    if (!_.isEmpty(interactions)) {
      const validation: any = _.get(interactions, 'validation', {});
      const resp1: any = _.get(interactions, 'response1', {});
      const resValData: any = _.get(interactions, 'response1.validation', {});
      if (!_.isEmpty(resValData)) {
        _.forEach(resValData, (value, key) => {
          _.set(validation, key, value)
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

    if (!_.isEmpty(solutions) && _.isArray(solutions)) {
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

  processHints(data) {
    const hints = _.get(data, 'hints', []);
    let updatedHints = {};
    if (!_.isEmpty(hints)) {
      _.forEach(hints, (hint) => {
        _.merge(updatedHints, {[uuidv4()]: hint});
      })

      _.set(data, 'hints', updatedHints);
    }
    return data;
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
          if (_.includes(correctResp, option.value,)) {
            const replAns = _.replace(singleAns, 'answer_html', _.get(option, 'label'))
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
