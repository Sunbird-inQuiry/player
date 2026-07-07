import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  initializeTelemetry,
  raiseInteractEvent,
  subscribeTelemetry,
} from './telemetry-service';
import type { TelemetryContext } from '../types';

const ctx = {} as TelemetryContext;

afterEach(() => {
  delete (window as any).EkTelemetry;
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
});
