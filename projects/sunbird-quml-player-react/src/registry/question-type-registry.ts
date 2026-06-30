/**
 * Question Type Registry
 * Maps primaryCategory → React component.
 *
 * This registry is created EMPTY here (Phase 2 infrastructure). Question
 * components are registered in Phase 4; this file does not import any of them.
 */

import type { ComponentType } from 'react';

/**
 * A registered question component. Props vary per question type, so the registry
 * stores them heterogeneously — the one place `any` is genuinely unavoidable for
 * a component map. Consumers cast to the concrete props at the call site.
 */
export type QuestionComponent = ComponentType<any>;

export const questionTypeRegistry = new Map<string, QuestionComponent>([
  // Will be populated after question types are implemented (Phase 4).
  // Format: ['primaryCategory.toLowerCase()', ComponentName]
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
