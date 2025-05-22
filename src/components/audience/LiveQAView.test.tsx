import React from 'react';
import { render, screen, fireEvent, waitFor, act as rtlAct } from '@testing-library/react'; // Renamed act to rtlAct
import '@testing-library/jest-dom';
import LiveQAView from './LiveQAView'; // Adjust path as necessary
import { useParticipantStore } from '../../store/participantStore'; // Adjust path

// Mock global fetch
global.fetch = jest.fn();

// Mock Socket.IO client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  // Add any other methods your component uses from the socket client
};

// Mock useParticipantStore
jest.mock('../../store/participantStore', () => ({
  useParticipantStore: jest.fn(),
}));

const mockUseParticipantStore = useParticipantStore as jest.Mock;

describe('LiveQAView Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();

    // Default mock for participant store
    mockUseParticipantStore.mockReturnValue({
      currentParticipant: { name: 'TestUser', _id: 'participant1' },
    });

    // Default fetch mock for initial questions load (audience view) - this will be general
    // Specific tests can override with mockImplementationOnce if needed
    (fetch as jest.Mock).mockImplementation(async (url, options) => {
      if (url.startsWith('/api/qa/questions/audience')) {
        return { ok: true, json: async () => [] };
      }
      if (url === '/api/qa/questions' && options?.method === 'POST') {
        const body = options.body ? JSON.parse(options.body as string) : {};
        return { 
          ok: true, 
          json: async () => ({ 
            _id: `newQ-${Date.now()}`, 
            content: body.content || 'Mocked Submission', 
            participantName: body.participantName, 
            isApproved: false, 
            isAnswered: false, 
            createdAt: new Date().toISOString(),
            roomCode: body.roomCode 
          }) 
        };
      }
      // Fallback for any other unhandled calls, good for debugging tests
      console.warn(`Unhandled fetch mock in beforeEach: ${url}`, options);
      return Promise.reject(new Error(`Unhandled fetch call in default mock: ${url}`));
    });
  });

  test('renders without crashing', async () => {
    await rtlAct(async () => {
      render(<LiveQAView socket={mockSocket as any} roomCode="TESTROOM" />);
    });
    expect(screen.getByText('Live Q&A')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your question here...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit Question' })).toBeEnabled());
    expect(fetch).toHaveBeenCalledWith('/api/qa/questions/audience?roomCode=TESTROOM');
  });

  test('allows typing in the question input', () => {
    render(<LiveQAView socket={mockSocket as any} />);
    const textarea = screen.getByPlaceholderText('Type your question here...');
    fireEvent.change(textarea, { target: { value: 'My test question' } });
    expect(textarea).toHaveValue('My test question');
  });

  test('submitting a question calls the API and clears input', async () => {
    // This test will use the default mock from beforeEach for the POST
    await rtlAct(async () => {
      render(<LiveQAView socket={mockSocket as any} roomCode="TEST1" />);
    });
    const textarea = screen.getByPlaceholderText('Type your question here...');
    const submitButton = await screen.findByRole('button', { name: 'Submit Question' });

    await rtlAct(async () => {
      fireEvent.change(textarea, { target: { value: 'A valid question?' } });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/qa/questions', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'A valid question?',
          participantName: 'TestUser',
          roomCode: 'TEST1',
        }),
      });
    });
    // Use waitFor to ensure state update for textarea clearing has completed
    await waitFor(() => expect(textarea).toHaveValue(''));
  });

  test('displays fetched questions', async () => {
    const initialQuestions = [
      { _id: 'q1', content: 'Question 1 (Approved)', participantName: 'UserA', isApproved: true, isAnswered: false, createdAt: new Date().toISOString() },
      { _id: 'q2', content: 'Question 2 (Answered)', participantName: 'UserB', isApproved: true, isAnswered: true, createdAt: new Date().toISOString() },
    ];
    (fetch as jest.Mock).mockImplementation(async (url) => { // Make sure this mock is specific enough or use mockImplementationOnce
      if (url.startsWith('/api/qa/questions/audience')) {
        return {
          ok: true,
          json: async () => initialQuestions,
        };
      }
      // Fallback for POST during this test if any, though not expected for this specific test logic
      return { ok: true, json: async () => ({ _id: 'temp', content: '' }) };
    });
    
    await rtlAct(async () => {
      render(<LiveQAView socket={mockSocket as any} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Question 1 (Approved)')).toBeInTheDocument();
      // Ensure the "Approved" status text is found. It might be multiple elements.
      expect(screen.getAllByText('Approved')[0]).toBeInTheDocument(); 
      expect(screen.getByText('Question 2 (Answered)')).toBeInTheDocument();
      expect(screen.getAllByText('Answered')[0]).toBeInTheDocument();
    });
  });
  
  test('handles anonymous question submission if participant is not available', async () => {
    mockUseParticipantStore.mockReturnValue({ currentParticipant: null }); // No participant
    await rtlAct(async () => {
      render(<LiveQAView socket={mockSocket as any} roomCode="TEST_ANON" />);
    });
    
    const textarea = screen.getByPlaceholderText('Type your question here...');
    const submitButton = await screen.findByRole('button', { name: 'Submit Question' });

    await rtlAct(async () => {
      fireEvent.change(textarea, { target: { value: 'Anonymous question' } });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/qa/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Anonymous question',
          // participantName should be undefined or not present
          roomCode: 'TEST_ANON',
        }),
      });
    });
  });

  test('sets up and cleans up Socket.IO event listeners', () => {
    const { unmount } = render(<LiveQAView socket={mockSocket as any} roomCode="SOCKETTEST" />);
    
    expect(mockSocket.emit).toHaveBeenCalledWith('join_audience_room', 'SOCKETTEST');
    expect(mockSocket.on).toHaveBeenCalledWith('question_approved', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('question_answered', expect.any(Function));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('question_approved', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('question_answered', expect.any(Function));
    expect(mockSocket.emit).toHaveBeenCalledWith('leave_audience_room', 'SOCKETTEST');
  });

  test('updates question list on "question_approved" event', async () => {
    render(<LiveQAView socket={mockSocket as any} />);
    
    // Find the mock function for 'question_approved'
    const approvedHandlerCall = mockSocket.on.mock.calls.find(call => call[0] === 'question_approved');
    expect(approvedHandlerCall).toBeDefined();
    const approvedHandler = approvedHandlerCall[1];

    const newApprovedQuestion = { _id: 'qNew', content: 'Newly Approved Q', participantName: 'UserC', isApproved: true, isAnswered: false, createdAt: new Date().toISOString() };
    
    // Simulate the event
    rtlAct(() => { // Ensure state updates are wrapped in act
        approvedHandler(newApprovedQuestion);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Newly Approved Q')).toBeInTheDocument();
      // Check for status "Approved"
      const statusElements = screen.getAllByText('Approved');
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  test('updates question status on "question_answered" event', async () => {
    const initialQuestions = [
      { _id: 'q1', content: 'Q to be answered', participantName: 'UserA', isApproved: true, isAnswered: false, createdAt: new Date().toISOString() },
    ];
    
    // Mock fetch for this specific test to control initial state
    (fetch as jest.Mock).mockImplementation(async (url) => {
      if (url.startsWith('/api/qa/questions/audience')) {
        return { ok: true, json: async () => initialQuestions };
      }
      // Fallback for other POST calls if any during this test
      return { ok: true, json: async () => ({ _id: 'temp', content: ''}) };
    });

    render(<LiveQAView socket={mockSocket as any} />);
    
    await waitFor(() => {
      expect(screen.getByText('Q to be answered')).toBeInTheDocument();
    });

    const answeredHandlerCall = mockSocket.on.mock.calls.find(call => call[0] === 'question_answered');
    expect(answeredHandlerCall).toBeDefined();
    const answeredHandler = answeredHandlerCall[1];

    const answeredQuestionUpdate = { _id: 'q1', content: 'Q to be answered', participantName: 'UserA', isApproved: true, isAnswered: true, createdAt: initialQuestions[0].createdAt };
    
    rtlAct(() => {
        answeredHandler(answeredQuestionUpdate);
    });

    await waitFor(() => {
      expect(screen.getByText('Q to be answered')).toBeInTheDocument();
      expect(screen.getByText('Answered')).toBeInTheDocument(); // Check for "Answered" status
    });
  });
  
});

// No need to re-import act, it's imported as rtlAct from @testing-library/react
