import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_EVENT_TAGS,
  EventTagFilterDropdown,
} from '@/features/events/components/event-tag-filter-dropdown';

describe('EventTagFilterDropdown (#132)', () => {
  const defaultProps = {
    showAllTags: true,
    selectedTags: [],
    tagOptions: [
      ...DEFAULT_EVENT_TAGS,
      { value: 'custom-tag', label: 'Custom Tag', dotClass: 'bg-indigo-400' },
    ],
    onSetShowAllTags: vi.fn(),
    onToggleTagFilter: vi.fn(),
    onAddTagOption: vi.fn(),
    onRemoveTagOption: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button with aria-label and opens menu on click', async () => {
    const user = userEvent.setup();
    render(<EventTagFilterDropdown {...defaultProps} />);

    const trigger = screen.getByRole('button', {
      name: /filtro de etiquetas/i,
    });
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByText('Filtro de etiquetas')).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Família')).toBeInTheDocument();
    expect(screen.getByText('Negócios')).toBeInTheDocument();
    expect(screen.getByText('Pessoal')).toBeInTheDocument();
    expect(screen.getByText('Feriado')).toBeInTheDocument();
    expect(screen.getByText('Outros')).toBeInTheDocument();
    expect(screen.getByText('Custom Tag')).toBeInTheDocument();
  });

  it('invokes onSetShowAllTags when clicking Todas', async () => {
    const user = userEvent.setup();
    render(<EventTagFilterDropdown {...defaultProps} showAllTags={false} />);

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );
    const todasOption = await screen.findByText('Todas');
    await user.click(todasOption);

    expect(defaultProps.onSetShowAllTags).toHaveBeenCalledWith(true);
  });

  it('invokes onToggleTagFilter when selecting a tag option', async () => {
    const user = userEvent.setup();
    render(
      <EventTagFilterDropdown
        {...defaultProps}
        showAllTags={false}
        selectedTags={['family']}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );
    const negocioOption = await screen.findByText('Negócios');
    await user.click(negocioOption);

    expect(defaultProps.onToggleTagFilter).toHaveBeenCalledWith(
      'business',
      true
    );
  });

  it('adds a new custom tag when typing in input and clicking add button', async () => {
    const user = userEvent.setup();
    render(<EventTagFilterDropdown {...defaultProps} />);

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );

    const input = await screen.findByPlaceholderText('Nova etiqueta...');
    await user.type(input, 'Viagens');

    const addBtn = screen.getByRole('button', { name: /adicionar etiqueta/i });
    await user.click(addBtn);

    expect(defaultProps.onAddTagOption).toHaveBeenCalledWith('Viagens');
  });

  it('renders trash button only for non-default tags and invokes onRemoveTagOption', async () => {
    const user = userEvent.setup();
    render(<EventTagFilterDropdown {...defaultProps} />);

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );

    const removeBtn = await screen.findByRole('button', {
      name: /remover etiqueta custom tag/i,
    });
    expect(removeBtn).toBeInTheDocument();

    // Default tag should not have a remove button
    expect(
      screen.queryByRole('button', { name: /remover etiqueta família/i })
    ).not.toBeInTheDocument();

    await user.click(removeBtn);
    expect(defaultProps.onRemoveTagOption).toHaveBeenCalledWith(
      'custom-tag',
      undefined
    );
  });

  it('renders trash button inside the tag row to the left of the checkmark indicator (#144)', async () => {
    const user = userEvent.setup();
    const onRemoveTagOption = vi.fn();
    const onToggleTagFilter = vi.fn();

    render(
      <EventTagFilterDropdown
        tagOptions={[
          ...DEFAULT_EVENT_TAGS,
          {
            id: 'tag-123',
            value: 'custom-tag',
            label: 'Custom Tag',
            dotClass: 'bg-indigo-400',
            isSystem: false,
          },
        ]}
        onRemoveTagOption={onRemoveTagOption}
        onToggleTagFilter={onToggleTagFilter}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );

    const removeBtn = await screen.findByRole('button', {
      name: /remover etiqueta custom tag/i,
    });
    const checkboxItem = screen.getByRole('menuitemcheckbox', {
      name: /custom tag/i,
    });

    // Trash button is inside the tag row
    expect(checkboxItem).toContainElement(removeBtn);

    // Trash button is positioned to the left of the checkmark indicator
    const indicator = checkboxItem.querySelector(
      '[data-slot="tag-picker-indicator"]'
    );
    expect(indicator).toBeInTheDocument();
    expect(removeBtn.compareDocumentPosition(indicator)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );

    // Clicking trash invokes onRemoveTagOption without toggling checkbox
    await user.click(removeBtn);
    expect(onRemoveTagOption).toHaveBeenCalledWith('custom-tag', 'tag-123');
    expect(onToggleTagFilter).not.toHaveBeenCalled();
  });

  it('supports canonical domain naming props (tagOptions, onToggleTagFilter, etc.)', async () => {
    const user = userEvent.setup();
    const onSetShowAllTags = vi.fn();
    const onToggleTagFilter = vi.fn();
    const onAddTagOption = vi.fn();
    const onRemoveTagOption = vi.fn();

    render(
      <EventTagFilterDropdown
        showAllTags={false}
        selectedTags={['family']}
        tagOptions={[
          ...DEFAULT_EVENT_TAGS,
          {
            value: 'custom-tag',
            label: 'Custom Tag',
            dotClass: 'bg-indigo-400',
          },
        ]}
        onSetShowAllTags={onSetShowAllTags}
        onToggleTagFilter={onToggleTagFilter}
        onAddTagOption={onAddTagOption}
        onRemoveTagOption={onRemoveTagOption}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );

    const negocioOption = await screen.findByText('Negócios');
    await user.click(negocioOption);
    expect(onToggleTagFilter).toHaveBeenCalledWith('business', true);

    const todasOption = screen.getByText('Todas');
    await user.click(todasOption);
    expect(onSetShowAllTags).toHaveBeenCalledWith(true);
  });

  describe('Cohesive tagFilter prop (#138)', () => {
    it('accepts cohesive tagFilter prop and triggers handlers', async () => {
      const user = userEvent.setup();
      const onSetShowAllTags = vi.fn();
      const onToggleTagFilter = vi.fn();
      const onAddTagOption = vi.fn();
      const onRemoveTagOption = vi.fn();

      const tagFilter = {
        showAllTags: false,
        selectedTags: ['family'],
        tagOptions: [
          ...DEFAULT_EVENT_TAGS,
          {
            value: 'custom-pack',
            label: 'Custom Pack',
            dotClass: 'bg-indigo-400',
            isSystem: false,
          },
        ],
        onSetShowAllTags,
        onToggleTagFilter,
        onAddTagOption,
        onRemoveTagOption,
      };

      render(<EventTagFilterDropdown tagFilter={tagFilter} />);

      await user.click(
        screen.getByRole('button', { name: /filtro de etiquetas/i })
      );

      // Verify custom tag from tagFilter is present
      expect(await screen.findByText('Custom Pack')).toBeInTheDocument();

      // Click Todas
      await user.click(screen.getByText('Todas'));
      expect(onSetShowAllTags).toHaveBeenCalledWith(true);

      // Toggle a tag
      await user.click(screen.getByText('Negócios'));
      expect(onToggleTagFilter).toHaveBeenCalledWith('business', true);

      // Add tag
      const input = screen.getByPlaceholderText('Nova etiqueta...');
      await user.type(input, 'Academia');
      await user.click(
        screen.getByRole('button', { name: /adicionar etiqueta/i })
      );
      expect(onAddTagOption).toHaveBeenCalledWith('Academia');

      // Remove tag
      const removeBtn = screen.getByRole('button', {
        name: /remover etiqueta custom pack/i,
      });
      await user.click(removeBtn);
      expect(onRemoveTagOption).toHaveBeenCalledWith('custom-pack', undefined);
    });

    it('accepts concise action names (setShowAll, toggleTag, addTag, removeTag) in tagFilter prop (#135)', async () => {
      const user = userEvent.setup();
      const setShowAll = vi.fn();
      const toggleTag = vi.fn();
      const addTag = vi.fn();
      const removeTag = vi.fn();

      const tagFilter = {
        showAllTags: false,
        selectedTags: ['family'],
        tagOptions: [
          ...DEFAULT_EVENT_TAGS,
          {
            value: 'custom-concise',
            label: 'Custom Concise',
            dotClass: 'bg-indigo-400',
            isSystem: false,
          },
        ],
        setShowAll,
        toggleTag,
        addTag,
        removeTag,
      };

      render(<EventTagFilterDropdown tagFilter={tagFilter} />);

      await user.click(
        screen.getByRole('button', { name: /filtro de etiquetas/i })
      );

      // Wait for menu to open and click Todas
      const todasOption = await screen.findByText('Todas');
      await user.click(todasOption);
      expect(setShowAll).toHaveBeenCalledWith(true);

      // Toggle tag invokes toggleTag
      await user.click(screen.getByText('Negócios'));
      expect(toggleTag).toHaveBeenCalledWith('business', true);

      // Add tag invokes addTag
      const input = screen.getByPlaceholderText('Nova etiqueta...');
      await user.type(input, 'Workshop');
      await user.click(
        screen.getByRole('button', { name: /adicionar etiqueta/i })
      );
      expect(addTag).toHaveBeenCalledWith('Workshop');

      // Remove tag invokes removeTag
      const removeBtn = screen.getByRole('button', {
        name: /remover etiqueta custom concise/i,
      });
      await user.click(removeBtn);
      expect(removeTag).toHaveBeenCalledWith('custom-concise', undefined);
    });

    it('accepts direct concise action props on EventTagFilterDropdown', async () => {
      const user = userEvent.setup();
      const setShowAll = vi.fn();
      const toggleTag = vi.fn();
      const addTag = vi.fn();
      const removeTag = vi.fn();

      render(
        <EventTagFilterDropdown
          showAllTags={false}
          selectedTags={['family']}
          tagOptions={[
            ...DEFAULT_EVENT_TAGS,
            {
              value: 'custom-direct',
              label: 'Custom Direct',
              dotClass: 'bg-indigo-400',
              isSystem: false,
            },
          ]}
          setShowAll={setShowAll}
          toggleTag={toggleTag}
          addTag={addTag}
          removeTag={removeTag}
        />
      );

      await user.click(
        screen.getByRole('button', { name: /filtro de etiquetas/i })
      );

      const todasOption = await screen.findByText('Todas');
      await user.click(todasOption);
      expect(setShowAll).toHaveBeenCalledWith(true);

      await user.click(screen.getByText('Negócios'));
      expect(toggleTag).toHaveBeenCalledWith('business', true);

      const input = screen.getByPlaceholderText('Nova etiqueta...');
      await user.type(input, 'Festival');
      await user.click(
        screen.getByRole('button', { name: /adicionar etiqueta/i })
      );
      expect(addTag).toHaveBeenCalledWith('Festival');

      const removeBtn = screen.getByRole('button', {
        name: /remover etiqueta custom direct/i,
      });
      await user.click(removeBtn);
      expect(removeTag).toHaveBeenCalledWith('custom-direct', undefined);
    });
  });
});
