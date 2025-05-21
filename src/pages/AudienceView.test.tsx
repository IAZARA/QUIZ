import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudienceView from './AudienceView';
import { useQuestionStore } from '../store/questionStore';
import { useParticipantStore } from '../store/participantStore';
import { useQuizConfigStore } from '../store/quizConfigStore';
import { useTournamentStore } from '../store/tournamentStore';
import { useWordCloudStore } from '../store/wordCloudStore';
import { useContactStore } from '../store/contactStore';
import { Question, TournamentParticipant, TournamentMatch, TournamentRound } from '../types';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon" />,
  QrCode: () => <div data-testid="qrcode-icon" />,
  X: () => <div data-testid="x-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Cloud: () => <div data-testid="cloud-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Star: () => <div data-testid="star-icon" />,
  ShieldAlert: () => <div data-testid="shieldalert-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
}));

// Mock react-qr-code
jest.mock('react-qr-code', () => () => <div data-testid="qr-code-component" />);

// Mock TimerSound component
jest.mock('../components/TimerSound', () => () => <div data-testid="timer-sound-component" />);

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};
jest.mock('socket.io-client', () => jest.fn(() => mockSocket));


// Mock Zustand stores
jest.mock('../store/questionStore');
jest.mock('../store/participantStore');
jest.mock('../store/quizConfigStore');
jest.mock('../store/tournamentStore');
jest.mock('../store/wordCloudStore');
jest.mock('../store/contactStore');


const mockUseQuestionStore = useQuestionStore as jest.Mock;
const mockUseParticipantStore = useParticipantStore as jest.Mock;
const mockUseQuizConfigStore = useQuizConfigStore as jest.Mock;
const mockUseTournamentStore = useTournamentStore as jest.Mock;
const mockUseWordCloudStore = useWordCloudStore as jest.Mock;
const mockUseContactStore = useContactStore as jest.Mock;

const mockDefaultQuestion: Question = {
  _id: 'q1',
  content: 'Sample Question Content',
  option_a: 'Option A',
  option_b: 'Option B',
  option_c: 'Option C',
  case: 'Sample case study.',
  is_active: true,
  votingClosed: false,
  correct_option: 'a',
  explanation: 'This is why A is correct.',
  explanation_image: 'image.png',
  timer: 60,
  quizId: 'quiz1',
};

const mockCurrentParticipant: TournamentParticipant = {
  _id: 'participant123',
  name: 'Test User',
  tournamentName: 'TestUser',
  avatar: 'TU',
  isPlayer: true,
  socketId: 'socket123',
  isOnline: true,
};

describe('AudienceView', () => {
  beforeEach(() => {
    // Provide default mock implementations for all stores
    mockUseQuestionStore.mockReturnValue({
      currentQuestion: null,
      votes: {},
      submitVote: jest.fn().mockResolvedValue({}),
      hasVoted: false,
      setHasVoted: jest.fn(),
      timeRemaining: null,
    });
    mockUseParticipantStore.mockReturnValue({
      currentParticipant: mockCurrentParticipant, // Default to having a participant
      logout: jest.fn(),
    });
    mockUseQuizConfigStore.mockReturnValue({
      config: { showRankings: true, allowRegistration: true, quizId: 'defaultQuiz', directElimination: false },
      getConfig: jest.fn(),
      isRankingVisible: false,
      // Ensure all functions used by the component are mocked
      fetchConfig: jest.fn(),
      updateConfig: jest.fn(),
      toggleRankings: jest.fn(),
      toggleRegistration: jest.fn(),
      setQuizId: jest.fn(),
      setDirectElimination: jest.fn(),
      setIsRankingVisible: jest.fn(),
    });
    mockUseTournamentStore.mockReturnValue({
      isActive: false,
      rounds: [],
      winner: null,
      loadParticipants: jest.fn(),
      // other store properties...
      matches: [], 
      participants: [],
      currentMatchId: null,
      setCurrentMatchId: jest.fn(),
      setMatchWinner: jest.fn(),
      advanceWinner: jest.fn(),
      setTournamentStatus: jest.fn(),
      resetTournament: jest.fn(),
      generateBracket: jest.fn(),
      completeMatch: jest.fn(),
      updateMatchScore: jest.fn(),
    });
    mockUseWordCloudStore.mockReturnValue({
      isActive: false,
      words: [],
    });
    mockUseContactStore.mockReturnValue({
      contacts: [],
      loadContacts: jest.fn(),
      addContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
    });

    // Clear socket mock calls
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders "Waiting for question" message when no currentQuestion', () => {
    render(<AudienceView />);
    expect(screen.getByText(/Esperando a que comience la siguiente pregunta.../i)).toBeInTheDocument();
  });

  test('renders question content when currentQuestion is available', () => {
    mockUseQuestionStore.mockReturnValueOnce({
      ...mockUseQuestionStore.mock.results[0].value, // get default mock values
      currentQuestion: mockDefaultQuestion,
    });
    render(<AudienceView />);
    expect(screen.getByText(mockDefaultQuestion.content)).toBeInTheDocument();
    expect(screen.getByText(mockDefaultQuestion.option_a)).toBeInTheDocument();
  });

  test('renders Ranking modal when isRankingVisible is true', () => {
    mockUseQuizConfigStore.mockReturnValueOnce({
      ...mockUseQuizConfigStore.mock.results[0].value, // get default mock values
      isRankingVisible: true,
      config: { ...mockUseQuizConfigStore.mock.results[0].value.config, showRankings: true },
    });
    render(<AudienceView />);
    expect(screen.getByText(/Clasificación Actual/i)).toBeInTheDocument();
  });

  describe('Tournament Outcome Modals', () => {
    const participant1: TournamentParticipant = mockCurrentParticipant; // Our user
    const participant2: TournamentParticipant = { _id: 'p2', name: 'Opponent', tournamentName: 'Opponent', avatar: 'OP', isPlayer: true, socketId: 's2', isOnline: true };

    test('renders "Advanced" modal when participant wins a match (not final)', async () => {
      const matchCompletedAdvanced: TournamentMatch = {
        id: 'm1', matchNumber: 1, status: 'completed', 
        participant1Id: participant1._id, participant1Name: participant1.name, 
        participant2Id: participant2._id, participant2Name: participant2.name, 
        winnerId: participant1._id, // Current participant won
        roundId: 'round1', scoreParticipant1: 1, scoreParticipant2: 0,
        updatedAt: new Date().toISOString(),
      };
      const rounds: TournamentRound[] = [
        { id: 'round1', name: 'Round 1', matches: [matchCompletedAdvanced], order: 0, isCompleted: false },
        { id: 'round2', name: 'Final', matches: [], order: 1, isCompleted: false } // A subsequent round exists
      ];

      mockUseTournamentStore.mockReturnValue({
        ...mockUseTournamentStore.mock.results[0].value,
        isActive: true,
        rounds: rounds,
        winner: null, // No overall tournament winner yet
      });
      mockUseParticipantStore.mockReturnValue({ // Ensure currentParticipant is set
        ...mockUseParticipantStore.mock.results[0].value,
        currentParticipant: participant1,
      });
      
      render(<AudienceView />);
      
      await waitFor(() => {
        expect(screen.getByText(/¡Has Avanzado!/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/¡Felicidades! Has ganado tu encuentro y pasas a la siguiente ronda./i)).toBeInTheDocument();

      // Test auto-dismissal
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      await waitFor(() => {
        expect(screen.queryByText(/¡Has Avanzado!/i)).not.toBeInTheDocument();
      });
    });

    test('renders "Eliminated" modal when participant loses a match', async () => {
      const matchCompletedEliminated: TournamentMatch = {
        id: 'm2', matchNumber: 2, status: 'completed', 
        participant1Id: participant1._id, participant1Name: participant1.name, 
        participant2Id: participant2._id, participant2Name: participant2.name, 
        winnerId: participant2._id, // Current participant lost
        roundId: 'round1', scoreParticipant1: 0, scoreParticipant2: 1,
        updatedAt: new Date().toISOString(),
      };
      const rounds: TournamentRound[] = [{ id: 'round1', name: 'Round 1', matches: [matchCompletedEliminated], order: 0, isCompleted: true }];
      
      mockUseTournamentStore.mockReturnValue({
         ...mockUseTournamentStore.mock.results[0].value,
        isActive: true,
        rounds: rounds,
        winner: null,
      });
      mockUseParticipantStore.mockReturnValue({
        ...mockUseParticipantStore.mock.results[0].value,
        currentParticipant: participant1,
      });

      render(<AudienceView />);

      await waitFor(() => {
        expect(screen.getByText(/Has Sido Eliminado/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/No te preocupes, ¡diste una gran batalla! Gracias por participar./i)).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      await waitFor(() => {
        expect(screen.queryByText(/Has Sido Eliminado/i)).not.toBeInTheDocument();
      });
    });

    test('does NOT render "Advanced" modal if participant wins the FINAL match', async () => {
        const finalMatchWon: TournamentMatch = {
            id: 'finalMatch', matchNumber: 3, status: 'completed',
            participant1Id: participant1._id, participant1Name: participant1.name,
            participant2Id: participant2._id, participant2Name: participant2.name,
            winnerId: participant1._id, // Current participant won
            roundId: 'finalRound', scoreParticipant1: 1, scoreParticipant2: 0,
            updatedAt: new Date().toISOString(),
        };
        const rounds: TournamentRound[] = [
            { id: 'finalRound', name: 'Final', matches: [finalMatchWon], order: 0, isCompleted: true }
        ];

        mockUseTournamentStore.mockReturnValue({
            ...mockUseTournamentStore.mock.results[0].value,
            isActive: true,
            rounds: rounds,
            winner: participant1, // Tournament winner is now set
        });
         mockUseParticipantStore.mockReturnValue({
            ...mockUseParticipantStore.mock.results[0].value,
            currentParticipant: participant1,
        });

        render(<AudienceView />);

        // Wait for a moment to ensure modal would have appeared if logic was wrong
        await act(async () => {
          jest.advanceTimersByTime(200); // Short delay
        });
        
        expect(screen.queryByText(/¡Has Avanzado!/i)).not.toBeInTheDocument();
        // The main winner display in TournamentAudienceView should handle this.
    });
  });
});
