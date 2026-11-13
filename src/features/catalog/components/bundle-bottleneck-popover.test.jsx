import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import BundleBottleneckPopover from '@/features/catalog/components/bundle-bottleneck-popover';

describe('BundleBottleneckPopover', () => {
  const tableProduct = {
    id: 'prod-table',
    name: 'Mesa Rústica Retangular',
    type: 'rent',
    stock: { quantity: 15, reserved: 3 }, // available = 12
  };

  const cakeProduct = {
    id: 'prod-cake',
    name: 'Bolo Cenográfico Fake',
    type: 'rent',
    stock: { quantity: 8, reserved: 2 }, // available = 6
  };

  const mockBundle = {
    id: 'bundle-test',
    name: 'Kit Provençal Encantada',
    type: 'rent',
    is_bundle: true,
    bundle_items: [
      {
        id: 'bi-1',
        product_id: 'prod-table',
        quantity: 1, // 12 / 1 = 12
        componentProduct: tableProduct,
      },
      {
        id: 'bi-2',
        product_id: 'prod-cake',
        quantity: 2, // 6 / 2 = 3 (bottleneck!)
        componentProduct: cakeProduct,
      },
    ],
  };

  it('renders trigger with dynamic available stock badge', () => {
    render(<BundleBottleneckPopover bundle={mockBundle} />);

    // Available stock = min(12, 3) = 3
    expect(screen.getByText('3 un')).toBeInTheDocument();
  });

  it('opens popover upon clicking the trigger badge and lists components and limiting bottleneck', async () => {
    const user = userEvent.setup();
    render(<BundleBottleneckPopover bundle={mockBundle} />);

    const trigger = screen.getByRole('button', {
      name: /estoque do pacote kit provençal encantada/i,
    });
    await user.click(trigger);

    // Verify popover header
    expect(
      await screen.findByRole('heading', {
        name: /composição & gargalo do pacote/i,
      })
    ).toBeInTheDocument();

    // Verify component names rendered
    expect(screen.getByText('Mesa Rústica Retangular')).toBeInTheDocument();
    expect(screen.getByText('Bolo Cenográfico Fake')).toBeInTheDocument();

    // Verify multiplier text
    expect(screen.getByText(/1 un por pacote/i)).toBeInTheDocument();
    expect(screen.getByText(/2 un por pacote/i)).toBeInTheDocument();

    // Verify bottleneck badge ("Gargalo Limitador") is present only for Bolo Cenográfico
    const bottleneckBadges = screen.getAllByText('Gargalo Limitador');
    expect(bottleneckBadges).toHaveLength(1);
    expect(bottleneckBadges[0]).toBeInTheDocument();
  });

  it('displays empty state when bundle has no components', async () => {
    const user = userEvent.setup();
    const emptyBundle = {
      id: 'b-empty',
      name: 'Pacote Sem Itens',
      is_bundle: true,
      bundle_items: [],
    };

    render(<BundleBottleneckPopover bundle={emptyBundle} />);

    const trigger = screen.getByRole('button', {
      name: /estoque do pacote pacote sem itens/i,
    });
    await user.click(trigger);

    expect(
      await screen.findByText(/nenhum componente configurado neste pacote/i)
    ).toBeInTheDocument();
  });
});
