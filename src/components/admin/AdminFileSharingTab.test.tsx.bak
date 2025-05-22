import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AdminFileSharingTab from './AdminFileSharingTab';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  UploadCloud: () => <div data-testid="upload-icon" />,
  Trash2: () => <div data-testid="delete-icon" />,
  ToggleLeft: () => <div data-testid="toggle-left-icon" />,
  ToggleRight: () => <div data-testid="toggle-right-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  CalendarDays: () => <div data-testid="calendar-icon" />,
  Package: () => <div data-testid="package-icon" />,
}));

// Mock window.confirm
global.confirm = jest.fn(() => true); // Default to "OK"

const mockFiles = [
  { _id: '1', originalName: 'file1.pdf', mimeType: 'application/pdf', size: 1024, isActive: true, uploadedAt: new Date().toISOString(), uniqueFilename: 'unique1.pdf', serverPath: '/uploads/unique1.pdf' },
  { _id: '2', originalName: 'file2.txt', mimeType: 'text/plain', size: 2048, isActive: false, uploadedAt: new Date().toISOString(), uniqueFilename: 'unique2.txt', serverPath: '/uploads/unique2.txt' },
];

describe('AdminFileSharingTab', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: mockFiles });
    mockedAxios.post.mockResolvedValue({ data: { message: 'Upload successful' } });
    mockedAxios.put.mockResolvedValue({ data: { message: 'Toggle successful' } });
    mockedAxios.delete.mockResolvedValue({ data: { message: 'Delete successful' } });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders initial state correctly and fetches files', async () => {
    render(<AdminFileSharingTab />);
    expect(screen.getByText('Administrar Archivos Compartidos')).toBeInTheDocument();
    expect(screen.getByText('Subir Nuevo Archivo')).toBeInTheDocument();
    
    // Check for loading state initially for files
    expect(screen.getByText(/Cargando archivos.../i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('file1.pdf')).toBeInTheDocument();
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
    });
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/files/');
  });

  test('handles file selection and upload successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] }); // Start with no files for this test
    render(<AdminFileSharingTab />);
    
    await waitFor(() => expect(screen.getByText(/No hay archivos subidos todavía./i)).toBeInTheDocument());

    const fileInput = screen.getByLabelText<HTMLInputElement>(/Subir Nuevo Archivo/i, { selector: 'input[type="file"]' }) || document.getElementById('file-upload-input');
    const uploadButton = screen.getByRole('button', { name: /Subir Archivo/i });

    expect(uploadButton).toBeDisabled();

    const file = new File(['dummy content'], 'test-upload.png', { type: 'image/png' });
    fireEvent.change(fileInput!, { target: { files: [file] } });

    expect(screen.getByText(/Archivo seleccionado: test-upload.png/i)).toBeInTheDocument();
    expect(uploadButton).not.toBeDisabled();

    mockedAxios.post.mockResolvedValueOnce({ data: { ...mockFiles[0], originalName: 'test-upload.png' }});
    mockedAxios.get.mockResolvedValueOnce({ data: [{ ...mockFiles[0], originalName: 'test-upload.png' }] }); // For refresh

    fireEvent.click(uploadButton);

    expect(uploadButton).toBeDisabled(); // Should be disabled during upload
    expect(screen.getByText(/Subiendo.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Archivo "test-upload.png" subido exitosamente./i)).toBeInTheDocument();
    });
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/files/upload', expect.any(FormData), expect.any(Object));
    expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial fetch + refresh after upload
    expect(screen.getByText('test-upload.png')).toBeInTheDocument(); // File appears in the list

    // Test success message auto-dismissal
    act(() => { jest.advanceTimersByTime(5000); });
    await waitFor(() => {
        expect(screen.queryByText(/Archivo "test-upload.png" subido exitosamente./i)).not.toBeInTheDocument();
    });
  });
  
  test('shows error message on upload failure', async () => {
    render(<AdminFileSharingTab />);
    const fileInput = screen.getByLabelText<HTMLInputElement>(/Subir Nuevo Archivo/i, { selector: 'input[type="file"]' }) || document.getElementById('file-upload-input');
    const uploadButton = screen.getByRole('button', { name: /Subir Archivo/i });
    const file = new File(['dummy content'], 'fail-upload.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    mockedAxios.post.mockRejectedValueOnce({ response: { data: { message: 'Upload failed miserably' } } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload failed miserably')).toBeInTheDocument();
    });
  });


  test('toggles file active status', async () => {
    render(<AdminFileSharingTab />);
    await waitFor(() => expect(screen.getByText('file1.pdf')).toBeInTheDocument());

    const toggleButtons = screen.getAllByTitle(/Activar|Desactivar/i); // Get all toggle buttons
    const firstFileToggle = toggleButtons[0]; // Assuming file1.pdf is first and active

    mockedAxios.put.mockResolvedValueOnce({ data: { ...mockFiles[0], isActive: false } });
    // For the refresh call after toggle
    mockedAxios.get.mockResolvedValueOnce({ data: mockFiles.map(f => f._id === '1' ? {...f, isActive: false} : f) });


    fireEvent.click(firstFileToggle);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/files/${mockFiles[0]._id}/toggle`, undefined);
      expect(screen.getByText('Estado del archivo actualizado.')).toBeInTheDocument();
    });
    // Check if UI updated (e.g., the toggle icon changes or status text changes)
    // This depends on how isActive state visually changes the button or status text.
    // If file1.pdf was active (true), after toggle it should be inactive (false)
    await waitFor(() => {
      // After refresh, the status text for file1.pdf should reflect the change.
      // The toggle button for file1.pdf should now be <ToggleLeft /> (inactive state)
      expect(screen.getAllByTestId('toggle-left-icon').length).toBeGreaterThan(0); 
    });
  });

  test('deletes a file after confirmation', async () => {
    render(<AdminFileSharingTab />);
    await waitFor(() => expect(screen.getByText('file1.pdf')).toBeInTheDocument());

    const deleteButtons = screen.getAllByTitle('Eliminar Archivo');
    const firstFileDeleteButton = deleteButtons[0];

    (window.confirm as jest.Mock).mockReturnValueOnce(true); // User confirms deletion

    mockedAxios.delete.mockResolvedValueOnce({ data: { message: 'File deleted' } });
    // For the refresh call after delete, return only the second file
    mockedAxios.get.mockResolvedValueOnce({ data: [mockFiles[1]] });

    fireEvent.click(firstFileDeleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres eliminar el archivo "file1.pdf"? Esta acción no se puede deshacer.');
      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/files/${mockFiles[0]._id}`);
      expect(screen.getByText(`Archivo "file1.pdf" eliminado.`)).toBeInTheDocument();
    });
    
    // File1 should be removed from the list
    expect(screen.queryByText('file1.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('file2.txt')).toBeInTheDocument(); // File2 should still be there
  });

   test('does not delete file if confirmation is cancelled', async () => {
    render(<AdminFileSharingTab />);
    await waitFor(() => expect(screen.getByText('file1.pdf')).toBeInTheDocument());

    const deleteButtons = screen.getAllByTitle('Eliminar Archivo');
    fireEvent.click(deleteButtons[0]);

    (window.confirm as jest.Mock).mockReturnValueOnce(false); // User cancels deletion
    
    // Re-click after setting mock return value
    fireEvent.click(deleteButtons[0]);


    expect(window.confirm).toHaveBeenCalled();
    expect(mockedAxios.delete).not.toHaveBeenCalled();
    expect(screen.getByText('file1.pdf')).toBeInTheDocument(); // File should still be there
  });
});
