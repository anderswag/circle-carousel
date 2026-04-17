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
