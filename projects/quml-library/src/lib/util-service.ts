import { Injectable } from '@angular/core';
import * as _ from 'lodash-es';
import { DEFAULT_SCORE } from './player-constants'

@Injectable({
    providedIn: 'root'
})
export class UtilService {

    public uniqueId(length = 32) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    public getTimeSpentText(pdfPlayerStartTime) {
        const duration = new Date().getTime() - pdfPlayerStartTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Number(((duration % 60000) / 1000).toFixed(0));
        return (minutes + ':' + (seconds < 10 ? '0' : '') + seconds);
    }

    public getKeyValue(keys) {
        let key = keys.find((k) => {
            return k.includes('response');
        })
        return key;
    }

    public getMultiselectScore(options, responseDeclaration, isShuffleQuestions, outcomeDeclaration) {
        let key: any = this.getKeyValue(Object.keys(responseDeclaration));
        const selectedOptionValue = options.map(option => option.value);
        let score;
        let mapping = responseDeclaration[key]['mapping'];
        if (isShuffleQuestions) {
            score = DEFAULT_SCORE;
            const scoreForEachMapping = _.round(1/mapping.length, 2);
            _.forEach(mapping, (map) => {
                map.score = scoreForEachMapping;
            })
        } else {
            score = _.get(outcomeDeclaration, 'maxScore.defaultValue');
        }
        let correctValues = responseDeclaration[key].correctResponse.value.map((ele) => Number(ele));
        if (_.isEqual(correctValues.sort(), selectedOptionValue.sort())) {                                               
            return score;
        } else if (!_.isEqual(correctValues.sort(), selectedOptionValue.sort())) {
            let sum = 0;
            _.forEach(mapping, (map, index) => {
                if(_.includes(selectedOptionValue, map.value)) {
                    sum += (map?.score ? map.score : 0);
                }
            });
            return sum;
        }
    }

    hasDuplicates(selectedOptions, option) {
        let duplicate = selectedOptions.find((o) => { return o.value === option.value });
        return duplicate;
    }

    getQuestionType(questions, currentIndex) {
        let index = currentIndex - 1 === -1 ? 0 : currentIndex - 1;
        return questions[index]['qType'];

    }

    canGo(progressBarClass) {
        let attemptedParams = ['correct', 'wrong', 'attempted'];
        return attemptedParams.includes(progressBarClass);
    }

    sumObjectsByKey(...objects) {
        return objects.reduce((accumulator, currentValue) => {
            for (const key in currentValue) {
                /* istanbul ignore else */
                if (currentValue.hasOwnProperty(key)) {
                    accumulator[key] = (accumulator[key] || 0) + currentValue[key];
                }
            }
            return accumulator;
        }, {});
    }

    scrollParentToChild(parent: HTMLElement, child: HTMLElement) {
        const isMobilePortrait = window.matchMedia("(max-width: 480px)").matches;
        const parentRect = parent.getBoundingClientRect();
        const childRect = child.getBoundingClientRect();

        if (isMobilePortrait) {
            parent.scrollLeft = childRect.left + parent.scrollLeft - parentRect.left;
        } else {
            parent.scrollTop = (childRect.top + parent.scrollTop) - parentRect.top;
        }
    }

    // fetches the element using its tag video and sets the value of the “src” attribute of source element and poster attribute.
    updateSourceOfVideoElement(baseUrl: string, media: any[], identifier: string)  {
        const elements = Array.from(document.getElementsByTagName('video') as HTMLCollectionOf<Element>);
        _.forEach(elements, (element: HTMLElement) => {
            const videoId = element.getAttribute('data-asset-variable');
            if(!videoId) { return; }
            const asset = _.filter(media, ['id', videoId]);
            const posterSrc = element.getAttribute('poster');
            
            if(!_.isEmpty(asset) && posterSrc) {
                element['poster'] = baseUrl ? `${baseUrl}/${identifier}/${posterSrc}` : asset[0].baseUrl + posterSrc;
            }  

            if(!_.isEmpty(asset)) {
                const sourceElement = Array.from(element.getElementsByTagName('source') as HTMLCollectionOf<Element>);
                _.forEach(sourceElement, (element: HTMLElement) => {
                    const sourceSrc = element.getAttribute('src');
                    element['src'] = baseUrl ? `${baseUrl}/${identifier}/${sourceSrc}` : asset[0].baseUrl + sourceSrc;
                });
            }
        });
    } 

}
