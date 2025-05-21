import { create } from 'zustand';
import { TournamentState, TournamentRound, TournamentMatch } from '../types';
import { generateTournamentAvatars } from '../utils/avatarGenerator';

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useTournamentStore = create<TournamentState>((set, get) => ({
  isActive: false,
  rounds: [],
  currentMatchId: null,
  participants: [],
  winner: null,
  error: null,
  
  loadParticipants: async () => {
    try {
      const response = await fetch('/api/participants');
      if (!response.ok) {
        throw new Error('Error al cargar participantes');
      }
      
      const participants = await response.json();
      set({ participants });
    } catch (error) {
      console.error('Error al cargar participantes:', error);
      set({ error: 'No se pudieron cargar los participantes' });
    }
  },
  
  startTournament: async (participantIds: string[]) => {
    try {
      // Verificar que hay suficientes participantes y que el nu00famero es potencia de 2
      if (participantIds.length < 2) {
        throw new Error('Se necesitan al menos 2 participantes para iniciar un torneo');
      }
      
      if (participantIds.length % 2 !== 0) {
        throw new Error('El nu00famero de participantes debe ser par para un torneo');
      }
      
      // Generar avatares para los participantes
      const avatars = generateTournamentAvatars(participantIds.length);
      
      // Obtener informaciu00f3n de los participantes seleccionados
      const { participants } = get();
      const selectedParticipants = participants.filter(p => p._id && participantIds.includes(p._id));
      
      // Asignar avatares a los participantes seleccionados
      const participantsWithAvatars = selectedParticipants.map((participant, index) => ({
        ...participant,
        avatar: avatars[index].avatar,
        tournamentName: avatars[index].name
      }));
      
      // Si no se encuentran todos los participantes, lanzar error
      if (participantsWithAvatars.length !== participantIds.length) {
        throw new Error('No se pudieron encontrar todos los participantes seleccionados');
      }
      
      // Generar la estructura del torneo
      const rounds: TournamentRound[] = [];
      let matchesInRound = participantIds.length / 2;
      const totalRounds = Math.log2(participantIds.length);
      
      // Crear las rondas desde la final hacia atru00e1s
      for (let roundNumber = totalRounds; roundNumber >= 1; roundNumber--) {
        const roundId = generateId();
        const roundMatches: TournamentMatch[] = [];
        
        for (let i = 0; i < matchesInRound; i++) {
          const matchId = generateId();
          roundMatches.push({
            id: matchId,
            matchNumber: i + 1, // 1-based para mejor visualizaciu00f3n
            roundId,
            status: roundNumber === 1 ? 'pending' : 'pending',
            // Los participantes se asignan solo en la primera ronda
          });
        }
        
        rounds.unshift({
          id: roundId,
          roundNumber,
          matches: roundMatches,
        });
        
        matchesInRound /= 2;
      }
      
      // Conectar los partidos entre rondas (cada partido debe saber a cuu00e1l avanzaru00e1 su ganador)
      for (let i = 0; i < rounds.length - 1; i++) {
        const currentRoundMatches = rounds[i].matches;
        const nextRoundMatches = rounds[i + 1].matches;
        
        for (let j = 0; j < currentRoundMatches.length; j++) {
          const nextMatchIndex = Math.floor(j / 2);
          currentRoundMatches[j].nextMatchId = nextRoundMatches[nextMatchIndex].id;
        }
      }
      
      // Asignar participantes a los partidos de la primera ronda
      const firstRound = rounds[0];
      let participantIndex = 0;
      
      for (let i = 0; i < firstRound.matches.length; i++) {
        const match = firstRound.matches[i];
        const participant1 = participantsWithAvatars[participantIndex++];
        const participant2 = participantsWithAvatars[participantIndex++];
        
        match.participant1Id = participant1._id;
        match.participant1Name = participant1.tournamentName || participant1.name;
        match.participant1Avatar = participant1.avatar;
        match.participant2Id = participant2._id;
        match.participant2Name = participant2.tournamentName || participant2.name;
        match.participant2Avatar = participant2.avatar;
        match.status = 'in_progress'; // Establecer como partido en progreso
      }
      
      // Guardar estructura del torneo en el estado
      set({
        isActive: true,
        rounds,
        currentMatchId: firstRound.matches[0].id, // Seleccionar el primer partido
        error: null,
        winner: null,
      });
      
    } catch (error: unknown) {
      console.error('Error al iniciar el torneo:', error);
      const message = error instanceof Error ? error.message : 'Error al iniciar el torneo';
      set({ error: message });
      throw error;
    }
  },
  
  advanceParticipant: async (matchId: string, winnerId: string) => {
    try {
      const { rounds, participants } = get();
      let updated = false;
      
      // Encontrar el partido y actualizar el ganador
      const updatedRounds = rounds.map(round => {
        const updatedMatches = round.matches.map(match => {
          if (match.id === matchId) {
            // Si ya hay un ganador y es el mismo, no hacer nada
            if (match.winnerId === winnerId) {
              return match;
            }
            
            // Buscar la informaciu00f3n del participante ganador
            const winner = participants.find(p => p._id === winnerId);
            if (!winner) {
              throw new Error('No se pudo encontrar la informaciu00f3n del participante');
            }
            
            updated = true;
            return {
              ...match,
              winnerId,
              status: 'completed',
            };
          }
          return match;
        });
        
        return {
          ...round,
          matches: updatedMatches,
        };
      }) as TournamentRound[];
      
      if (!updated) {
        throw new Error('No se pudo encontrar el partido especificado');
      }
      
      // Buscar el siguiente partido y actualizar los participantes
      const currentMatch = rounds.flatMap(r => r.matches).find(m => m.id === matchId);
      if (!currentMatch || !currentMatch.nextMatchId) {
        // Si no hay siguiente partido, este es el partido final y tenemos un ganador
        const winner = participants.find(p => p._id === winnerId);
        set({ 
          rounds: updatedRounds,
          winner: winner || null,
        });
        return;
      }
      
      // Obtener el partido siguiente
      const nextMatch = rounds.flatMap(r => r.matches).find(m => m.id === currentMatch.nextMatchId);
      if (!nextMatch) {
        throw new Error('No se pudo encontrar el siguiente partido');
      }
      
      // Determinar si el ganador va a la posiciu00f3n 1 o 2 del siguiente partido
      // Basado en el nu00famero de partido (par o impar)
      const winnerName = currentMatch.participant1Id === winnerId 
        ? currentMatch.participant1Name 
        : currentMatch.participant2Name;
      
      const isEvenMatch = currentMatch.matchNumber % 2 === 0;
      
      // Si es par, va a la posiciu00f3n 2, si es impar, va a la posiciu00f3n 1
      if (isEvenMatch) {
        nextMatch.participant2Id = winnerId;
        nextMatch.participant2Name = winnerName;
      } else {
        nextMatch.participant1Id = winnerId;
        nextMatch.participant1Name = winnerName;
      }
      
      // Si ambos participantes estu00e1n asignados, establecer el estado como 'in_progress'
      if (nextMatch.participant1Id && nextMatch.participant2Id) {
        nextMatch.status = 'in_progress';
      }
      
      // Actualizar estado
      set({
        rounds: updatedRounds,
        currentMatchId: nextMatch.status === 'in_progress' ? nextMatch.id : get().currentMatchId,
      });
      
    } catch (error: unknown) {
      console.error('Error al avanzar participante:', error);
      const message = error instanceof Error ? error.message : 'Error al avanzar participante';
      set({ error: message });
      throw error;
    }
  },
  
  selectMatch: (matchId: string) => {
    set({ currentMatchId: matchId });
  },
  
  resetTournament: async () => {
    set({
      isActive: false,
      rounds: [],
      currentMatchId: null,
      winner: null,
      error: null,
    });
    
    await get().loadParticipants();
  },
}));