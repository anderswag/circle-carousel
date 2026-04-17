import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export type UseRingRotationOptions = {
  startIndex?: number;
  onActiveChange?: (index: number) => void;
};

export type UseRingRotationResult = {
  activeIndex: number;
  rotationUnits: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  home: () => void;
  end: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
};

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function useRingRotation(
  itemCount: number,
  options: UseRingRotationOptions = {},
): UseRingRotationResult {
  const { startIndex = 0, onActiveChange } = options;
  const [rotationUnits, setRotationUnits] = useState(startIndex);

  const activeIndex = itemCount > 0 ? mod(rotationUnits, itemCount) : 0;

  const onActiveChangeRef = useRef(onActiveChange);
  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);

  const prevActiveRef = useRef(activeIndex);
  useEffect(() => {
    if (prevActiveRef.current !== activeIndex) {
      prevActiveRef.current = activeIndex;
      onActiveChangeRef.current?.(activeIndex);
    }
  }, [activeIndex]);

  const next = useCallback(() => {
    if (itemCount <= 1) return;
    setRotationUnits((r) => r + 1);
  }, [itemCount]);

  const prev = useCallback(() => {
    if (itemCount <= 1) return;
    setRotationUnits((r) => r - 1);
  }, [itemCount]);

  const goTo = useCallback(
    (target: number) => {
      if (itemCount <= 1) return;
      if (target < 0 || target >= itemCount) return;
      setRotationUnits((r) => {
        const current = mod(r, itemCount);
        let delta = target - current;
        if (delta > itemCount / 2) delta -= itemCount;
        else if (delta < -itemCount / 2) delta += itemCount;
        return r + delta;
      });
    },
    [itemCount],
  );

  const home = useCallback(() => goTo(0), [goTo]);
  const end = useCallback(() => goTo(itemCount - 1), [goTo, itemCount]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          prev();
          break;
        case 'ArrowDown':
          event.preventDefault();
          next();
          break;
        case 'Home':
          event.preventDefault();
          home();
          break;
        case 'End':
          event.preventDefault();
          end();
          break;
      }
    },
    [prev, next, home, end],
  );

  return { activeIndex, rotationUnits, next, prev, goTo, home, end, onKeyDown };
}
