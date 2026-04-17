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

  it('updates --theta values after ArrowDown navigation', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CircleCarousel items={items} renderCard={renderCard} />,
    );
    screen.getByRole('listbox').focus();
    await user.keyboard('{ArrowDown}');
    const step = 360 / items.length;
    const cards = container.querySelectorAll<HTMLElement>(
      '.circle-carousel__card',
    );
    // rotationUnits is now 1; item 1 should have theta=0
    expect(cards[1].style.getPropertyValue('--theta')).toBe('0deg');
    // item 0 should have moved back by one step
    expect(cards[0].style.getPropertyValue('--theta')).toBe(`${-step}deg`);
  });

  it('updates aria-activedescendant after navigation', async () => {
    const user = userEvent.setup();
    render(<CircleCarousel items={items} renderCard={renderCard} />);
    const listbox = screen.getByRole('listbox');
    listbox.focus();
    await user.keyboard('{ArrowDown}');
    const activeId = listbox.getAttribute('aria-activedescendant');
    const activeOption = document.getElementById(activeId!);
    expect(activeOption).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('card-1').dataset.active).toBe('true');
  });

  it('End key jumps to last item', async () => {
    const user = userEvent.setup();
    render(<CircleCarousel items={items} renderCard={renderCard} />);
    screen.getByRole('listbox').focus();
    await user.keyboard('{End}');
    expect(screen.getByTestId('card-5').dataset.active).toBe('true');
  });

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
});
