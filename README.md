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
