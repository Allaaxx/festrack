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
        screen.queryByRole('button', { name: /substituir/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /remover/i })
      ).not.toBeInTheDocument();
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
});
