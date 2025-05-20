// Definición de tipos para la aplicación

// Tipo para las preguntas
export interface Question {
  _id: string;
  case?: string; // Caso opcional para proporcionar contexto a la pregunta
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option?: string;
  explanation?: string;
  explanation_image?: string;
  is_active: boolean;
  votingClosed?: boolean;
  timer?: number;
  created_at: Date;
}

// Tipo para la configuración del quiz
export interface QuizConfig {
  _id?: string;
  defaultTimer: number; // Tiempo en segundos para responder cada pregunta
  showRankings: boolean; // Mostrar ranking de participantes
  allowJoinDuringQuiz: boolean; // Permitir que nuevos participantes se unan durante el quiz
  created_at?: Date;
  updated_at?: Date;
}

// Tipo para el estado de la configuración del quiz
export interface QuizConfigState {
  config: QuizConfig;
  isLoading: boolean;
  isRankingVisible: boolean;
  showRanking: () => void;
  hideRanking: () => void;
  saveConfig: (config: Partial<QuizConfig>) => Promise<boolean>;
  getConfig: () => Promise<void>;
  resetConfig: () => void;
}

// Tipo para los votos
export interface Votes {
  a: number;
  b: number;
  c: number;
  [key: string]: number;
}

// Tipo para las estadísticas de votos
export interface VoteStats {
  option: string;
  count: number;
  percentage: number;
}

// Tipo para la respuesta de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Tipo para el estado de autenticación
export interface AuthState {
  isAuthenticated: boolean;
  signIn: (password: string) => Promise<boolean>;
  signOut: () => void;
}

// Tipo para el participante
export interface Participant {
  _id?: string;
  name: string;
  points?: number;
  totalTime?: number;
  correctAnswers?: number;
  totalAnswers?: number;
  created_at?: Date;
}

// Tipo para el estado de participantes
export interface ParticipantState {
  currentParticipant: Participant | null;
  isRegistered: boolean;
  registerParticipant: (name: string) => Promise<boolean>;
  logout: () => void;
  resetSession: () => void;
}

// Tipo para el estado de las preguntas
export interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  votes: Votes;
  hasVoted: boolean;
  timeRemaining: number | null;
  initialized: boolean;
  lastSelectedOption: string | null;
  
  // Funciones
  initialize: () => Promise<void>;
  createQuestion: (question: Omit<Question, '_id' | 'is_active' | 'created_at'>) => Promise<void>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  startVoting: (id: string) => Promise<void>;
  stopVoting: (id: string, correctOption?: string) => Promise<void>;
  submitVote: (questionId: string, option: string) => Promise<void>;
  setHasVoted: (value: boolean) => void;
  updateQuestionTimer: (id: string, seconds: number) => Promise<void>;
  checkTimeRemaining: () => void;
  clearView: () => Promise<void>;
  clearUserVoteState: () => void;
}
