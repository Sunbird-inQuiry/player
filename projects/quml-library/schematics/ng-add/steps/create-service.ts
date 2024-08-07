import { workspaces } from '@angular-devkit/core';
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import * as messages from '../messages';
import { Schema } from '../schema';

export function createService(options: Schema): Rule {
  return async (host: Tree, context: SchematicContext) => {
    const workspace: any = await getWorkspace(host);
    const projectName = options.project || (workspace.extensions.defaultProject as string);
    const project = workspace.projects.get(projectName);

    if (!project) {
      throw new SchematicsException(messages.noProject(projectName));
    }

    return createQUMLImplementationService(workspace, project, host, context);
  };
}

function createQUMLImplementationService(workspace: any, project: workspaces.ProjectDefinition, host: Tree, context: SchematicContext): Rule {
  const path = `${project.sourceRoot}/app/question-cursor-implementation.service.ts`;
  if (!host.exists(path)) {
    context.logger.info("Creating question cursor implementation service...");
    host.create(path, getQuestionCursorImplementationService());
  }
  return () => host;
}

function getQuestionCursorImplementationService() {
  return `
    import { HttpClient } from '@angular/common/http';
    import { Injectable } from "@angular/core";
    import { Question, QuestionCursor } from '@project-sunbird/sunbird-quml-player';
    import { Observable, of, throwError } from 'rxjs';
    import { map, mergeMap } from 'rxjs/operators';

    @Injectable({
        providedIn: 'root'
    })
    export class QuestionCursorImplementationService implements QuestionCursor {
        listUrl: string | undefined; // Define this url to call list api in server
        constructor(private http: HttpClient) { }
    
        getQuestions(identifiers: string[], parentId?: string): Observable<Question> {
            const option: any = {
                url: this.listUrl,
                data: {
                    request: {
                        search: { identifier: identifiers }
                    }
                }
            };
            return this.post(option).pipe(map((data) => data.result));
        }
      
        getQuestion(identifier: string): Observable<Question> {
            const option: any = {
                url: this.listUrl,
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
      
        private post(requestParam: any): Observable<any> {
            const httpOptions = {
                headers: { 'Content-Type': 'application/json' }
            };
            return this.http.post(requestParam.url, requestParam.data, httpOptions).pipe(
                mergeMap((data: any) => {
                    if (data.responseCode !== 'OK') {
                        return throwError(() => data);
                    }
                    return of(data);
                }));
        }
        getAllQuestionSet(identifiers: string[]): Observable<any> {
            return of({});
        }
    }`
}