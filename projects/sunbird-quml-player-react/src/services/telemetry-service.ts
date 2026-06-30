import type { TelemetryContext } from '../types';

/**
 * Telemetry Service - internal abstraction with a queue-based implementation.
 *
 * Phase 1 scope: events queue when no SDK is present. Full Sunbird telemetry
 * SDK integration is deferred to a later phase.
 */

interface TelemetryEvent {
  eid: string;
  edata: unknown;
  timestamp: number;
}

let telemetrySDK: any = null;
let eventQueue: TelemetryEvent[] = [];

/** Initialize the telemetry SDK if one is available globally. */
export function initializeTelemetry(context: TelemetryContext): void {
  const sdk = typeof window !== 'undefined' ? (window as any).EkTelemetry : undefined;
  if (sdk) {
    telemetrySDK = sdk;
    telemetrySDK.initialize(context);
  } else {
    console.warn('[TelemetryService] Sunbird SDK not available');
  }
}

/** Raise an INTERACT event (user action). */
export function raiseInteractEvent(data: unknown): void {
  const event: TelemetryEvent = { eid: 'INTERACT', edata: data, timestamp: Date.now() };

  if (telemetrySDK) {
    telemetrySDK.logEvent(event);
  } else {
    eventQueue.push(event);
    console.log('[TelemetryService] INTERACT event queued:', event);
  }
}

/** Raise an ASSESS event (answer submission). */
export function raiseAssessEvent(data: unknown): void {
  const event: TelemetryEvent = { eid: 'ASSESS', edata: data, timestamp: Date.now() };

  if (telemetrySDK) {
    telemetrySDK.logEvent(event);
  } else {
    eventQueue.push(event);
    console.log('[TelemetryService] ASSESS event queued:', event);
  }
}

/** Raise an IMPRESSION event (page view). */
export function raiseImpressionEvent(data: unknown): void {
  const event: TelemetryEvent = { eid: 'IMPRESSION', edata: data, timestamp: Date.now() };

  if (telemetrySDK) {
    telemetrySDK.logEvent(event);
  } else {
    eventQueue.push(event);
    console.log('[TelemetryService] IMPRESSION event queued:', event);
  }
}

/** Get queued events (useful for testing or delayed SDK init). */
export function getQueuedEvents(): TelemetryEvent[] {
  return [...eventQueue];
}

/** Clear the event queue. */
export function clearEventQueue(): void {
  eventQueue = [];
}

/** Flush queued events to the SDK (if available). */
export function flushQueuedEvents(): void {
  if (telemetrySDK && eventQueue.length > 0) {
    eventQueue.forEach((event) => {
      telemetrySDK.logEvent(event);
    });
    eventQueue = [];
  }
}
