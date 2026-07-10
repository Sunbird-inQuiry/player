import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { QuestionCursor } from '@project-sunbird/sunbird-quml-player';
import { Observable, of, throwError as observableThrowError } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ApiEndPoints } from './app.constant';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class QuestionCursorImplementationService implements QuestionCursor {
    constructor(private http: HttpClient) { }

    getQuestions(identifiers: string[], parentId?: string, language?: string): Observable<any> {
        const base = `${environment.baseUrl}${ApiEndPoints.questionList}`;
        const url = language ? `${base}?lang=${language}` : base;
        const option: any = {
            url,
            data: {
                request: {
                    search: { identifier: identifiers }
                }
            }
        };
        return this.post(option).pipe(map((data) => data.result));
    }

    getQuestion(identifier: string, language?: string): Observable<any> {
        const base = `${environment.baseUrl}${ApiEndPoints.questionList}`;
        const url = language ? `${base}?lang=${language}` : base;
        const option: any = {
            url,
            data: {
                request: {
                    search: { identifier: [identifier] }
                }
            }
        };
        return this.post(option).pipe(map((data) => data.result));
    }

    getQuestionSet(identifier: string): Observable<any> {
        return of({})
    }

    private post(requestParam): Observable<any> {
        const httpOptions = {
            headers: { 'Content-Type': 'application/json' }
        };
        return this.http.post(requestParam.url, requestParam.data, httpOptions).pipe(
            mergeMap((data: any) => {
                if (data.responseCode !== 'OK') {
                    return observableThrowError(data);
                }
                return of(data);
            }));
    }
    getAllQuestionSet(identifiers: string[]) {
        return of({});
    }
}
