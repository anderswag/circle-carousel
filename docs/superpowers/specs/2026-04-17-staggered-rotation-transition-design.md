# Staggered Rotation Transition — Design

**Date:** 2026-04-17
**Status:** Approved, ready for implementation plan
**Builds on:** `2026-04-17-vertical-circle-carousel-design.md`

## Summary

When the carousel rotates in response to ↑ / ↓ (or any other rotation trigger), the cards stagger their motion instead of all moving at once. The active card moves first; each card behind it in the direction of the wave starts 60ms later. All cards still use the same 350ms transition duration — only the *start* is delayed, so the effect is a smooth ripple, not a mechanical shuffle.

## Goals

- Visible, deliberate stagger that reads as "the active card pulls the rest along."
- Direction-aware: ↓ and ↑ produce mirror-image waves.
- No animation library; pure CSS `transition-delay` driven by a per-card CSS custom property.
- Respects `prefers-reduced-motion`.

## Non-Goals (this iteration)

- Per-card easing curves.
- Additional visual effects accompanying the stagger (scale/opacity ripple).
- A JSX prop for stagger magnitude (CSS custom property is sufficient).

## Decisions Made During Brainstorming

| Decision | Choice |
|---|---|
| Stagger order | Wave follows rotation direction (option A) |
| Magnitude | 60ms per card (option C — dramatic) |
| Timing model | Same 350ms transition per card; only start is staggered |
| Rapid key presses | New delays apply immediately; CSS transitions interpolate from current visual position |
| Initial mount | No delays (no direction yet) |
| Reduced motion | Both duration and delay collapse to `0.01ms` / `0ms` |
| Customization | Exposed as CSS custom property `--cc-stagger` (default `60ms`); no JSX prop |

## Behavior Specification

For a ring of N items with active index `a` and a rotation event whose direction is `d ∈ {−1, +1}`:

1. Each card `i` has a "CW distance from active": `relative_i = (i − a + N) mod N`, a value in `[0, N−1]`.
2. Each card has a "wave index" based on direction:
   - If `d = +1` (↓ / forward): `waveIndex_i = relative_i`
   - If `d = −1` (↑ / backward): `waveIndex_i = (N − relative_i) mod N`
   In both cases, the active card gets `waveIndex = 0`.
3. Each card's transition delay is `waveIndex_i × --cc-stagger` (default 60ms). So:
   - Active card starts at t = 0
   - Card `waveIndex = 1` starts at t = 60ms
   - Card `waveIndex = N−1` starts at t = (N−1) × 60ms

Each card's transition duration remains 350ms. Total motion span: `(N − 1) × 60ms + 350ms`. For N = 8 this is 770ms.

### Initial Render

Before any rotation has occurred, `lastDirection = 0`. All cards render with `--wave = 0` so their `transition-delay` is 0. This prevents a staggered "entry" animation on mount.

### Rapid Key Presses

CSS `transition` naturally handles interruption. When delays + transform values change mid-transition, cards interpolate from their current computed transform to the new target, with the new delay applying relative to the new change. Result: the ripple shifts coherently without snapping back.

### Reduced Motion

Under `prefers-reduced-motion: reduce`:
- `transition-duration: 0.01ms`
- `transition-delay: 0ms`

Cards snap to position instantly with no stagger.

## Implementation Plan (summary)

### Hook change: `useRingRotation`

Add `lastDirection: 1 | -1 | 0` to the result:
- `0` on mount.
- Set to `+1` after `next()`.
- Set to `-1` after `prev()`.
- For `goTo(target)`, `home()`, `end()`: set to the sign of the computed shortest-path `delta`. If `delta === 0`, leave `lastDirection` unchanged.

Update the `UseRingRotationResult` type to include `lastDirection`.

### Component change: `CircleCarousel`

For each card `i`:
- Compute `relative = mod(i − activeIndex, N)`.
- Compute `waveIndex`:
  - `lastDirection >= 0 ? relative : (N − relative) % N`
  - (Treat mount/`lastDirection = 0` the same as forward — all cards will have `relative = 0` for active, but since `waveIndex = 0` for active we get delay 0 everywhere on first render because no card has moved yet; actually we need `--wave = 0` for every card on mount. Simpler fix: if `lastDirection === 0`, set `--wave = 0` for all cards.)
- Set CSS custom property `--wave` on the card element to `waveIndex`.

### CSS change: `CircleCarousel.css`

```css
.circle-carousel__card {
  /* ...existing transform/position rules... */
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

## Testing

### Hook tests (add to `useRingRotation.test.ts`)

1. `lastDirection` is `0` on mount.
2. `lastDirection` becomes `+1` after `next()`.
3. `lastDirection` becomes `-1` after `prev()`.
4. `lastDirection` becomes `+1` for a short forward `goTo`, `-1` for a short backward `goTo`.
5. `lastDirection` unchanged when `goTo(current)` is called (no-op).
6. `home()` / `end()` update direction to the sign of the shortest-path delta.

### Component tests (add to `CircleCarousel.test.tsx`)

1. Initial mount: every card has `--wave = 0`.
2. After `{ArrowDown}` on 6-item ring: the new active card has `--wave = 0`, the card one CW step away has `--wave = 1`, and the card 5 CW steps away has `--wave = 5`.
3. After `{ArrowUp}` on 6-item ring: the new active card has `--wave = 0`, and the wave reverses (card one CCW step has `--wave = 1`).

## Risks & Open Questions

- **Total motion span scales with N.** For N = 12, total is ≈ 1.02s. Still tolerable; past that the carousel would feel sluggish. Documented as a caveat in the README.
- **CSS `transition-delay` with interruption.** Behavior is well-defined in modern browsers (delay applies from the moment the new transition starts). Verified by interruption test (manual) in the demo.
- **`lastDirection = 0` on mount vs a subtle mount animation.** Forcing every card to `--wave = 0` on mount keeps mount clean. If a future iteration wants a mount ripple, that's a separate feature.
