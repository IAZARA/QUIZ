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
  soundsEnabled?: boolean; // Habilitar o deshabilitar sonidos globalmente
  masterVolume?: number; // Volumen maestro para todos los sonidos (0.0 a 1.0)
  logoUrl?: string; // URL del logo para el quiz
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
  avatar?: string; // Emoji o código de avatar para el torneo
  tournamentName?: string; // Nombre en formato "Animal Color" para el torneo
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

// TIPOS PARA EL TORNEO

// Tipo para un partido del torneo
export interface TournamentMatch {
  id: string;
  matchNumber: number;
  roundId: string;
  participant1Id?: string;
  participant2Id?: string;
  participant1Name?: string;
  participant2Name?: string;
  participant1Avatar?: string;
  participant2Avatar?: string;
  participant1Score?: number;
  participant2Score?: number;
  winnerId?: string;
  status: 'pending' | 'in_progress' | 'completed';
  nextMatchId?: string;
}

// Tipo para una ronda del torneo
export interface TournamentRound {
  id: string;
  roundNumber: number;
  name?: string;
  matches: TournamentMatch[];
}

// Tipo para el estado del torneo
export interface TournamentState {
  isActive: boolean;
  rounds: TournamentRound[];
  currentMatchId: string | null;
  participants: Participant[];
  winner: Participant | null;
  error: string | null;
  
  // Funciones
  startTournament: (participantIds: string[]) => Promise<void>;
  advanceParticipant: (matchId: string, winnerId: string) => Promise<void>;
  selectMatch: (matchId: string) => void;
  loadParticipants: () => Promise<void>;
  resetTournament: () => Promise<void>;
}

// TIPOS PARA CONTACTOS

// Tipo para un contacto
export interface Contact {
  _id?: string;
  name: string;
  email: string;
  whatsapp: string; // Número de teléfono con formato internacional
  created_at?: Date;
}

// Tipo para el estado de contactos
export interface ContactState {
  contacts: Contact[];
  isContactsActive: boolean;
  error: string | null;
  
  // Funciones
  addContact: (contact: Omit<Contact, '_id' | 'created_at'>) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  loadContacts: () => Promise<void>;
  activateContacts: () => Promise<void>;
  deactivateContacts: () => Promise<void>;
}

// Tipo para una pregunta de la audiencia (Audience Q&A)
export interface AudienceQuestion {
  _id: string;
  text: string;
  author?: string; // Optional author
  isAnswered: boolean;
  upvotes: number; // Number of upvotes
  voters?: string[]; // Array of user IDs who have upvoted
  createdAt: string; // O Date, dependiendo de cómo se serialice
}

// Tipo para un documento compartido
export interface IDocument {
  _id: string;
  originalName: string;
  filename: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadDate: string; // O Date
  url: string;
}

// Tipo para el estado de compartición de documentos
export interface DocumentSharingState {
  isDocumentsActive: boolean;
  documents: IDocument[];
  error: string | null;
  isLoading: boolean;
  activateDocumentsView: () => Promise<void>;
  deactivateDocumentsView: () => Promise<void>;
  loadDocuments: () => Promise<void>;
  setDocuments: (documents: IDocument[]) => void;
}

// Tipo para una reseña de evento
export interface Review {
  _id: string;
  eventId: string;
  rating: number;
  comment: string;
  authorId: string; // Puede ser 'anonymous' o el ID de un participante
  isAnonymous: boolean;
  createdAt: string; // Fecha en formato ISO string
}
