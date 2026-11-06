import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import Header from '@/components/layout/header';
import { SidebarProvider } from '@/components/ui/sidebar';

const renderHeader = (initialEntry = '/events') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SidebarProvider>
        <Header />
      </SidebarProvider>
    </MemoryRouter>
  );
};

describe('Header', () => {
  it('renders dynamic breadcrumbs for /events', () => {
    renderHeader('/events');

    expect(
      screen.getByRole('navigation', { name: 'breadcrumb' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Festrack' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByText('Eventos')).toBeInTheDocument();
  });

  it('renders dynamic breadcrumbs for /events/:eventId', () => {
    renderHeader('/events/event-123');

    expect(screen.getByRole('link', { name: 'Festrack' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('link', { name: 'Eventos' })).toHaveAttribute(
      'href',
      '/events'
    );
    expect(screen.getByText('Detalhes do Evento')).toBeInTheDocument();
  });

  it('renders dynamic breadcrumbs for /finances', () => {
    renderHeader('/finances');

    expect(screen.getByRole('link', { name: 'Festrack' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByText('Finanças')).toBeInTheDocument();
  });

  it('renders dynamic breadcrumbs for /settings', () => {
    renderHeader('/settings');

    expect(screen.getByRole('link', { name: 'Festrack' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });
});
