import type { PlayerConfig, TelemetryContext } from '../types';

/**
 * QUML Library Service - Minimal config helpers ONLY
 *
 * ⚠️ DO NOT use this for storing state
 * ⚠️ All configuration lives in QumlContext (context/QumlContext.tsx)
 *
 * This file ONLY has pure utility functions for config validation/extraction.
 * Config is passed through React Context, never stored as module globals.
 */

/** Validate a player configuration object. */
export function isValidPlayerConfig(config: unknown): config is PlayerConfig {
  return !!config && typeof config === 'object' && 'context' in config && 'config' in config;
}

/** Extract the language from config (defaults to 'en'). */
export function getLanguageFromConfig(config: PlayerConfig | null | undefined): string {
  return config?.config?.language || 'en';
}

/** Extract the base URL/host from the telemetry context. */
export function getBaseUrlFromContext(context: TelemetryContext | null | undefined): string {
  return context?.host || '';
}

/** Extract the pass threshold from the telemetry context (defaults to 0.5). */
export function getThresholdFromContext(context: TelemetryContext | null | undefined): number {
  return context?.threshold ?? 0.5;
}
