// Definición de tipos para la aplicación

// Tipo para las preguntas
export interface Question {
  _id: string;
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option?: string;
  explanation?: string;
  is_active: boolean;
  votingClosed?: boolean;
  timer?: number;
  created_at: Date;
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

// Tipo para el estado de las preguntas
export interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  votes: Votes;
  hasVoted: boolean;
  timeRemaining: number | null;
  initialized: boolean;
  
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
}
