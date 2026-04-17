# Vertical Circle Carousel — Design

**Date:** 2026-04-17
**Status:** Approved, ready for implementation plan

## Summary

A reusable React component that arranges cards around a face-on circular ring. Cards are oriented radially (each card's "top" points away from the ring center). A single active slot sits at 3 o'clock (right). Pressing ↑ / ↓ snap-rotates the ring by one card-step, wrapping around infinitely.

## Goals

- A reusable, zero-dependency React component suitable as both a demo and a drop-in for real use.
- Caller owns card visual content via a render prop; the component owns ring layout, rotation, and keyboard handling.
- Smooth snap rotation driven entirely by CSS transitions; no animation library.
- Accessible: keyboard operable, correct ARIA, respects `prefers-reduced-motion`.

## Non-Goals (v1)

- Spring / physics-based rotation.
- Entry burst animations or per-card stagger (trivial follow-up if wanted).
- Touch / swipe gestures, mouse-drag rotation, or click-to-activate.
- Visual regression tests.

## Decisions Made During Brainstorming

| Decision | Choice |
|---|---|
| Geometry | Orbit ring, face-on (cards arranged around a circle) |
| Card orientation | Radial — each card's top points outward from center |
| Rotation behavior | Snap one card-step per key press |
| Active slot position | 3 o'clock (right) |
| Item count | Data-driven; 4–12 recommended (dev-mode warning outside range) |
| Card content | Render prop (`renderCard`) |
| Wraparound | Infinite loop |
| Use case | Reusable experiment/demo component |
| Implementation | CSS transforms + React state; no animation library |

## Project Shape

Greenfield Vite + React + TypeScript app.

```
vertical-scroller/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # demo host
│   ├── styles.css                    # demo page styles only
│   └── CircleCarousel/
│       ├── CircleCarousel.tsx
│       ├── CircleCarousel.css
│       ├── useRingRotation.ts
│       └── index.ts
└── README.md
```

The `CircleCarousel/` folder is self-contained and trivially extractable.

## Public API

```tsx
type CircleCarouselProps<T> = {
  items: T[];
  renderCard: (args: {
    item: T;
    index: number;
    isActive: boolean;
  }) => React.ReactNode;
  radius?: number;                               // px, default 220
  cardSize?: { width: number; height: number }; // default 140×180
  startIndex?: number;                           // default 0
  onActiveChange?: (index: number) => void;
  className?: string;
  ariaLabel?: string;                            // default "Circle carousel"
};
```

Generic over `T` so the caller keeps full type safety in `renderCard`.

`renderCard` receives `isActive` so the caller controls active styling entirely. The component itself applies no "active" visual treatment beyond positioning — the demo page shows one suggested style.

## Geometry & Layout

**Ring center:** center of the component bounding box.

**Active position:** 3 o'clock. In screen coordinates, angle 0° points right; angles increase clockwise.

**Per-card angle** for N items and active index `a`:
```
θᵢ = (i − a) × (360° / N)
```
The active card is always at θ = 0°.

**Per-card CSS** — each card is absolutely positioned at the ring center and transformed:
```css
transform: translate(-50%, -50%)
           rotate(var(--theta))
           translateX(var(--radius));
/* No final counter-rotation: card follows the ray, so its top
   points outward (radial orientation). */
```

Cards receive `--theta` and `--radius` as CSS custom properties set by React.

**Rotation via per-card transition (not parent rotation):** when `activeIndex` changes, each card's `--theta` changes by exactly one step, and a CSS transition on `transform` animates the move. This avoids the need to counter-rotate children and keeps the orientation math simple.

**Wraparound / shortest-angle transition:** when moving from index N−1 → 0 (or 0 → N−1), a naïve delta would rotate the long way around. The component computes each card's target θ using a wrap-aware delta so every card moves at most ±(360° / N) per step.

## State, Keyboard & Accessibility

### State

Single `activeIndex: number` via `useState`. No refs for layout.

### Keyboard (via `useRingRotation(itemCount)`)

The component root is `<div role="listbox" tabIndex={0} aria-label={...}>`. Keyboard events fire when focused.

| Key | Action |
|---|---|
| `↑` | activeIndex − 1 (wrap) |
| `↓` | activeIndex + 1 (wrap) |
| `Home` | activeIndex = 0 |
| `End` | activeIndex = N − 1 |

All handled keys call `preventDefault()` to suppress page scroll.

Holding a key relies on native browser key-repeat — each repeat advances one step.

### Focus

Clicking the component focuses it. Focus-visible outline via CSS so keyboard users see when it's active.

### ARIA

- Container: `role="listbox"`, `aria-label`, `aria-activedescendant` = id of active card.
- Each card: `role="option"`, `aria-selected={isActive}`, unique id.
- No `aria-live` announcements in v1; caller can add richer announcements via `onActiveChange`.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` collapses the transform transition to `0.01ms` — cards snap instantly. Handled purely in CSS.

### Edge cases

- `items.length === 0` → render empty (no ring).
- `items.length === 1` → render the single card; arrow keys no-op.
- `items.length` changes while mounted → clamp `activeIndex` into range in a `useEffect`.

## Visual Defaults

Component styles (in `CircleCarousel.css`) are minimal:

- Ring container sized `2·radius` square.
- Per-card `transform` transition: `350ms cubic-bezier(.22,.8,.36,1)`.
- Focus-visible outline on container.
- Reduced-motion override.

The **demo page** provides a polished baseline:

- Dark backdrop, carousel centered.
- 8 sample items (title + short description + per-card gradient).
- `renderCard` applies `isActive ? 'card card--active' : 'card'`:
  - Base card: subtle border, faint shadow, `opacity: 0.75`.
  - Active card: `opacity: 1`, `scale(1.08)`, stronger shadow, accent border. Transitioned so the effect animates smoothly as rotation lands.
- A small hint label under the carousel: `↑ ↓ to rotate`.

## Testing

- **Manual browser test** (primary): run dev server, focus the carousel, verify snap rotation, wraparound, radial orientation, active styling, and reduced-motion behavior.
- **Unit tests (Vitest + React Testing Library)** for `useRingRotation`:
  - ↑ decrements and wraps at 0.
  - ↓ increments and wraps at N − 1.
  - `Home` / `End` jump correctly.
  - No-op when `itemCount` is 0 or 1.
  - `onActiveChange` fires with the new index.
- **Component render test**: asserts N cards render with correct `aria-selected` on the active one after a simulated key press (`@testing-library/user-event`).
- No visual regression tests in v1.

## Risks & Open Questions

- Radial orientation at 3 o'clock means the active card's text is rotated 90° (reading requires head tilt). This is a deliberate aesthetic choice per the "bursting in each direction" requirement. Callers who want upright text can counter-rotate inside `renderCard`.
- With very small N (e.g., 3), card spacing is wide and the ring feels sparse. Dev-mode warning for N outside 4–12 addresses this.
- With very large N (e.g., 20+), adjacent cards may overlap depending on `radius` / `cardSize`. Caller tunes these.
