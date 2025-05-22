import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminQATab from './AdminQATab'; // Adjust path as necessary
import { useAdminSocketStore } from '../../store/adminSocketStore'; // Adjust path

// Mock global fetch
global.fetch = jest.fn();

// Mock useAdminSocketStore
jest.mock('../../store/adminSocketStore', () => ({
  useAdminSocketStore: jest.fn(),
}));

const mockUseAdminSocketStore = useAdminSocketStore as jest.Mock;

// Mock Socket.IO client behavior for the store
const mockAdminSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};

const mockConnectAdminSocket = jest.fn();
const mockDisconnectAdminSocket = jest.fn();

describe('AdminQATab Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectAdminSocket.mockClear();
    mockDisconnectAdminSocket.mockClear();
    (fetch as jest.Mock).mockClear();
    mockAdminSocket.on.mockClear();
    mockAdminSocket.off.mockClear();
    mockAdminSocket.emit.mockClear();

    // Default mock for admin socket store
    mockUseAdminSocketStore.mockReturnValue({
      socket: mockAdminSocket,
      connectAdminSocket: mockConnectAdminSocket,
      isConnected: true, // Assume connected for most tests
      disconnectAdminSocket: mockDisconnectAdminSocket,
    });

    // Default fetch mock for initial questions load
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/qa/questions') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]), // Default to no questions
        });
      }
      if (url.includes('/approve') || url.includes('/answer')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ _id: url.split('/')[3], isApproved: true, isAnswered: url.includes('/answer') }),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch call: ${url}`));
    });
  });

  test('renders without crashing and fetches initial questions', async () => {
    render(<AdminQATab />);
    // Wait for loading to complete by checking for an element that appears after loading
    await waitFor(() => expect(screen.getByText('Live Q&A Management')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith('/api/qa/questions');
    // Check for empty state if fetch returns empty array
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
  });

  test('displays fetched questions', async () => {
    const initialQuestions = [
      { _id: 'q1', content: 'Pending Question 1', participantName: 'UserA', isApproved: false, isAnswered: false, createdAt: new Date().toISOString() },
      { _id: 'q2', content: 'Approved Question 2', participantName: 'UserB', isApproved: true, isAnswered: false, createdAt: new Date().toISOString() },
      { _id: 'q3', content: 'Answered Question 3', participantName: 'UserC', isApproved: true, isAnswered: true, createdAt: new Date().toISOString() },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialQuestions),
    });

    render(<AdminQATab />);

    await waitFor(() => {
      expect(screen.getByText('Pending Question 1')).toBeInTheDocument();
      expect(screen.getByText('Approved Question 2')).toBeInTheDocument();
      expect(screen.getByText('Answered Question 3')).toBeInTheDocument();
    });
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Answered')).toBeInTheDocument();
  });

  test('calls connectAdminSocket if not connected', () => {
    const localMockConnect = jest.fn();
    mockUseAdminSocketStore.mockReturnValueOnce({
      socket: null,
      connectAdminSocket: localMockConnect, // Use a specific mock for this test
      isConnected: false,
      disconnectAdminSocket: jest.fn(),
    });
    render(<AdminQATab />);
    expect(localMockConnect).toHaveBeenCalled();
  });

  test('handles "Approve" button click', async () => {
    const questionToApprove = { _id: 'q1approve', content: 'Approve Me', isApproved: false, isAnswered: false, createdAt: new Date().toISOString() };
    (fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/qa/questions') return Promise.resolve({ ok: true, json: () => Promise.resolve([questionToApprove]) });
        if (url.endsWith('/approve')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...questionToApprove, isApproved: true }) });
        return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    render(<AdminQATab />);
    await waitFor(() => screen.getByText('Approve Me'));
    
    const approveButton = screen.getByRole('button', { name: /Approve/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/qa/questions/${questionToApprove._id}/approve`, { method: 'PUT' });
    });
    // Socket event 'question_updated' should update the UI, which is mocked here.
    // Direct DOM check for "Approved" status after click relies on the socket mock triggering re-render.
  });

  test('handles "Mark as Answered" button click', async () => {
    const questionToAnswer = { _id: 'q1answer', content: 'Answer Me', isApproved: true, isAnswered: false, createdAt: new Date().toISOString() };
     (fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/qa/questions') return Promise.resolve({ ok: true, json: () => Promise.resolve([questionToAnswer]) });
        if (url.endsWith('/answer')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...questionToAnswer, isAnswered: true }) });
        return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    render(<AdminQATab />);
    await waitFor(() => screen.getByText('Answer Me'));

    const answerButton = screen.getByRole('button', { name: /Mark as Answered/i });
    fireEvent.click(answerButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/qa/questions/${questionToAnswer._id}/answer`, { method: 'PUT' });
    });
  });

  test('sets up and cleans up Socket.IO event listeners from store socket', () => {
    const { unmount } = render(<AdminQATab />);
    
    expect(mockAdminSocket.on).toHaveBeenCalledWith('new_question', expect.any(Function));
    expect(mockAdminSocket.on).toHaveBeenCalledWith('question_updated', expect.any(Function));

    unmount();

    expect(mockAdminSocket.off).toHaveBeenCalledWith('new_question', expect.any(Function));
    expect(mockAdminSocket.off).toHaveBeenCalledWith('question_updated', expect.any(Function));
  });

  test('adds new question from "new_question" socket event', async () => {
    render(<AdminQATab />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/qa/questions')); // Initial load

    const newQuestionHandlerCall = mockAdminSocket.on.mock.calls.find(call => call[0] === 'new_question');
    expect(newQuestionHandlerCall).toBeDefined();
    const newQuestionHandler = newQuestionHandlerCall[1];
    
    const newSocketQuestion = { _id: 'qSocketNew', content: 'Socket New Q', participantName: 'SocketUser', isApproved: false, isAnswered: false, createdAt: new Date().toISOString() };
    
    act(() => {
      newQuestionHandler(newSocketQuestion);
    });

    await waitFor(() => {
      expect(screen.getByText('Socket New Q')).toBeInTheDocument();
    });
  });

  test('updates question from "question_updated" socket event', async () => {
    const initialQuestion = { _id: 'qSocketUpdate', content: 'Original Content', isApproved: false, isAnswered: false, createdAt: new Date().toISOString() };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([initialQuestion]),
    });
    render(<AdminQATab />);
    await waitFor(() => screen.getByText('Original Content'));

    const updatedQuestionHandlerCall = mockAdminSocket.on.mock.calls.find(call => call[0] === 'question_updated');
    expect(updatedQuestionHandlerCall).toBeDefined();
    const updatedQuestionHandler = updatedQuestionHandlerCall[1];

    const updatedSocketQuestion = { ...initialQuestion, content: 'Updated Content Via Socket', isApproved: true };
    
    act(() => {
      updatedQuestionHandler(updatedSocketQuestion);
    });

    await waitFor(() => {
      expect(screen.getByText('Updated Content Via Socket')).toBeInTheDocument();
      // Also check if status pill updated if applicable
      const statusPills = screen.getAllByText('Approved'); // Assuming 'Approved' is the text for the pill
      expect(statusPills.length).toBeGreaterThan(0);
    });
  });

  test('disables action buttons if socket is not connected', async () => {
    const localMockConnect = jest.fn();
    mockUseAdminSocketStore.mockReturnValueOnce({
      socket: null, // No socket instance when not connected for this test
      connectAdminSocket: localMockConnect,
      isConnected: false, // Socket not connected
      disconnectAdminSocket: jest.fn(),
    });
    const questions = [
        { _id: 'q1', content: 'Not Approved Q', isApproved: false, isAnswered: false, createdAt: new Date().toISOString() },
        { _id: 'q2', content: 'Not Answered Q', isApproved: true, isAnswered: false, createdAt: new Date().toISOString() },
    ];
    (fetch as jest.Mock).mockImplementation(async (url) => {
        if (url === '/api/qa/questions') {
            return { ok: true, json: async () => questions };
        }
        return { ok: false, json: async () => ({ message: 'Unhandled mock fetch' })};
    });

    render(<AdminQATab />);
    
    await waitFor(() => {
      expect(screen.getByText('Not Approved Q')).toBeInTheDocument();
      expect(screen.getByText('Not Answered Q')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: /Approve/i });
    expect(approveButton).toBeDisabled();
    
    const markAnsweredButton = screen.getByRole('button', { name: /Mark as Answered/i });
    expect(markAnsweredButton).toBeDisabled();
    expect(localMockConnect).toHaveBeenCalled(); // Ensure connection was attempted
  });

});
