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
