/**
 * Question Type Registry
 * Maps primaryCategory → React component.
 *
 * Populated in Phase 4 with all six question-type renderers.
 */

import type { ComponentType } from 'react';
import { McqQuestion } from '../components/questions/McqQuestion/McqQuestion';
import { SaQuestion } from '../components/questions/SaQuestion/SaQuestion';
import { FtbQuestion } from '../components/questions/FtbQuestion/FtbQuestion';
import { MtfQuestion } from '../components/questions/MtfQuestion/MtfQuestion';
import { SeqQuestion } from '../components/questions/SeqQuestion/SeqQuestion';
import { ReoQuestion } from '../components/questions/ReoQuestion/ReoQuestion';

/**
 * A registered question component. Props vary per question type, so the registry
 * stores them heterogeneously — the one place `any` is genuinely unavoidable for
 * a component map. Consumers cast to the concrete props at the call site.
 */
export type QuestionComponent = ComponentType<any>;

export const questionTypeRegistry = new Map<string, QuestionComponent>([
  ['multiple choice question', McqQuestion],
  ['subjective question', SaQuestion],
  ['fill in the blank question', FtbQuestion],
  ['ftb question', FtbQuestion],
  ['match the following question', MtfQuestion],
  ['sequence question', SeqQuestion],
  ['reorder question', ReoQuestion],
]);

/**
 * Register a question type.
 * @param primaryCategory - e.g. 'multiple choice question'
 * @param component - React component
 */
export function registerQuestionType(
  primaryCategory: string,
  component: QuestionComponent,
): void {
  if (!primaryCategory || !component) {
    console.warn('[Registry] Invalid registration:', { primaryCategory, component });
    return;
  }
  questionTypeRegistry.set(primaryCategory.toLowerCase(), component);
}

/**
 * Get the component for a question type.
 * @param primaryCategory - e.g. 'multiple choice question'
 * @returns React component or null
 */
export function getQuestionComponent(
  primaryCategory: string | null | undefined,
): QuestionComponent | null {
  if (!primaryCategory) {
    return null;
  }
  return questionTypeRegistry.get(primaryCategory.toLowerCase()) || null;
}

/**
 * Check if a question type is registered.
 */
export function isQuestionTypeRegistered(primaryCategory: string | null | undefined): boolean {
  if (!primaryCategory) {
    return false;
  }
  return questionTypeRegistry.has(primaryCategory.toLowerCase());
}

/**
 * Get all registered question types as [primaryCategory, component] pairs.
 */
export function getAllRegisteredTypes(): Array<[string, QuestionComponent]> {
  return Array.from(questionTypeRegistry.entries());
}

/**
 * Clear the registry (used for testing).
 */
export function clearRegistry(): void {
  questionTypeRegistry.clear();
}
