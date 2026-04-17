# Vertical Circle Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable React component that arranges cards around a face-on circular ring (active card at 3 o'clock), snap-rotates one step per ↑/↓ key press, wraps infinitely, and uses pure CSS transforms for animation.

**Architecture:** Greenfield Vite + React + TypeScript app. A `useRingRotation` hook owns rotation state and keyboard handling. A `CircleCarousel` component arranges items via per-card CSS custom properties (`--theta`, `--radius`) and lets callers supply card contents via a `renderCard` render prop. Rotation uses a monotonic `rotationUnits` counter so adjacent-step CSS transitions always take the shortest visual path (no long-way wrap).

**Tech Stack:** Vite 7, React 19, TypeScript 5, Vitest 3, @testing-library/react, @testing-library/user-event, jsdom.

---

## File Structure

To be created:

```
vertical-scroller/
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md
├── src/
│   ├── main.tsx                                # app entry
│   ├── App.tsx                                 # demo host
│   ├── styles.css                              # demo page styles
│   ├── test-setup.ts                           # RTL jsdom setup
│   └── CircleCarousel/
│       ├── index.ts                            # public barrel
│       ├── CircleCarousel.tsx                  # component
│       ├── CircleCarousel.css                  # ring/card layout + transitions
│       ├── CircleCarousel.test.tsx             # component tests
│       ├── useRingRotation.ts                  # rotation + keyboard hook
│       └── useRingRotation.test.ts             # hook tests
```

**File responsibilities:**

- `useRingRotation.ts` — rotation state (`rotationUnits` counter), derived `activeIndex`, navigation functions, keyboard handler. No DOM, no rendering.
- `CircleCarousel.tsx` — renders the ring, maps items to positioned cards, wires hook to DOM events, exposes API. No rotation math beyond angle-per-card.
- `CircleCarousel.css` — all layout and transition CSS for the component (ring sizing, card positioning via transforms, focus outline, reduced-motion override).
- `App.tsx` + `styles.css` — demo page only; not published as part of the component.

---

## Task 1: Scaffold Vite + React + TS project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

Run: `git init && git branch -M main`

- [ ] **Step 2: Create `.gitignore`**

```
node_modules
dist
.superpowers
.DS_Store
*.log
coverage
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "vertical-scroller",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^7.0.0"
  }
}
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: Create `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
  },
});
```

- [ ] **Step 7: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Circle Carousel</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Create placeholder `src/App.tsx`**

```tsx
export function App() {
  return <div>Circle carousel — stub</div>;
}
```

- [ ] **Step 10: Create placeholder `src/styles.css`**

```css
body { margin: 0; font-family: system-ui, sans-serif; }
```

- [ ] **Step 11: Install deps and verify dev server**

Run: `npm install`
Run: `npm run dev` (in background), then `curl -s http://localhost:5173 | head -20`
Expected: HTML with `<div id="root">` visible. Kill the dev server.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS project"
```

---

## Task 2: Add Vitest + Testing Library setup

**Files:**
- Modify: `package.json` (add test deps)
- Create: `src/test-setup.ts`
- Create: `src/CircleCarousel/sanity.test.ts` (temporary, deleted after verification)

- [ ] **Step 1: Install test dependencies**

Run:
```bash
npm install -D vitest@^3.0.0 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 3: Create a sanity test to confirm setup works**

Create `src/CircleCarousel/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run the sanity test**

Run: `npm test`
Expected: 1 test passes, exit code 0.

- [ ] **Step 5: Delete the sanity test file**

Run: `rm src/CircleCarousel/sanity.test.ts`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add Vitest + Testing Library setup"
```

---

## Task 3: Implement `useRingRotation` hook (TDD)

**Files:**
- Create: `src/CircleCarousel/useRingRotation.test.ts`
- Create: `src/CircleCarousel/useRingRotation.ts`

The hook owns rotation state. It tracks a monotonic `rotationUnits` counter (so visual transitions always take the short path) and derives `activeIndex` as `rotationUnits mod itemCount`.

- [ ] **Step 1: Write the failing tests**

Create `src/CircleCarousel/useRingRotation.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — "Cannot find module './useRingRotation'".

- [ ] **Step 3: Implement the hook**

Create `src/CircleCarousel/useRingRotation.ts`:

```ts
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
  const end = useCallback(() => {
    if (itemCount <= 1) return;
    goTo(itemCount - 1);
  }, [goTo, itemCount]);

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All `useRingRotation` tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(carousel): add useRingRotation hook with keyboard + wraparound"
```

---

## Task 4: Implement `CircleCarousel` component (TDD)

**Files:**
- Create: `src/CircleCarousel/CircleCarousel.test.tsx`
- Create: `src/CircleCarousel/CircleCarousel.tsx`
- Create: `src/CircleCarousel/CircleCarousel.css`
- Create: `src/CircleCarousel/index.ts`

- [ ] **Step 1: Write the failing component tests**

Create `src/CircleCarousel/CircleCarousel.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CircleCarousel } from './CircleCarousel';

type Item = { id: number; label: string };
const items: Item[] = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  label: `Item ${i}`,
}));

const renderCard = ({ item, isActive }: { item: Item; isActive: boolean }) => (
  <div data-testid={`card-${item.id}`} data-active={isActive}>
    {item.label}
  </div>
);

describe('CircleCarousel', () => {
  it('renders one card per item', () => {
    render(<CircleCarousel items={items} renderCard={renderCard} />);
    for (const item of items) {
      expect(screen.getByTestId(`card-${item.id}`)).toBeInTheDocument();
    }
  });

  it('marks the first item as active by default', () => {
    render(<CircleCarousel items={items} renderCard={renderCard} />);
    expect(screen.getByTestId('card-0').dataset.active).toBe('true');
    expect(screen.getByTestId('card-1').dataset.active).toBe('false');
  });

  it('respects startIndex', () => {
    render(
      <CircleCarousel items={items} renderCard={renderCard} startIndex={3} />,
    );
    expect(screen.getByTestId('card-3').dataset.active).toBe('true');
  });

  it('sets role=listbox with aria-activedescendant on the active card', () => {
    render(<CircleCarousel items={items} renderCard={renderCard} />);
    const listbox = screen.getByRole('listbox');
    const activeId = listbox.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    const activeOption = document.getElementById(activeId!);
    expect(activeOption).toHaveAttribute('aria-selected', 'true');
  });

  it('each card has role=option with aria-selected reflecting active state', () => {
    render(<CircleCarousel items={items} renderCard={renderCard} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(6);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    for (let i = 1; i < options.length; i++) {
      expect(options[i]).toHaveAttribute('aria-selected', 'false');
    }
  });

  it('ArrowDown advances the active card', async () => {
    const user = userEvent.setup();
    render(<CircleCarousel items={items} renderCard={renderCard} />);
    const listbox = screen.getByRole('listbox');
    listbox.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTestId('card-1').dataset.active).toBe('true');
  });

  it('ArrowUp moves backward and wraps', async () => {
    const user = userEvent.setup();
    render(<CircleCarousel items={items} renderCard={renderCard} />);
    const listbox = screen.getByRole('listbox');
    listbox.focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByTestId('card-5').dataset.active).toBe('true');
  });

  it('calls onActiveChange when the active card changes', async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    render(
      <CircleCarousel
        items={items}
        renderCard={renderCard}
        onActiveChange={onActiveChange}
      />,
    );
    const listbox = screen.getByRole('listbox');
    listbox.focus();
    await user.keyboard('{ArrowDown}');
    expect(onActiveChange).toHaveBeenLastCalledWith(1);
  });

  it('assigns theta CSS var to each card based on offset from active', () => {
    const { container } = render(
      <CircleCarousel items={items} renderCard={renderCard} />,
    );
    const options = container.querySelectorAll<HTMLElement>(
      '.circle-carousel__card',
    );
    const step = 360 / items.length;
    options.forEach((el, i) => {
      const theta = (i - 0) * step; // active = 0, rotationUnits = 0
      expect(el.style.getPropertyValue('--theta')).toBe(`${theta}deg`);
    });
  });

  it('renders nothing interactive when items is empty', () => {
    render(<CircleCarousel items={[]} renderCard={renderCard} />);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('uses a custom ariaLabel when provided', () => {
    render(
      <CircleCarousel
        items={items}
        renderCard={renderCard}
        ariaLabel="Project ring"
      />,
    );
    expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-label',
      'Project ring',
    );
  });
});
```

- [ ] **Step 2: Run the component tests to verify they fail**

Run: `npm test`
Expected: FAIL — "Cannot find module './CircleCarousel'".

- [ ] **Step 3: Create `src/CircleCarousel/CircleCarousel.tsx`**

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
  const { activeIndex, rotationUnits, onKeyDown } = useRingRotation(
    items.length,
    { startIndex, onActiveChange },
  );

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
          const cardStyle: CSSProperties = {
            ['--theta' as string]: `${theta}deg`,
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

- [ ] **Step 4: Create `src/CircleCarousel/CircleCarousel.css`**

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
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .circle-carousel__card {
    transition-duration: 0.01ms;
  }
}
```

- [ ] **Step 5: Create `src/CircleCarousel/index.ts`**

```ts
export { CircleCarousel } from './CircleCarousel';
export type { CircleCarouselProps, RenderCardArgs } from './CircleCarousel';
export { useRingRotation } from './useRingRotation';
export type {
  UseRingRotationOptions,
  UseRingRotationResult,
} from './useRingRotation';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: All `CircleCarousel` and `useRingRotation` tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(carousel): add CircleCarousel component with ring layout"
```

---

## Task 5: Build demo page

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Replace `src/App.tsx` with the demo**

```tsx
import { CircleCarousel } from './CircleCarousel';

type DemoItem = {
  id: number;
  title: string;
  description: string;
  gradient: string;
};

const demoItems: DemoItem[] = [
  { id: 0, title: 'Aurora',    description: 'Northern lights',  gradient: 'linear-gradient(135deg, #7c5cff, #22d3ee)' },
  { id: 1, title: 'Ember',     description: 'Slow-burning',     gradient: 'linear-gradient(135deg, #f472b6, #fb923c)' },
  { id: 2, title: 'Meridian',  description: 'Zenith crossing',  gradient: 'linear-gradient(135deg, #34d399, #60a5fa)' },
  { id: 3, title: 'Drift',     description: 'Currents, unseen', gradient: 'linear-gradient(135deg, #fbbf24, #ef4444)' },
  { id: 4, title: 'Quartz',    description: 'Crystalline',      gradient: 'linear-gradient(135deg, #a78bfa, #f472b6)' },
  { id: 5, title: 'Hollow',    description: 'Resonant void',    gradient: 'linear-gradient(135deg, #10b981, #0ea5e9)' },
  { id: 6, title: 'Tessera',   description: 'Small mosaics',    gradient: 'linear-gradient(135deg, #e879f9, #8b5cf6)' },
  { id: 7, title: 'Cinder',    description: 'What remains',     gradient: 'linear-gradient(135deg, #f97316, #facc15)' },
];

export function App() {
  return (
    <main className="demo">
      <h1 className="demo__title">Circle Carousel</h1>
      <p className="demo__hint">↑ ↓ to rotate · click to focus</p>
      <div className="demo__stage">
        <CircleCarousel
          items={demoItems}
          ariaLabel="Demo gallery"
          renderCard={({ item, isActive }) => (
            <div
              className={`demo-card${isActive ? ' demo-card--active' : ''}`}
              style={{ backgroundImage: item.gradient }}
            >
              <div className="demo-card__label">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          )}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Replace `src/styles.css` with demo styles**

```css
* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: radial-gradient(1200px 800px at 50% 40%, #1a1b2e 0%, #0b0b10 70%);
  color: #e6e6ee;
  min-height: 100vh;
}

.demo {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto auto 1fr;
  place-items: center;
  padding: 48px 24px;
  gap: 8px;
  color: inherit;
}

.demo__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-size: 28px;
}

.demo__hint {
  margin: 0;
  color: #9aa0b4;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.demo__stage {
  display: grid;
  place-items: center;
  width: 100%;
}

.demo-card {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  opacity: 0.72;
  transition: opacity 300ms ease, transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease;
  overflow: hidden;
  position: relative;
}

.demo-card--active {
  opacity: 1;
  transform: scale(1.08);
  border-color: rgba(255, 255, 255, 0.55);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.15);
}

.demo-card__label {
  position: absolute;
  inset: auto 12px 12px 12px;
  background: rgba(10, 10, 18, 0.45);
  backdrop-filter: blur(6px);
  padding: 10px 12px;
  border-radius: 8px;
  color: #fff;
}

.demo-card__label h3 {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.demo-card__label p {
  margin: 0;
  font-size: 11px;
  color: #c7cbe0;
}
```

- [ ] **Step 3: Manual browser verification**

Run: `npm run dev` (in background)

Open `http://localhost:5173` in a browser. Verify:
- 8 cards arranged around a ring, active card at 3 o'clock slightly larger and more opaque.
- Clicking the carousel focuses it; a focus outline appears.
- Pressing ↓ rotates one step clockwise (next card comes from below); ↑ rotates the other way.
- Holding ↓ auto-repeats.
- Wrap works: past the last card you land on the first.
- Each card's content is rotated to point outward (text reads on an angle).
- Toggling system "Reduce motion" makes transitions effectively instant.

Stop the dev server once verified.

- [ ] **Step 4: Run build to verify production bundle**

Run: `npm run build`
Expected: Build succeeds, outputs `dist/`.

- [ ] **Step 5: Run all tests one more time**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add demo page exercising CircleCarousel"
```

---

## Task 6: Add README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Circle Carousel

A small React component: 4–12 cards arranged around a ring, active card at 3 o'clock, snap-rotation via ↑/↓.

## Quick start

    npm install
    npm run dev

Open http://localhost:5173. Click the carousel, then use ↑ / ↓.

## Usage

```tsx
import { CircleCarousel } from './CircleCarousel';

<CircleCarousel
  items={projects}
  renderCard={({ item, isActive }) => (
    <div className={isActive ? 'card card--active' : 'card'}>
      <h3>{item.title}</h3>
    </div>
  )}
/>
```

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | `T[]` | — | 4–12 recommended |
| `renderCard` | `(args) => ReactNode` | — | `args` = `{ item, index, isActive }` |
| `radius` | `number` | `220` | Ring radius in px |
| `cardSize` | `{ width, height }` | `140×180` | Card dimensions in px |
| `startIndex` | `number` | `0` | Initial active index |
| `onActiveChange` | `(index) => void` | — | Called when active changes |
| `className` | `string` | — | Root class |
| `ariaLabel` | `string` | `"Circle carousel"` | Listbox label |

### Keyboard

| Key | Action |
|---|---|
| ↑ | Previous (wraps) |
| ↓ | Next (wraps) |
| Home | First item |
| End | Last item |

## Scripts

    npm run dev      # Vite dev server
    npm run build    # Production build
    npm test         # Vitest
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `npm test` — all tests pass
- [ ] `npm run build` — builds cleanly
- [ ] `npm run dev` — demo runs at `http://localhost:5173`, keyboard rotation works, wraparound works, active card is styled, focus outline shows, reduced-motion respects system setting
- [ ] Git log shows one commit per task
