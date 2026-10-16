import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import AuthSplitLayout from '@/components/layout/auth-split-layout';

describe('AuthSplitLayout', () => {
  it('renders children within default max-w-sm container', () => {
    render(
      <MemoryRouter>
        <AuthSplitLayout>
          <div data-testid="auth-child">Test Content</div>
        </AuthSplitLayout>
      </MemoryRouter>
    );

    const child = screen.getByTestId('auth-child');
    expect(child).toBeInTheDocument();
    expect(child.parentElement).toHaveClass('max-w-sm');
  });

  it('renders children within custom maxWidth container', () => {
    render(
      <MemoryRouter>
        <AuthSplitLayout maxWidth="max-w-md">
          <div data-testid="auth-child">Test Content</div>
        </AuthSplitLayout>
      </MemoryRouter>
    );

    const child = screen.getByTestId('auth-child');
    expect(child).toBeInTheDocument();
    expect(child.parentElement).toHaveClass('max-w-md');
  });

  it('renders brand header linking to root', () => {
    render(
      <MemoryRouter>
        <AuthSplitLayout>
          <div>Child</div>
        </AuthSplitLayout>
      </MemoryRouter>
    );

    const brandLink = screen.getByRole('link', { name: /festrack/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('renders theme-adaptive hero cover images', () => {
    render(
      <MemoryRouter>
        <AuthSplitLayout>
          <div>Child</div>
        </AuthSplitLayout>
      </MemoryRouter>
    );

    const coverImages = screen.getAllByAltText('Festrack');
    expect(coverImages).toHaveLength(2);
    expect(coverImages[0]).toHaveAttribute('src', '/auth-cover-white.jpg');
    expect(coverImages[1]).toHaveAttribute('src', '/auth-cover-black.jpg');
  });
});
