import { CircleCarousel } from './CircleCarousel';
import poster1 from './movie_posters_mock/File_1,081.png';
import poster2 from './movie_posters_mock/File_1,145.png';
import poster3 from './movie_posters_mock/File_1,146.png';
import poster4 from './movie_posters_mock/File_1,540.png';
import poster5 from './movie_posters_mock/IMG_3701.JPG';

type DemoItem = {
  id: number;
  title: string;
  description: string;
  poster: string;
};

const posters = [poster1, poster2, poster3, poster4, poster5];

const demoMeta = [
  { title: 'Aurora',   description: 'Northern lights' },
  { title: 'Ember',    description: 'Slow-burning' },
  { title: 'Meridian', description: 'Zenith crossing' },
  { title: 'Drift',    description: 'Currents, unseen' },
  { title: 'Quartz',   description: 'Crystalline' },
  { title: 'Hollow',   description: 'Resonant void' },
  { title: 'Tessera',  description: 'Small mosaics' },
  { title: 'Cinder',   description: 'What remains' },
  { title: 'Lumen',    description: 'Measured light' },
  { title: 'Basalt',   description: 'Volcanic stone' },
  { title: 'Sable',    description: 'Deep shadow' },
];

const demoItems: DemoItem[] = demoMeta.map((m, i) => ({
  id: i,
  title: m.title,
  description: m.description,
  poster: posters[i % posters.length],
}));

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
              style={{ backgroundImage: `url(${item.poster})` }}
            />
          )}
        />
      </div>
    </main>
  );
}
