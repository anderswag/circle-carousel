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
