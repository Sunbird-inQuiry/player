import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  initializeTelemetry,
  raiseInteractEvent,
  subscribeTelemetry,
  getQueuedEvents,
  clearEventQueue,
} from './telemetry-service';
import type { TelemetryContext } from '../types';

const ctx = {} as TelemetryContext;

afterEach(() => {
  delete (window as any).EkTelemetry;
  clearEventQueue();
  vi.restoreAllMocks();
});

describe('telemetry-service — SDK method guards', () => {
  it('does NOT throw when the host SDK has no logEvent (regression: reorder crash)', () => {
    // Host SDK exposes initialize but NOT logEvent — exactly the failing case.
    (window as any).EkTelemetry = { initialize: vi.fn() };
    initializeTelemetry(ctx);

    const received: unknown[] = [];
    const unsub = subscribeTelemetry((e) => received.push(e));

    // This is what every onOptionSelected (incl. reorder drag/hover/nudge) hits.
    expect(() => raiseInteractEvent({ a: 1 })).not.toThrow();
    // Host still receives the event via the bridge even though logEvent is absent.
    expect(received).toHaveLength(1);
    unsub();
  });

  it('does not throw when the SDK has no initialize', () => {
    (window as any).EkTelemetry = { logEvent: vi.fn() };
    expect(() => initializeTelemetry(ctx)).not.toThrow();
  });

  it('calls logEvent when the SDK provides one, and still emits', () => {
    const logEvent = vi.fn();
    (window as any).EkTelemetry = { initialize: vi.fn(), logEvent };
    initializeTelemetry(ctx);

    const received: unknown[] = [];
    const unsub = subscribeTelemetry((e) => received.push(e));
    raiseInteractEvent({ a: 1 });

    expect(logEvent).toHaveBeenCalledTimes(1);
    expect(received).toHaveLength(1);
    unsub();
  });

  it('does NOT queue when the SDK lacks logEvent (bridge handles it; no unbounded growth)', () => {
    (window as any).EkTelemetry = { initialize: vi.fn() }; // no logEvent
    initializeTelemetry(ctx);
    clearEventQueue();
    raiseInteractEvent({ a: 1 });
    raiseInteractEvent({ a: 2 });
    // Never queued — flushQueuedEvents could never drain it, so it must not grow.
    expect(getQueuedEvents()).toHaveLength(0);
  });

  it('queues while no SDK is present (for a later flush)', () => {
    delete (window as any).EkTelemetry;
    initializeTelemetry(ctx); // no SDK → telemetrySDK reset to null
    clearEventQueue();
    raiseInteractEvent({ a: 1 });
    expect(getQueuedEvents()).toHaveLength(1);
  });

  it('resets the SDK reference when re-init finds no SDK (no stale logEvent calls)', () => {
    const logEvent = vi.fn();
    (window as any).EkTelemetry = { initialize: vi.fn(), logEvent };
    initializeTelemetry(ctx);
    // SDK removed and re-initialized → stale reference must be cleared.
    delete (window as any).EkTelemetry;
    initializeTelemetry(ctx);
    raiseInteractEvent({ a: 1 });
    expect(logEvent).not.toHaveBeenCalled(); // would fire if the stale ref lingered
  });
});
