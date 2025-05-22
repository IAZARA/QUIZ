import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import SharedFilesDisplay from './SharedFilesDisplay';
import { Socket } from 'socket.io-client'; // Import Socket type for mocking

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  DownloadCloud: () => <div data-testid="download-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Archive: () => <div data-testid="archive-icon" />,
}));

const mockActiveFiles = [
  { _id: 'file1', originalName: 'document.pdf', mimeType: 'application/pdf', size: 102400, uploadedAt: new Date().toISOString() },
  { _id: 'file2', originalName: 'image.png', mimeType: 'image/png', size: 204800, uploadedAt: new Date().toISOString() },
];

// Mock Socket.IO client
// We'll create a minimal mock for the socket prop
const mockSocketInstance: Partial<Socket> = {
  on: jest.fn(),
  off: jest.fn(),
  // Add other methods if your component uses them, e.g., emit
};


describe('SharedFilesDisplay', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: mockActiveFiles });
    (mockSocketInstance.on as jest.Mock).mockClear();
    (mockSocketInstance.off as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    mockedAxios.get.mockImplementationOnce(() => new Promise(() => {})); // Keep it pending
    render(<SharedFilesDisplay socket={mockSocketInstance as Socket} />);
    expect(screen.getByText(/Cargando archivos compartidos.../i)).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  test('fetches and displays active files', async () => {
    render(<SharedFilesDisplay socket={mockSocketInstance as Socket} />);
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.png')).toBeInTheDocument();
    });

    expect(screen.getByText('100 KB - application/pdf')).toBeInTheDocument(); // 102400 bytes
    expect(screen.getByText('200 KB - image/png')).toBeInTheDocument(); // 204800 bytes
    
    const downloadLinks = screen.getAllByRole('link', { name: /Descargar/i });
    expect(downloadLinks[0]).toHaveAttribute('href', '/api/files/download/file1');
    expect(downloadLinks[0]).toHaveAttribute('download', 'document.pdf');
    expect(downloadLinks[1]).toHaveAttribute('href', '/api/files/download/file2');
    expect(downloadLinks[1]).toHaveAttribute('download', 'image.png');

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/files/active_for_audience');
  });

  test('displays "No hay archivos compartidos" message when no files are active', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    render(<SharedFilesDisplay socket={mockSocketInstance as Socket} />);

    await waitFor(() => {
      expect(screen.getByText(/No hay archivos compartidos/i)).toBeInTheDocument();
      expect(screen.getByText(/No hay archivos disponibles para descargar en este momento./i)).toBeInTheDocument();
    });
  });

  test('displays error message on fetch failure', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));
    render(<SharedFilesDisplay socket={mockSocketInstance as Socket} />);

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar archivos/i)).toBeInTheDocument();
      expect(screen.getByText(/No se pudieron cargar los archivos compartidos. Intenta recargar la página./i)).toBeInTheDocument();
    });
  });
  
  test('retry button calls fetchActiveFiles on error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    render(<SharedFilesDisplay socket={mockSocketInstance as Socket} />);

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar archivos/i)).toBeInTheDocument();
    });

    mockedAxios.get.mockResolvedValueOnce({ data: mockActiveFiles }); // Setup for successful retry
    const retryButton = screen.getByRole('button', { name: /Reintentar/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });
    expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial call + retry call
  });


  test('listens for "shared_files_updated" socket event and re-fetches files', async () => {
    render(<SharedFilesDisplay socket={mockSocketInstance as Socket} />);
    
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Initial fetch
    });

    // Find the registered event handler for 'shared_files_updated'
    const onCall = (mockSocketInstance.on as jest.Mock).mock.calls.find(
      call => call[0] === 'shared_files_updated'
    );
    expect(onCall).toBeDefined();
    const eventHandler = onCall[1]; // The callback function

    // Simulate the event
    act(() => {
      eventHandler();
    });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Should be called again
    });
  });
  
  test('cleans up socket listener on unmount', async () => {
    const { unmount } = render(<SharedFilesDisplay socket={mockSocketInstance as Socket} />);
    
    await waitFor(() => {
      expect(mockSocketInstance.on).toHaveBeenCalledWith('shared_files_updated', expect.any(Function));
    });

    unmount();

    expect(mockSocketInstance.off).toHaveBeenCalledWith('shared_files_updated', expect.any(Function));
  });
  
   test('does not try to use socket if not provided', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] }); // Ensure it resolves to avoid error state
    render(<SharedFilesDisplay socket={null} />); // Pass null as socket

    await waitFor(() => {
      expect(screen.getByText(/No hay archivos compartidos/i)).toBeInTheDocument();
    });
    expect(mockSocketInstance.on).not.toHaveBeenCalled(); // `on` should not be called
  });

});
