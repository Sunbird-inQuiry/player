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

/**
 * Telemetry bridge (Phase 8): listeners are notified of every raised event so a
 * host (e.g. the web component) can forward them to `onTelemetryEvent`. Additive
 * — the queue/SDK behaviour is unchanged.
 */
type TelemetryListener = (event: TelemetryEvent) => void;
const listeners = new Set<TelemetryListener>();

/** Subscribe to raised telemetry events. Returns an unsubscribe function. */
export function subscribeTelemetry(listener: TelemetryListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(event: TelemetryEvent): void {
  listeners.forEach((listener) => listener(event));
}

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
  emit(event);
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
  emit(event);
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
  emit(event);
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
