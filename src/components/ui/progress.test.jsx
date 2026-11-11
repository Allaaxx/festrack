import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Progress } from '@/components/ui/progress';

describe('Progress Component', () => {
  it('renders a progressbar with value and max', () => {
    render(<Progress value={45} max={100} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '45');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders custom children when provided', () => {
    render(
      <Progress value={80}>
        <div data-testid="custom-indicator">Custom</div>
      </Progress>
    );

    expect(screen.getByTestId('custom-indicator')).toBeInTheDocument();
  });
});
