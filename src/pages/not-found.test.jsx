import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import NotFoundPage from '@/pages/not-found';

describe('NotFoundPage', () => {
  it('renders 404 code, friendly Portuguese message and back to home button', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Página não encontrada')).toBeInTheDocument();
    expect(
      screen.getByText(/O endereço que você tentou acessar não existe/i)
    ).toBeInTheDocument();

    const homeButton = screen.getByRole('button', {
      name: /voltar para o início/i,
    });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute('href', '/');
  });
});
