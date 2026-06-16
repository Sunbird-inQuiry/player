import { EventEmitter, InjectionToken, Type } from '@angular/core';

export interface IQuestionPlayer {
  // Required inputs — all types
  question: any;
  replayed: boolean;
  language: string;
  // Optional inputs
  tryAgain?: boolean;
  baseUrl?: string;
  shuffleOptions?: boolean;   // MCQ only; ignored by all other types
  // Required outputs — all types
  componentLoaded: EventEmitter<any>;
  optionSelected: EventEmitter<any>;
  // Optional output — SA only
  showAnswerClicked?: EventEmitter<any>;
  // Optional output — FTB only
  goToNext?: EventEmitter<void>;
}

export interface QuestionTypeDefinition {
  /** Lowercase primaryCategory string, e.g. 'match the following question' */
  primaryCategory: string;
  component: Type<IQuestionPlayer>;
}

export const QUESTION_TYPE_REGISTRY =
  new InjectionToken<QuestionTypeDefinition[]>('QUESTION_TYPE_REGISTRY');
