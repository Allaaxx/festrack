import { render, screen } from '@testing-library/react';
import { CheckCircle2Icon } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from '@/components/ui/timeline';

describe('Timeline Component Primitive', () => {
  it('renders a full timeline structure with items and contents', () => {
    render(
      <Timeline data-testid="timeline">
        <TimelineItem data-testid="timeline-item-1">
          <TimelineDot variant="primary" data-testid="dot-1" />
          <TimelineConnector data-testid="connector-1" />
          <TimelineContent data-testid="content-1">
            <TimelineTitle>Item 1 Criado</TimelineTitle>
            <TimelineTime dateTime="2026-11-12T10:00:00Z">10:00</TimelineTime>
            <TimelineDescription>
              Descrição do primeiro item na timeline
            </TimelineDescription>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem data-testid="timeline-item-2">
          <TimelineDot variant="success" data-testid="dot-2" />
          <TimelineContent data-testid="content-2">
            <TimelineTitle>Item 2 Concluído</TimelineTitle>
            <TimelineTime>11:30</TimelineTime>
            <TimelineDescription>
              Finalização do processo de locação
            </TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    );

    const timeline = screen.getByTestId('timeline');
    expect(timeline).toBeInTheDocument();
    expect(timeline).toHaveAttribute('data-slot', 'timeline');

    const item1 = screen.getByTestId('timeline-item-1');
    expect(item1).toBeInTheDocument();
    expect(item1).toHaveAttribute('data-slot', 'timeline-item');

    const connector1 = screen.getByTestId('connector-1');
    expect(connector1).toBeInTheDocument();
    expect(connector1).toHaveAttribute('data-slot', 'timeline-connector');

    expect(screen.getByText('Item 1 Criado')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(
      screen.getByText('Descrição do primeiro item na timeline')
    ).toBeInTheDocument();

    expect(screen.getByText('Item 2 Concluído')).toBeInTheDocument();
    expect(screen.getByText('11:30')).toBeInTheDocument();
    expect(
      screen.getByText('Finalização do processo de locação')
    ).toBeInTheDocument();
  });

  it('supports visual variants on TimelineDot', () => {
    const { rerender } = render(
      <TimelineDot variant="default" data-testid="dot" />
    );
    let dot = screen.getByTestId('dot');
    expect(dot).toHaveAttribute('data-slot', 'timeline-dot');
    expect(dot).toHaveAttribute('data-variant', 'default');
    expect(dot).toHaveClass('border-border');

    rerender(<TimelineDot variant="primary" data-testid="dot" />);
    dot = screen.getByTestId('dot');
    expect(dot).toHaveAttribute('data-variant', 'primary');
    expect(dot).toHaveClass('bg-primary');

    rerender(<TimelineDot variant="success" data-testid="dot" />);
    dot = screen.getByTestId('dot');
    expect(dot).toHaveAttribute('data-variant', 'success');
    expect(dot).toHaveClass('bg-emerald-500');

    rerender(<TimelineDot variant="destructive" data-testid="dot" />);
    dot = screen.getByTestId('dot');
    expect(dot).toHaveAttribute('data-variant', 'destructive');
    expect(dot).toHaveClass('bg-destructive');

    rerender(<TimelineDot variant="warning" data-testid="dot" />);
    dot = screen.getByTestId('dot');
    expect(dot).toHaveAttribute('data-variant', 'warning');
    expect(dot).toHaveClass('bg-amber-500');
  });

  it('supports visual variants on TimelineConnector', () => {
    const { rerender } = render(
      <TimelineConnector variant="default" data-testid="connector" />
    );
    let connector = screen.getByTestId('connector');
    expect(connector).toHaveClass('bg-border');

    rerender(<TimelineConnector variant="primary" data-testid="connector" />);
    connector = screen.getByTestId('connector');
    expect(connector).toHaveClass('bg-primary');

    rerender(<TimelineConnector variant="success" data-testid="connector" />);
    connector = screen.getByTestId('connector');
    expect(connector).toHaveClass('bg-emerald-500');

    rerender(
      <TimelineConnector variant="destructive" data-testid="connector" />
    );
    connector = screen.getByTestId('connector');
    expect(connector).toHaveClass('bg-destructive');

    rerender(<TimelineConnector variant="warning" data-testid="connector" />);
    connector = screen.getByTestId('connector');
    expect(connector).toHaveClass('bg-amber-500');
  });

  it('renders custom icons and children inside TimelineDot', () => {
    render(
      <TimelineDot variant="success" data-testid="custom-dot">
        <CheckCircle2Icon data-testid="custom-icon" className="size-4" />
      </TimelineDot>
    );

    const dot = screen.getByTestId('custom-dot');
    expect(dot).toBeInTheDocument();
    const icon = screen.getByTestId('custom-icon');
    expect(icon).toBeInTheDocument();
    expect(dot).toContainElement(icon);
  });

  it('supports Base UI render prop for custom element composition without asChild', () => {
    render(
      <Timeline>
        <TimelineItem render={<div role="article" />}>
          <TimelineContent>
            <TimelineTitle render={<h4 />}>Título Customizado H4</TimelineTitle>
            <TimelineTime render={<span />}>Hoje</TimelineTime>
            <TimelineDescription render={<blockquote />}>
              Citação na descrição
            </TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    );

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(article).toHaveAttribute('data-slot', 'timeline-item');

    const h4 = screen.getByRole('heading', { level: 4 });
    expect(h4).toHaveTextContent('Título Customizado H4');
    expect(h4).toHaveAttribute('data-slot', 'timeline-title');

    const blockquote = screen.getByText('Citação na descrição');
    expect(blockquote.tagName).toBe('BLOCKQUOTE');
    expect(blockquote).toHaveAttribute('data-slot', 'timeline-description');
  });
});
