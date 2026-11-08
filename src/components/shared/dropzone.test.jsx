import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Dropzone from '@/components/shared/dropzone';

describe('Dropzone Component (Single-Item)', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((file) => `blob:http://localhost/${file.name}`),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Empty state rendering', () => {
    it('renders default Portuguese (BR) labels in empty state', () => {
      render(<Dropzone />);

      expect(
        screen.getByText('Arraste e solte seu arquivo aqui')
      ).toBeInTheDocument();
      expect(
        screen.getByText('ou clique para navegar no computador')
      ).toBeInTheDocument();
    });

    it('renders custom title and description when provided', () => {
      render(
        <Dropzone
          title="Selecione o comprovante"
          description="Formatos aceitos: PDF ou PNG"
        />
      );

      expect(screen.getByText('Selecione o comprovante')).toBeInTheDocument();
      expect(
        screen.getByText('Formatos aceitos: PDF ou PNG')
      ).toBeInTheDocument();
    });

    it('displays maximum size hint when maxSize is provided', () => {
      render(<Dropzone maxSize={5 * 1024 * 1024} />);

      expect(screen.getByText(/Até 5 MB por arquivo/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard accessibility and click interaction', () => {
    it('allows focus via Tab and has interactive dropzone role', () => {
      render(<Dropzone />);

      const dropzone = screen.getByRole('presentation');
      expect(dropzone).toHaveAttribute('tabindex', '0');
    });

    it('opens file picker dialog when dropzone is clicked', () => {
      const { container } = render(<Dropzone />);
      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const dropzone = screen.getByRole('presentation');
      fireEvent.click(dropzone);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('File selection and preview card', () => {
    it('displays preview card with image thumbnail, file name, and formatted size', async () => {
      const onChange = vi.fn();
      const onFileSelect = vi.fn();
      const { container } = render(
        <Dropzone onChange={onChange} onFileSelect={onFileSelect} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['image-bytes'], 'avatar.png', {
        type: 'image/png',
      });
      Object.defineProperty(file, 'size', { value: 373 * 1024 });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('avatar.png')).toBeInTheDocument();
      });

      expect(screen.getByText('373 KB')).toBeInTheDocument();

      const img = screen.getByAltText('avatar.png');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'blob:http://localhost/avatar.png');
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);

      expect(onChange).toHaveBeenCalledWith(file);
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('displays preview card with document icon when a non-image file is selected', async () => {
      const { container } = render(<Dropzone />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['pdf-bytes'], 'relatorio.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(file, 'size', { value: 1.5 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('relatorio.pdf')).toBeInTheDocument();
      });

      expect(screen.getByText('1.5 MB')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Drag and drop interactions', () => {
    it('updates visual indicator on drag over and drops file', async () => {
      const onChange = vi.fn();
      render(<Dropzone onChange={onChange} />);

      const dropzone = screen.getByRole('presentation');

      fireEvent.dragEnter(dropzone, {
        dataTransfer: {
          items: [{ kind: 'file', type: 'image/png' }],
          types: ['Files'],
        },
      });

      const file = new File(['content'], 'foto.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 100 });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
          items: [
            {
              kind: 'file',
              type: 'image/png',
              getAsFile: () => file,
            },
          ],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('foto.png')).toBeInTheDocument();
      });

      expect(onChange).toHaveBeenCalledWith(file);
    });
  });

  describe('Replace and Remove actions', () => {
    it('triggers file selection when "Substituir" is clicked', async () => {
      const { container } = render(<Dropzone />);

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const file = new File(['image'], 'initial.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('initial.png')).toBeInTheDocument();
      });

      const replaceButton = screen.getByRole('button', { name: /substituir/i });
      fireEvent.click(replaceButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('clears selection, revokes object URL, and returns to empty dropzone when "Remover" is clicked', async () => {
      const onChange = vi.fn();
      const onFileSelect = vi.fn();
      const { container } = render(
        <Dropzone onChange={onChange} onFileSelect={onFileSelect} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['image'], 'photo.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('photo.png')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remover/i });
      fireEvent.click(removeButton);

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:http://localhost/photo.png'
      );

      expect(onChange).toHaveBeenCalledWith(null);
      expect(onFileSelect).toHaveBeenCalledWith(null);

      await waitFor(() => {
        expect(
          screen.getByText('Arraste e solte seu arquivo aqui')
        ).toBeInTheDocument();
      });
    });

    it('revokes previous object URL when replacing a file', async () => {
      const { container } = render(<Dropzone />);

      const fileInput = container.querySelector('input[type="file"]');
      const file1 = new File(['one'], 'first.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file1] } });

      await waitFor(() => {
        expect(screen.getByText('first.png')).toBeInTheDocument();
      });
      expect(URL.createObjectURL).toHaveBeenCalledWith(file1);

      const file2 = new File(['two'], 'second.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file2] } });

      await waitFor(() => {
        expect(screen.getByText('second.png')).toBeInTheDocument();
      });

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:http://localhost/first.png'
      );
    });
  });

  describe('Validation and Error handling', () => {
    it('rejects files exceeding maxSize and displays localized Portuguese error', async () => {
      const onError = vi.fn();
      const onChange = vi.fn();
      const { container } = render(
        <Dropzone
          maxSize={2 * 1024 * 1024}
          onError={onError}
          onChange={onChange}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const largeFile = new File(['large-content'], 'grande.png', {
        type: 'image/png',
      });
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        const errorEl = screen.getByRole('alert');
        expect(errorEl).toHaveTextContent(
          'O arquivo "grande.png" excede o tamanho máximo de 2 MB.'
        );
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'file-too-large',
          file: largeFile,
        })
      );

      expect(onChange).not.toHaveBeenCalled();

      expect(
        screen.getByText('Arraste e solte seu arquivo aqui')
      ).toBeInTheDocument();
    });

    it('rejects files with unsupported format and displays localized error', async () => {
      const onError = vi.fn();
      const { container } = render(
        <Dropzone
          accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }}
          onError={onError}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const textFile = new File(['hello'], 'documento.txt', {
        type: 'text/plain',
      });

      fireEvent.change(fileInput, { target: { files: [textFile] } });

      await waitFor(() => {
        const errorEl = screen.getByRole('alert');
        expect(errorEl).toHaveTextContent(/Formato não suportado/i);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'file-invalid-type',
          file: textFile,
        })
      );
    });

    it('clears inline error message when a valid file is subsequently selected', async () => {
      const { container } = render(
        <Dropzone
          accept={{ 'image/png': ['.png'] }}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const invalidFile = new File(['bad'], 'doc.pdf', {
        type: 'application/pdf',
      });

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const validFile = new File(['good'], 'avatar.png', {
        type: 'image/png',
      });
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByText('avatar.png')).toBeInTheDocument();
      });
    });
  });

  describe('Controlled value mode', () => {
    it('displays preview card when controlled value is passed', () => {
      const file = new File(['ctrl'], 'controlled.png', {
        type: 'image/png',
      });
      const { rerender } = render(<Dropzone value={file} />);

      expect(screen.getByText('controlled.png')).toBeInTheDocument();

      rerender(<Dropzone value={null} />);
      expect(
        screen.getByText('Arraste e solte seu arquivo aqui')
      ).toBeInTheDocument();
    });
  });

  describe('Uploading and Disabled states', () => {
    it('displays upload indicator and disables action buttons when isUploading is true', () => {
      const file = new File(['test'], 'profile.png', { type: 'image/png' });
      render(<Dropzone value={file} isUploading={true} />);

      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      expect(
        screen.getByTestId('dropzone-loading-spinner')
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /substituir/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /remover/i })
      ).not.toBeInTheDocument();
    });

    it('disables replace and remove buttons when disabled is true in single-item mode', () => {
      const file = new File(['test'], 'profile.png', { type: 'image/png' });
      render(<Dropzone value={file} disabled={true} />);

      const replaceBtn = screen.getByRole('button', { name: /substituir/i });
      const removeBtn = screen.getByRole('button', { name: /remover/i });

      expect(replaceBtn).toBeDisabled();
      expect(removeBtn).toBeDisabled();
    });

    it('disables dropzone area and shows upload spinner when isUploading is true in empty state', () => {
      const { container } = render(<Dropzone isUploading={true} />);

      expect(screen.getByText('Enviando arquivo...')).toBeInTheDocument();
      expect(
        screen.getByTestId('dropzone-loading-spinner')
      ).toBeInTheDocument();

      const dropzone = container.querySelector('[data-slot="dropzone-zone"]');
      expect(dropzone).toHaveAttribute('data-disabled');
    });

    it('disables folded strip, item remove buttons, and clear all button when isUploading is true in multi-item mode', () => {
      const file1 = new File(['1'], 'file1.png', { type: 'image/png' });
      const file2 = new File(['2'], 'file2.png', { type: 'image/png' });
      const { container } = render(
        <Dropzone
          multiple={true}
          value={[file1, file2]}
          isUploading={true}
        />
      );

      const foldedStrip = container.querySelector(
        '[data-slot="dropzone-folded-strip"]'
      );
      expect(foldedStrip).toHaveAttribute('data-disabled');

      const addMoreBtn = screen.getByRole('button', { name: /adicionar mais/i });
      expect(addMoreBtn).toBeDisabled();

      const clearAllBtn = screen.getByRole('button', { name: /limpar tudo/i });
      expect(clearAllBtn).toBeDisabled();

      const removeBtns = screen.getAllByRole('button', { name: /^Remover/ });
      expect(removeBtns.length).toBe(2);
      removeBtns.forEach((btn) => {
        expect(btn).toBeDisabled();
      });

      const spinners = screen.getAllByTestId('file-item-spinner');
      expect(spinners.length).toBe(2);
    });

    it('disables dropzone interaction when disabled is true', () => {
      const { container } = render(<Dropzone disabled={true} />);

      const dropzone = container.querySelector('[data-slot="dropzone-zone"]');
      expect(dropzone).toHaveAttribute('data-disabled');
    });
  });

  describe('Lifecycle cleanup', () => {
    it('revokes generated object URL when component unmounts', async () => {
      const { container, unmount } = render(<Dropzone />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['image'], 'unmount.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('unmount.png')).toBeInTheDocument();
      });

      unmount();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:http://localhost/unmount.png'
      );
    });
  });

  describe('Dropzone Component (Multi-Item Folding)', () => {
    it('renders spacious empty dropzone when initialized with multiple=true and no files', () => {
      render(<Dropzone multiple={true} />);

      expect(
        screen.getByText('Arraste e solte seus arquivos aqui')
      ).toBeInTheDocument();
      expect(
        screen.getByText('ou clique para navegar no computador')
      ).toBeInTheDocument();
      expect(screen.queryByText('Na pasta')).not.toBeInTheDocument();
      expect(screen.queryByText('Adicionar mais')).not.toBeInTheDocument();
    });

    it('transitions to folded strip and file list when multiple files are selected', async () => {
      const onChange = vi.fn();
      const onFilesChange = vi.fn();
      const { container } = render(
        <Dropzone
          multiple={true}
          totalSizeLimit={25 * 1024 * 1024}
          onChange={onChange}
          onFilesChange={onFilesChange}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file1 = new File(['img1'], 'photo1.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file1, 'size', { value: 373 * 1024 });
      const file2 = new File(['img2'], 'photo2.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file2, 'size', { value: 337 * 1024 });

      fireEvent.change(fileInput, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(screen.getByText('Arraste mais arquivos aqui')).toBeInTheDocument();
      });

      expect(screen.getByText('Adicionar mais')).toBeInTheDocument();
      expect(screen.getByText('Na pasta')).toBeInTheDocument();
      expect(screen.getByText('2 arquivos')).toBeInTheDocument();
      expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByText('photo2.jpg')).toBeInTheDocument();
      expect(screen.getByText('373 KB')).toBeInTheDocument();
      expect(screen.getByText('337 KB')).toBeInTheDocument();

      // Folded description with total quota
      expect(screen.getByText(/25 MB no total/i)).toBeInTheDocument();

      // Footer summary & Clear all button
      expect(screen.getByText(/2 arquivos, 710 KB de 25 MB/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /limpar tudo/i })).toBeInTheDocument();

      // Callbacks
      expect(onChange).toHaveBeenCalledWith([file1, file2]);
      expect(onFilesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            file: file1,
            name: 'photo1.jpg',
            size: 373 * 1024,
            preview: 'blob:http://localhost/photo1.jpg',
          }),
          expect.objectContaining({
            file: file2,
            name: 'photo2.jpg',
            size: 337 * 1024,
            preview: 'blob:http://localhost/photo2.jpg',
          }),
        ])
      );
    });

    it('allows adding more files via the folded strip, appending to existing list', async () => {
      const onChange = vi.fn();
      const onFilesChange = vi.fn();
      const { container } = render(
        <Dropzone
          multiple={true}
          onChange={onChange}
          onFilesChange={onFilesChange}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const file1 = new File(['1'], 'doc1.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file1] } });

      await waitFor(() => {
        expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
      });
      expect(screen.getByText('1 arquivo')).toBeInTheDocument();

      // Clicking "Adicionar mais" button triggers file picker
      const addMoreButton = screen.getByRole('button', { name: /adicionar mais/i });
      fireEvent.click(addMoreButton);
      expect(clickSpy).toHaveBeenCalled();

      // Add a second file
      const file2 = new File(['2'], 'doc2.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file2] } });

      await waitFor(() => {
        expect(screen.getByText('doc2.pdf')).toBeInTheDocument();
      });

      expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
      expect(screen.getByText('2 arquivos')).toBeInTheDocument();

      expect(onChange).toHaveBeenLastCalledWith([file1, file2]);
      expect(onFilesChange).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'doc1.pdf' }),
          expect.objectContaining({ name: 'doc2.pdf' }),
        ])
      );
    });

    it('removes an individual file without affecting other files in the list', async () => {
      const onChange = vi.fn();
      const onFilesChange = vi.fn();
      const { container } = render(
        <Dropzone
          multiple={true}
          onChange={onChange}
          onFilesChange={onFilesChange}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file1 = new File(['1'], 'first.png', { type: 'image/png' });
      const file2 = new File(['2'], 'second.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(screen.getByText('first.png')).toBeInTheDocument();
        expect(screen.getByText('second.png')).toBeInTheDocument();
      });

      // Find remove button specifically for first.png
      const removeFirstBtn = screen.getByRole('button', {
        name: 'Remover first.png',
      });
      fireEvent.click(removeFirstBtn);

      // Verify first.png object URL is revoked
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:http://localhost/first.png'
      );

      // Verify first.png is gone, second.png remains
      await waitFor(() => {
        expect(screen.queryByText('first.png')).not.toBeInTheDocument();
        expect(screen.getByText('second.png')).toBeInTheDocument();
      });

      expect(screen.getByText('1 arquivo')).toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith([file2]);
      expect(onFilesChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ name: 'second.png' }),
      ]);
    });

    it('reverts to spacious empty dropzone when all individual files are removed', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <Dropzone multiple={true} onChange={onChange} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['solo'], 'solo.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('solo.png')).toBeInTheDocument();
      });

      const removeBtn = screen.getByRole('button', {
        name: 'Remover solo.png',
      });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(
          screen.getByText('Arraste e solte seus arquivos aqui')
        ).toBeInTheDocument();
      });

      expect(screen.queryByText('Na pasta')).not.toBeInTheDocument();
      expect(screen.queryByText('Adicionar mais')).not.toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('clears all files and reverts to spacious dropzone when clicking "Limpar tudo"', async () => {
      const onChange = vi.fn();
      const onFilesChange = vi.fn();
      const { container } = render(
        <Dropzone
          multiple={true}
          totalSizeLimit={10 * 1024 * 1024}
          onChange={onChange}
          onFilesChange={onFilesChange}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file1 = new File(['1'], 'doc1.pdf', { type: 'application/pdf' });
      const file2 = new File(['2'], 'image2.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
      });

      const clearAllButton = screen.getByRole('button', {
        name: /limpar tudo/i,
      });
      fireEvent.click(clearAllButton);

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:http://localhost/image2.png'
      );

      await waitFor(() => {
        expect(
          screen.getByText('Arraste e solte seus arquivos aqui')
        ).toBeInTheDocument();
      });

      expect(screen.queryByText('doc1.pdf')).not.toBeInTheDocument();
      expect(screen.queryByText('image2.png')).not.toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith([]);
      expect(onFilesChange).toHaveBeenLastCalledWith([]);
    });

    it('enforces maxFiles limit and displays inline validation error when exceeded', async () => {
      const onError = vi.fn();
      const onChange = vi.fn();
      const { container } = render(
        <Dropzone
          multiple={true}
          maxFiles={2}
          onError={onError}
          onChange={onChange}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file1 = new File(['1'], 'a.png', { type: 'image/png' });
      const file2 = new File(['2'], 'b.png', { type: 'image/png' });
      const file3 = new File(['3'], 'c.png', { type: 'image/png' });

      // Attempt dropping 3 files when maxFiles is 2
      fireEvent.change(fileInput, { target: { files: [file1, file2, file3] } });

      await waitFor(() => {
        const errorEl = screen.getByRole('alert');
        expect(errorEl).toHaveTextContent(
          'Número máximo de arquivos atingido (máximo: 2).'
        );
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'too-many-files',
          message: 'Número máximo de arquivos atingido (máximo: 2).',
        })
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('enforces maxFiles limit cumulatively when adding more files via the folded strip', async () => {
      const onError = vi.fn();
      const { container } = render(
        <Dropzone multiple={true} maxFiles={2} onError={onError} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file1 = new File(['1'], 'first.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file1] } });

      await waitFor(() => {
        expect(screen.getByText('first.png')).toBeInTheDocument();
      });

      // Add two more files (1 existing + 2 new = 3 > maxFiles 2)
      const file2 = new File(['2'], 'second.png', { type: 'image/png' });
      const file3 = new File(['3'], 'third.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file2, file3] } });

      await waitFor(() => {
        const errorEl = screen.getByRole('alert');
        expect(errorEl).toHaveTextContent(
          'Número máximo de arquivos atingido (máximo: 2).'
        );
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'too-many-files',
        })
      );
      // original file remains
      expect(screen.getByText('first.png')).toBeInTheDocument();
    });

    it('enforces totalSizeLimit if configured and displays validation error', async () => {
      const onError = vi.fn();
      const { container } = render(
        <Dropzone
          multiple={true}
          totalSizeLimit={2 * 1024 * 1024} // 2 MB
          onError={onError}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const largeFile = new File(['large'], 'large.bin', {
        type: 'application/octet-stream',
      });
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 }); // 3 MB

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        const errorEl = screen.getByRole('alert');
        expect(errorEl).toHaveTextContent(
          'O tamanho total dos arquivos excede o limite de 2 MB.'
        );
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'total-size-too-large',
        })
      );
    });

    it('supports controlled value mode with multiple files', () => {
      const file1 = new File(['1'], 'ctrl1.png', { type: 'image/png' });
      const file2 = new File(['2'], 'ctrl2.png', { type: 'image/png' });

      const { rerender } = render(<Dropzone multiple={true} value={[file1, file2]} />);

      expect(screen.getByText('ctrl1.png')).toBeInTheDocument();
      expect(screen.getByText('ctrl2.png')).toBeInTheDocument();
      expect(screen.getByText('2 arquivos')).toBeInTheDocument();

      rerender(<Dropzone multiple={true} value={[]} />);

      expect(
        screen.getByText('Arraste e solte seus arquivos aqui')
      ).toBeInTheDocument();
    });

    it('revokes generated object URLs for all files when component unmounts', async () => {
      const { container, unmount } = render(<Dropzone multiple={true} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file1 = new File(['1'], 'multi1.png', { type: 'image/png' });
      const file2 = new File(['2'], 'multi2.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(screen.getByText('multi1.png')).toBeInTheDocument();
        expect(screen.getByText('multi2.png')).toBeInTheDocument();
      });

      unmount();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:http://localhost/multi1.png'
      );
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:http://localhost/multi2.png'
      );
    });

    it('handles drag over and drop onto the folded strip', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <Dropzone multiple={true} onChange={onChange} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const initialFile = new File(['0'], 'initial.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [initialFile] } });

      await waitFor(() => {
        expect(screen.getByText('initial.png')).toBeInTheDocument();
      });

      const foldedStrip = container.querySelector(
        '[data-slot="dropzone-folded-strip"]'
      );
      expect(foldedStrip).toBeInTheDocument();

      fireEvent.dragEnter(foldedStrip, {
        dataTransfer: {
          items: [{ kind: 'file', type: 'image/png' }],
          types: ['Files'],
        },
      });

      const droppedFile = new File(['dropped'], 'dropped.png', {
        type: 'image/png',
      });
      fireEvent.drop(foldedStrip, {
        dataTransfer: {
          files: [droppedFile],
          types: ['Files'],
          items: [
            {
              kind: 'file',
              type: 'image/png',
              getAsFile: () => droppedFile,
            },
          ],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('dropped.png')).toBeInTheDocument();
      });
      expect(screen.getByText('initial.png')).toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith([initialFile, droppedFile]);
    });
  });
});
