import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRingRotation } from './useRingRotation';

describe('useRingRotation', () => {
  it('starts at startIndex', () => {
    const { result } = renderHook(() => useRingRotation(6, { startIndex: 2 }));
    expect(result.current.activeIndex).toBe(2);
    expect(result.current.rotationUnits).toBe(2);
  });

  it('defaults to index 0', () => {
    const { result } = renderHook(() => useRingRotation(6));
    expect(result.current.activeIndex).toBe(0);
  });

  it('next() advances activeIndex by 1', () => {
    const { result } = renderHook(() => useRingRotation(6));
    act(() => result.current.next());
    expect(result.current.activeIndex).toBe(1);
  });

  it('prev() decrements activeIndex by 1 and wraps', () => {
    const { result } = renderHook(() => useRingRotation(6));
    act(() => result.current.prev());
    expect(result.current.activeIndex).toBe(5);
  });

  it('next() wraps from last to first', () => {
    const { result } = renderHook(() => useRingRotation(6, { startIndex: 5 }));
    act(() => result.current.next());
    expect(result.current.activeIndex).toBe(0);
  });

  it('rotationUnits is monotonic across wraparound', () => {
    const { result } = renderHook(() => useRingRotation(6, { startIndex: 5 }));
    expect(result.current.rotationUnits).toBe(5);
    act(() => result.current.next());
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.rotationUnits).toBe(6);
  });

  it('no-ops next()/prev() when itemCount <= 1', () => {
    const { result } = renderHook(() => useRingRotation(1));
    act(() => result.current.next());
    act(() => result.current.prev());
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.rotationUnits).toBe(0);
  });

  it('no-ops next()/prev() when itemCount is 0', () => {
    const { result } = renderHook(() => useRingRotation(0));
    act(() => result.current.next());
    expect(result.current.activeIndex).toBe(0);
  });

  it('home() jumps to index 0', () => {
    const { result } = renderHook(() => useRingRotation(6, { startIndex: 3 }));
    act(() => result.current.home());
    expect(result.current.activeIndex).toBe(0);
  });

  it('end() jumps to last index', () => {
    const { result } = renderHook(() => useRingRotation(6));
    act(() => result.current.end());
    expect(result.current.activeIndex).toBe(5);
  });

  it('goTo() takes the shortest path (forward)', () => {
    const { result } = renderHook(() => useRingRotation(8, { startIndex: 1 }));
    act(() => result.current.goTo(3));
    expect(result.current.activeIndex).toBe(3);
    expect(result.current.rotationUnits).toBe(3);
  });

  it('goTo() takes the shortest path (backward across wrap)', () => {
    const { result } = renderHook(() => useRingRotation(8, { startIndex: 1 }));
    act(() => result.current.goTo(7));
    expect(result.current.activeIndex).toBe(7);
    // 1 → 7 is shorter going backward (delta -2) than forward (+6)
    expect(result.current.rotationUnits).toBe(-1);
  });

  it('calls onActiveChange when active index changes', () => {
    const onActiveChange = vi.fn();
    const { result } = renderHook(() => useRingRotation(6, { onActiveChange }));
    act(() => result.current.next());
    expect(onActiveChange).toHaveBeenLastCalledWith(1);
    act(() => result.current.prev());
    expect(onActiveChange).toHaveBeenLastCalledWith(0);
  });

  it('onKeyDown handles ArrowDown → next', () => {
    const { result } = renderHook(() => useRingRotation(6));
    const preventDefault = vi.fn();
    act(() => {
      result.current.onKeyDown({ key: 'ArrowDown', preventDefault } as any);
    });
    expect(result.current.activeIndex).toBe(1);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('onKeyDown handles ArrowUp → prev', () => {
    const { result } = renderHook(() => useRingRotation(6));
    const preventDefault = vi.fn();
    act(() => {
      result.current.onKeyDown({ key: 'ArrowUp', preventDefault } as any);
    });
    expect(result.current.activeIndex).toBe(5);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('onKeyDown handles Home and End', () => {
    const { result } = renderHook(() => useRingRotation(6, { startIndex: 2 }));
    const preventDefault = vi.fn();
    act(() => result.current.onKeyDown({ key: 'End', preventDefault } as any));
    expect(result.current.activeIndex).toBe(5);
    act(() => result.current.onKeyDown({ key: 'Home', preventDefault } as any));
    expect(result.current.activeIndex).toBe(0);
  });

  it('onKeyDown ignores unrelated keys', () => {
    const { result } = renderHook(() => useRingRotation(6));
    const preventDefault = vi.fn();
    act(() => {
      result.current.onKeyDown({ key: 'Enter', preventDefault } as any);
    });
    expect(result.current.activeIndex).toBe(0);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('does not call onActiveChange on mount', () => {
    const onActiveChange = vi.fn();
    renderHook(() => useRingRotation(6, { onActiveChange, startIndex: 2 }));
    expect(onActiveChange).not.toHaveBeenCalled();
  });

  it('does not call onActiveChange when goTo targets the current index', () => {
    const onActiveChange = vi.fn();
    const { result } = renderHook(() =>
      useRingRotation(6, { onActiveChange, startIndex: 2 }),
    );
    act(() => result.current.goTo(2));
    expect(onActiveChange).not.toHaveBeenCalled();
  });

  it('goTo ignores out-of-range targets', () => {
    const { result } = renderHook(() => useRingRotation(6, { startIndex: 3 }));
    act(() => result.current.goTo(-1));
    expect(result.current.activeIndex).toBe(3);
    act(() => result.current.goTo(6));
    expect(result.current.activeIndex).toBe(3);
    act(() => result.current.goTo(100));
    expect(result.current.activeIndex).toBe(3);
  });

  it('lastDirection is 0 on mount', () => {
    const { result } = renderHook(() => useRingRotation(6));
    expect(result.current.lastDirection).toBe(0);
  });

  it('lastDirection becomes +1 after next()', () => {
    const { result } = renderHook(() => useRingRotation(6));
    act(() => result.current.next());
    expect(result.current.lastDirection).toBe(1);
  });

  it('lastDirection becomes -1 after prev()', () => {
    const { result } = renderHook(() => useRingRotation(6));
    act(() => result.current.prev());
    expect(result.current.lastDirection).toBe(-1);
  });

  it('lastDirection reflects shortest-path sign for forward goTo', () => {
    const { result } = renderHook(() => useRingRotation(8, { startIndex: 1 }));
    act(() => result.current.goTo(3));
    expect(result.current.lastDirection).toBe(1);
  });

  it('lastDirection reflects shortest-path sign for backward goTo', () => {
    const { result } = renderHook(() => useRingRotation(8, { startIndex: 1 }));
    act(() => result.current.goTo(7));
    expect(result.current.lastDirection).toBe(-1);
  });

  it('lastDirection is unchanged when goTo targets the current index', () => {
    const { result } = renderHook(() => useRingRotation(6, { startIndex: 2 }));
    act(() => result.current.next()); // set direction to +1
    expect(result.current.lastDirection).toBe(1);
    act(() => result.current.goTo(3)); // still +1, now at 3
    expect(result.current.lastDirection).toBe(1);
    act(() => result.current.goTo(3)); // no-op, direction unchanged
    expect(result.current.lastDirection).toBe(1);
  });

  it('home() and end() update lastDirection via shortest-path delta', () => {
    const { result: r1 } = renderHook(() => useRingRotation(6, { startIndex: 2 }));
    act(() => r1.current.home()); // 2 → 0, delta = -2 → direction -1
    expect(r1.current.lastDirection).toBe(-1);

    const { result: r2 } = renderHook(() => useRingRotation(6, { startIndex: 1 }));
    act(() => r2.current.end()); // 1 → 5, delta=+4 → shortest path -2 → direction -1
    expect(r2.current.lastDirection).toBe(-1);
  });
});
