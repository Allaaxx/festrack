import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ToastIcon } from '@/components/ui/toast';

describe('ToastIcon', () => {
  it('renders minimalist semantic icon styles', () => {
    const { container: successContainer } = render(
      <ToastIcon type="success" />
    );
    expect(
      successContainer.querySelector('svg.text-primary')
    ).toBeInTheDocument();

    const { container: errorContainer } = render(<ToastIcon type="error" />);
    expect(
      errorContainer.querySelector('svg.text-destructive')
    ).toBeInTheDocument();

    const { container: infoContainer } = render(<ToastIcon type="info" />);
    expect(
      infoContainer.querySelector('svg.text-muted-foreground')
    ).toBeInTheDocument();

    const { container: warningContainer } = render(
      <ToastIcon type="warning" />
    );
    expect(
      warningContainer.querySelector('svg.text-foreground')
    ).toBeInTheDocument();
  });
});
