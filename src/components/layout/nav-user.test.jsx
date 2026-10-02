import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import NavUser from '@/components/layout/nav-user';
import { SidebarProvider } from '@/components/ui/sidebar';

describe('NavUser Component', () => {
  const mockUser = {
    id: 'u1',
    name: 'Carlos Oliveira',
    firstName: 'Carlos',
    lastName: 'Oliveira',
    first_name: 'Carlos',
    last_name: 'Oliveira',
    email: 'carlos@example.com',
  };

  it('renders user details correctly from normalized user', () => {
    const mockSignout = vi.fn();

    render(
      <MemoryRouter>
        <SidebarProvider>
          <NavUser user={mockUser} signout={mockSignout} />
        </SidebarProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('carlos@example.com')).toBeInTheDocument();
  });

  it('triggers signout callback when clicking signout option', () => {
    const mockSignout = vi.fn();

    render(
      <MemoryRouter>
        <SidebarProvider>
          <NavUser user={mockUser} signout={mockSignout} />
        </SidebarProvider>
      </MemoryRouter>
    );

    // Open dropdown menu
    const trigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(trigger);

    // Click 'Sair'
    const signoutButton = screen.getByRole('menuitem', { name: /sair/i });
    fireEvent.click(signoutButton);

    expect(mockSignout).toHaveBeenCalledTimes(1);
  });
});
