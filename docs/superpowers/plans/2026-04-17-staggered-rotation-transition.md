# Staggered Rotation Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a direction-aware staggered transition so that on rotation the active card moves first, each subsequent card (in the direction of motion) starts 60ms later, ripple-style.

**Architecture:** Extend `useRingRotation` with a `lastDirection` value (`+1`, `−1`, or `0`). `CircleCarousel` computes each card's wave index from `lastDirection`, `activeIndex`, and the card's list index, and writes it to a CSS custom property `--wave`. CSS applies `transition-delay: calc(var(--wave) * var(--cc-stagger, 60ms))`.

**Tech Stack:** React 19, TypeScript 5, Vitest 3 + @testing-library/react, pure CSS transitions (no animation library).

---

## File Structure

Files modified (no new files):

```
src/CircleCarousel/
├── useRingRotation.ts         # add lastDirection state and tests
├── useRingRotation.test.ts    # add 6 tests for direction tracking
├── CircleCarousel.tsx         # compute + set --wave per card
├── CircleCarousel.test.tsx    # add 3 tests for --wave behavior
└── CircleCarousel.css         # transition-delay rule + reduced-motion delay reset
```

File responsibilities are unchanged from the base component.

---

## Task 1: Add `lastDirection` to `useRingRotation` (TDD)

**Files:**
- Modify: `src/CircleCarousel/useRingRotation.test.ts`
- Modify: `src/CircleCarousel/useRingRotation.ts`

- [ ] **Step 1: Write the failing tests**

Open `src/CircleCarousel/useRingRotation.test.ts` and add these tests inside the top-level `describe('useRingRotation', () => { ... })` block, anywhere before the closing `});`. Do not modify existing tests.

```ts
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
    // From start=3 on a 6-item ring, home() is delta=-3 (tie) → uses raw positive
    // delta direction; from start=2, end() is delta=+3 (tie also) → direction +1.
    // Use explicitly non-tie starts to keep expectations unambiguous.
    const { result: r1 } = renderHook(() => useRingRotation(6, { startIndex: 2 }));
    act(() => r1.current.home()); // 2 → 0, delta = -2 → direction -1
    expect(r1.current.lastDirection).toBe(-1);

    const { result: r2 } = renderHook(() => useRingRotation(6, { startIndex: 1 }));
    act(() => r2.current.end()); // 1 → 5, delta=+4 → shortest path -2 → direction -1
    expect(r2.current.lastDirection).toBe(-1);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: 7 new tests fail with a message indicating `lastDirection` is `undefined`. Existing 34 tests still pass.

- [ ] **Step 3: Update `UseRingRotationResult` and hook state**

Edit `src/CircleCarousel/useRingRotation.ts`. Replace the file contents with:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export type UseRingRotationOptions = {
  startIndex?: number;
  onActiveChange?: (index: number) => void;
};

export type RotationDirection = -1 | 0 | 1;

export type UseRingRotationResult = {
  activeIndex: number;
  rotationUnits: number;
  lastDirection: RotationDirection;
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
  const [lastDirection, setLastDirection] = useState<RotationDirection>(0);

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
    setLastDirection(1);
  }, [itemCount]);

  const prev = useCallback(() => {
    if (itemCount <= 1) return;
    setRotationUnits((r) => r - 1);
    setLastDirection(-1);
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
        if (delta !== 0) {
          setLastDirection(delta > 0 ? 1 : -1);
        }
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

  return {
    activeIndex,
    rotationUnits,
    lastDirection,
    next,
    prev,
    goTo,
    home,
    end,
    onKeyDown,
  };
}
```

**Note on the `setLastDirection` call inside the `setRotationUnits` updater:** React batches state updates, and calling another state setter from inside an updater is supported. The `lastDirection` update schedules a re-render alongside the `rotationUnits` change, so consumers see both values move in the same render.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass (20 original hook + 7 new = 27 hook tests, plus 14 component tests still passing = 41 total).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(carousel): track lastDirection in useRingRotation"
```

---

## Task 2: Drive `--wave` from component and apply staggered `transition-delay` in CSS (TDD)

**Files:**
- Modify: `src/CircleCarousel/CircleCarousel.test.tsx`
- Modify: `src/CircleCarousel/CircleCarousel.tsx`
- Modify: `src/CircleCarousel/CircleCarousel.css`

- [ ] **Step 1: Write the failing component tests**

Open `src/CircleCarousel/CircleCarousel.test.tsx` and add these three tests inside the top-level `describe('CircleCarousel', () => { ... })` block, anywhere before the closing `});`. Do not modify existing tests.

```tsx
  it('assigns --wave = 0 to every card on initial mount', () => {
    const { container } = render(
      <CircleCarousel items={items} renderCard={renderCard} />,
    );
    const cards = container.querySelectorAll<HTMLElement>(
      '.circle-carousel__card',
    );
    cards.forEach((el) => {
      expect(el.style.getPropertyValue('--wave')).toBe('0');
    });
  });

  it('sets --wave in CW order after ArrowDown', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CircleCarousel items={items} renderCard={renderCard} />,
    );
    screen.getByRole('listbox').focus();
    await user.keyboard('{ArrowDown}');
    // activeIndex is now 1. Wave index = (i - active + N) mod N for d >= 0.
    // Expected waves: card 1→0, card 2→1, card 3→2, card 4→3, card 5→4, card 0→5.
    const cards = container.querySelectorAll<HTMLElement>(
      '.circle-carousel__card',
    );
    const N = items.length;
    const active = 1;
    cards.forEach((el, i) => {
      const expected = ((i - active) + N) % N;
      expect(el.style.getPropertyValue('--wave')).toBe(`${expected}`);
    });
  });

  it('sets --wave in reversed (CCW) order after ArrowUp', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CircleCarousel items={items} renderCard={renderCard} />,
    );
    screen.getByRole('listbox').focus();
    await user.keyboard('{ArrowUp}');
    // activeIndex is now 5 (wrapped from 0). lastDirection = -1.
    // Wave index = (N - relative) mod N, where relative = (i - active + N) mod N.
    const cards = container.querySelectorAll<HTMLElement>(
      '.circle-carousel__card',
    );
    const N = items.length;
    const active = 5;
    cards.forEach((el, i) => {
      const relative = ((i - active) + N) % N;
      const expected = (N - relative) % N;
      expect(el.style.getPropertyValue('--wave')).toBe(`${expected}`);
    });
  });
```

- [ ] **Step 2: Run the component tests to verify they fail**

Run: `npm test`
Expected: 3 new component tests fail (cards don't have `--wave` CSS custom property yet). Hook tests from Task 1 still pass.

- [ ] **Step 3: Compute `--wave` per card in `CircleCarousel.tsx`**

Edit `src/CircleCarousel/CircleCarousel.tsx`. Replace the file contents with:

```tsx
import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';
import { useRingRotation } from './useRingRotation';
import './CircleCarousel.css';

export type RenderCardArgs<T> = {
  item: T;
  index: number;
  isActive: boolean;
};

export type CircleCarouselProps<T> = {
  items: T[];
  renderCard: (args: RenderCardArgs<T>) => ReactNode;
  radius?: number;
  cardSize?: { width: number; height: number };
  startIndex?: number;
  onActiveChange?: (index: number) => void;
  className?: string;
  ariaLabel?: string;
};

const DEFAULT_RADIUS = 220;
const DEFAULT_CARD_SIZE = { width: 140, height: 180 };

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function CircleCarousel<T>({
  items,
  renderCard,
  radius = DEFAULT_RADIUS,
  cardSize = DEFAULT_CARD_SIZE,
  startIndex = 0,
  onActiveChange,
  className,
  ariaLabel = 'Circle carousel',
}: CircleCarouselProps<T>) {
  const { activeIndex, rotationUnits, lastDirection, onKeyDown } =
    useRingRotation(items.length, { startIndex, onActiveChange });

  if (
    import.meta.env.DEV &&
    items.length > 0 &&
    (items.length < 4 || items.length > 12)
  ) {
    console.warn(
      `CircleCarousel: ${items.length} items is outside the recommended 4–12 range.`,
    );
  }

  const baseId = useId();
  const optionId = (i: number) => `${baseId}-option-${i}`;

  const rootStyle: CSSProperties = {
    ['--cc-radius' as string]: `${radius}px`,
    ['--cc-card-w' as string]: `${cardSize.width}px`,
    ['--cc-card-h' as string]: `${cardSize.height}px`,
  };

  const classes = ['circle-carousel', className].filter(Boolean).join(' ');

  if (items.length === 0) {
    return (
      <div
        className={classes}
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        style={rootStyle}
      />
    );
  }

  const step = 360 / items.length;
  const N = items.length;

  return (
    <div
      className={classes}
      role="listbox"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-activedescendant={optionId(activeIndex)}
      onKeyDown={onKeyDown}
      style={rootStyle}
    >
      <div className="circle-carousel__ring">
        {items.map((item, i) => {
          const theta = (i - rotationUnits) * step;
          const isActive = i === activeIndex;
          const relative = mod(i - activeIndex, N);
          const wave =
            lastDirection === 0
              ? 0
              : lastDirection > 0
                ? relative
                : (N - relative) % N;
          const cardStyle: CSSProperties = {
            ['--theta' as string]: `${theta}deg`,
            ['--wave' as string]: `${wave}`,
          };
          return (
            <div
              key={i}
              id={optionId(i)}
              role="option"
              aria-selected={isActive}
              className="circle-carousel__card"
              style={cardStyle}
            >
              {renderCard({ item, index: i, isActive })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Apply staggered `transition-delay` in CSS**

Edit `src/CircleCarousel/CircleCarousel.css`. Replace the file contents with:

```css
.circle-carousel {
  position: relative;
  width: calc(var(--cc-radius) * 2 + var(--cc-card-w));
  height: calc(var(--cc-radius) * 2 + var(--cc-card-h));
  outline: none;
}

.circle-carousel:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 6px;
  border-radius: 12px;
}

.circle-carousel__ring {
  position: absolute;
  inset: 0;
}

.circle-carousel__card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--cc-card-w);
  height: var(--cc-card-h);
  transform: translate(-50%, -50%) rotate(var(--theta)) translateX(var(--cc-radius));
  transition: transform 350ms cubic-bezier(0.22, 0.8, 0.36, 1);
  transition-delay: calc(var(--wave, 0) * var(--cc-stagger, 60ms));
}

@media (prefers-reduced-motion: reduce) {
  .circle-carousel__card {
    transition-duration: 0.01ms;
    transition-delay: 0ms;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass. Specifically:
- `useRingRotation.test.ts`: 27 tests (20 original + 7 new).
- `CircleCarousel.test.tsx`: 17 tests (14 original + 3 new).
- Total: 44 tests passing across 2 files.

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds with no TS errors.

- [ ] **Step 7: Manual browser verification**

Run: `npm run dev` (in background).

Open `http://localhost:5173`. Verify by eye:
- Press ↓: active card (entering 3 o'clock slot) moves first; cards behind it ripple into motion one after another, the farthest (∼770ms in) last.
- Press ↑: wave reverses direction — cards above the active ripple first.
- Hold ↓: continuous cascade; no visual snap.
- Toggle system "Reduce motion": stagger disappears; cards snap to position instantly.

Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(carousel): stagger rotation transition in direction of motion"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `npm test` — 44 tests pass
- [ ] `npm run build` — clean build
- [ ] `npm run dev` — demo shows staggered ripple on ↑/↓ that reverses direction correctly
- [ ] Reduced-motion system setting disables the ripple
- [ ] Git log shows two new commits: `feat(carousel): track lastDirection in useRingRotation` and `feat(carousel): stagger rotation transition in direction of motion`
