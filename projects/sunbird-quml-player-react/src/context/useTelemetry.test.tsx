import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTelemetry } from './useTelemetry';
import { getQueuedEvents, clearEventQueue } from '../services/telemetry-service';

describe('useTelemetry', () => {
  beforeEach(() => {
    clearEventQueue();
  });

  it('logOptionSelected queues an INTERACT event (string answer)', () => {
    const { result } = renderHook(() => useTelemetry());
    act(() => result.current.logOptionSelected('q1', 'A'));

    const events = getQueuedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eid).toBe('INTERACT');
    expect(events[0].edata).toMatchObject({ type: 'CHOOSE', id: 'A', questionId: 'q1' });
  });

  it('logOptionSelected joins array answers', () => {
    const { result } = renderHook(() => useTelemetry());
    act(() => result.current.logOptionSelected('q2', ['A', 'B']));

    const events = getQueuedEvents();
    expect(events[0].edata).toMatchObject({ id: 'A,B', questionId: 'q2' });
  });

  it('logAnswerSubmitted queues an ASSESS event with score/maxScore', () => {
    const { result } = renderHook(() => useTelemetry());
    act(() => result.current.logAnswerSubmitted('q3', 'A', 1, 2));

    const events = getQueuedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eid).toBe('ASSESS');
    expect(events[0].edata).toMatchObject({ type: 'assess', questionId: 'q3', score: 1, maxScore: 2 });
  });

  it('logPageViewed queues an IMPRESSION event', () => {
    const { result } = renderHook(() => useTelemetry());
    act(() => result.current.logPageViewed('start'));

    const events = getQueuedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eid).toBe('IMPRESSION');
    expect(events[0].edata).toMatchObject({ pageId: 'start' });
  });
});
