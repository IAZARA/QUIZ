// Rutas del API para el torneo
import { ObjectId } from 'mongodb';

// Función para generar nombres de animales y colores para los avatares
const animals = [
  'Tigre', 'León', 'Elefante', 'Jirafa', 'Delfín', 'Águila', 'Lobo',
  'Zorro', 'Oso', 'Búho', 'Panda', 'Koala', 'Cebra', 'Pingüino', 'Tortuga',
  'Camaleón', 'Jaguar', 'Rinoceronte', 'Mapache', 'Canguro', 'Loro', 'Alce',
  'Camello', 'Cocodrilo', 'Puma', 'Gorila', 'Hipopótamo', 'Foca', 'Nutria', 'Tucán'
];

const colors = [
  'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Rosa', 
  'Turquesa', 'Dorado', 'Plateado', 'Negro', 'Blanco', 'Marrón', 
  'Gris', 'Celeste', 'Violeta', 'Coral', 'Cian', 'Magenta', 'Lima'
];

// Función para generar avatares únicos para los participantes
const generateTournamentAvatars = (count) => {
  const avatars = [];
  const usedCombinations = new Set();
  
  for (let i = 0; i < count; i++) {
    let animal, color, combination;
    
    // Generar combinaciones únicas
    do {
      animal = animals[Math.floor(Math.random() * animals.length)];
      color = colors[Math.floor(Math.random() * colors.length)];
      combination = `${animal} ${color}`;
    } while (usedCombinations.has(combination) && usedCombinations.size < animals.length * colors.length);
    
    usedCombinations.add(combination);
    
    // Asignar emoji según el animal
    const animalEmojis = {
      'Tigre': '🐯', 'León': '🦁', 'Elefante': '🐘', 'Jirafa': '🦒',
      'Delfín': '🐬', 'Águila': '🦅', 'Lobo': '🐺', 'Zorro': '🦊',
      'Oso': '🐻', 'Búho': '🦉', 'Panda': '🐼', 'Koala': '🐨',
      'Cebra': '🦓', 'Pingüino': '🐧', 'Tortuga': '🐢', 'Camaleón': '🦎',
      'Loro': '🦜', 'Cocodrilo': '🐊', 'Gorila': '🦍', 'Hipopótamo': '🦛',
      'Foca': '🦭', 'Nutria': '🦦', 'Tucán': '🦤'
    };
    
    const avatar = animalEmojis[animal] || '🐾';
    avatars.push({ name: combination, avatar });
  }
  
  return avatars;
};

export default function setupTournamentRoutes(app, io, db) {
  // Iniciar un nuevo torneo
  app.post('/api/tournament/start', async (req, res) => {
    try {
      const { participantIds } = req.body;
      
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: 'Se requieren al menos 2 participantes para iniciar un torneo' 
        });
      }
      
      // Validar que el número de participantes sea una potencia de 2 (2, 4, 8, 16, etc.)
      if ((participantIds.length & (participantIds.length - 1)) !== 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'El nu00famero de participantes debe ser una potencia de 2' 
        });
      }
      
      // Verificar que todos los participantes existan
      const participants = await db.collection('participants')
        .find({ _id: { $in: participantIds.map(id => new ObjectId(id)) } })
        .toArray();
      
      if (participants.length !== participantIds.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Algunos participantes no existen' 
        });
      }
      
      // Generar avatares para los participantes
      const avatars = generateTournamentAvatars(participantIds.length);
      
      // Asignar avatares a los participantes
      const participantsWithAvatars = participants.map((participant, index) => ({
        ...participant,
        avatar: avatars[index].avatar,
        tournamentName: avatars[index].name
      }));
      
      // Actualizar participantes en la base de datos con sus avatares de torneo
      for (const participant of participantsWithAvatars) {
        await db.collection('participants').updateOne(
          { _id: participant._id },
          { $set: { avatar: participant.avatar, tournamentName: participant.tournamentName } }
        );
      }
      
      // Generar la estructura del torneo
      const tournament = {
        status: 'active',
        participantIds,
        created_at: new Date(),
        rounds: [],
        currentMatchId: null,
        winner: null
      };
      
      // Crear las rondas desde la primera hacia la final
      let matchesInRound = participantIds.length / 2;
      let totalRounds = Math.log2(participantIds.length);
      let roundNumber = 1;
      let matchNumber = 1;
      
      while (roundNumber <= totalRounds) {
        const round = {
          roundNumber,
          matches: []
        };
        
        // Crear los partidos de esta ronda
        for (let i = 0; i < matchesInRound; i++) {
          const match = {
            matchNumber: matchNumber++,
            status: roundNumber === 1 ? 'ready' : 'pending',
            participant1Id: null,
            participant2Id: null,
            winnerId: null,
            created_at: new Date()
          };
          
          // En la primera ronda, asignar participantes
          if (roundNumber === 1) {
            const participant1Id = participantIds[i * 2];
            const participant2Id = participantIds[i * 2 + 1];
            
            match.participant1Id = participant1Id;
            match.participant2Id = participant2Id;
            
            // Buscar los participantes con sus avatares
            const participant1 = participantsWithAvatars.find(p => p._id.toString() === participant1Id);
            const participant2 = participantsWithAvatars.find(p => p._id.toString() === participant2Id);
            
            if (participant1) {
              match.participant1Name = participant1.tournamentName || participant1.name;
              match.participant1Avatar = participant1.avatar;
            }
            
            if (participant2) {
              match.participant2Name = participant2.tournamentName || participant2.name;
              match.participant2Avatar = participant2.avatar;
            }
          }
          
          round.matches.push(match);
        }
        
        tournament.rounds.push(round);
        matchesInRound /= 2;
        roundNumber++;
      }
      
      // Si ya existe un torneo activo, actualizarlo
      const existingTournament = await db.collection('tournaments').findOne({ status: 'active' });
      
      if (existingTournament) {
        await db.collection('tournaments').updateOne(
          { _id: existingTournament._id },
          { $set: tournament }
        );
        tournament._id = existingTournament._id;
      } else {
        // Crear nuevo torneo
        const result = await db.collection('tournaments').insertOne(tournament);
        tournament._id = result.insertedId;
      }
      
      // Emitir evento para notificar a todos los clientes
      io.emit('tournament_started', { tournamentId: tournament._id });
      
      res.json({
        success: true,
        tournament
      });
    } catch (error) {
      console.error('Error al iniciar torneo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar torneo',
        error: error.message
      });
    }
  });

  // Obtener el estado actual del torneo
  app.get('/api/tournament', async (req, res) => {
    try {
      // Buscar torneo activo
      const tournament = await db.collection('tournaments')
        .findOne({ status: 'active' });
      
      if (!tournament) {
        return res.json({
          success: true,
          active: false,
          message: 'No hay torneos activos'
        });
      }
      
      // Obtener informaciu00f3n de participantes para incluir nombres
      const participantIds = tournament.participantIds.map(id => new ObjectId(id));
      const participants = await db.collection('participants')
        .find({ _id: { $in: participantIds } })
        .toArray();
      
      // Mapear IDs a nombres de participantes
      const participantMap = participants.reduce((map, p) => {
        map[p._id.toString()] = p.name;
        return map;
      }, {});
      
      // Agregar nombres de participantes a los partidos
      const roundsWithNames = tournament.rounds.map(round => {
        const matchesWithNames = round.matches.map(match => {
          return {
            ...match,
            participant1Name: match.participant1Id ? participantMap[match.participant1Id] : null,
            participant2Name: match.participant2Id ? participantMap[match.participant2Id] : null
          };
        });
        
        return {
          ...round,
          matches: matchesWithNames
        };
      });
      
      res.json({
        success: true,
        active: true,
        tournament: {
          ...tournament,
          rounds: roundsWithNames
        }
      });
    } catch (error) {
      console.error('Error al obtener estado del torneo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estado del torneo',
        error: error.message
      });
    }
  });

  // Avanzar un participante a la siguiente ronda
  app.post('/api/tournament/advance', async (req, res) => {
    try {
      const { matchId, winnerId } = req.body;
      
      if (!matchId || !winnerId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere matchId y winnerId'
        });
      }
      
      // Obtener el torneo activo
      const tournament = await db.collection('tournaments').findOne({ status: 'active' });
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'No hay torneos activos'
        });
      }
      
      // Encontrar el partido en cuestiu00f3n
      let targetMatch = null;
      let targetRoundIndex = -1;
      let targetMatchIndex = -1;
      
      tournament.rounds.forEach((round, roundIndex) => {
        round.matches.forEach((match, matchIndex) => {
          if (match.matchNumber.toString() === matchId.toString()) {
            targetMatch = match;
            targetRoundIndex = roundIndex;
            targetMatchIndex = matchIndex;
          }
        });
      });
      
      if (!targetMatch) {
        return res.status(404).json({
          success: false,
          message: 'Partido no encontrado'
        });
      }
      
      // Verificar que el ganador es uno de los participantes del partido
      if (targetMatch.participant1Id !== winnerId && targetMatch.participant2Id !== winnerId) {
        return res.status(400).json({
          success: false,
          message: 'El ganador debe ser uno de los participantes del partido'
        });
      }
      
      // Actualizar el partido con el ganador
      targetMatch.winnerId = winnerId;
      targetMatch.status = 'completed';
      
      // Si no es la u00faltima ronda, actualizar el siguiente partido
      const isLastRound = targetRoundIndex === tournament.rounds.length - 1;
      
      if (!isLastRound) {
        const nextRoundIndex = targetRoundIndex + 1;
        const nextMatchIndex = Math.floor(targetMatchIndex / 2);
        const nextMatch = tournament.rounds[nextRoundIndex].matches[nextMatchIndex];
        
        // Obtener la información del participante ganador
        const winnerName = targetMatch.participant1Id === winnerId 
          ? targetMatch.participant1Name 
          : targetMatch.participant2Name;
          
        const winnerAvatar = targetMatch.participant1Id === winnerId 
          ? targetMatch.participant1Avatar 
          : targetMatch.participant2Avatar;
        
        // Determinar a qué posición va el ganador (1 o 2)
        const goesToPosition = targetMatchIndex % 2 === 0 ? 1 : 2;
        
        if (goesToPosition === 1) {
          nextMatch.participant1Id = winnerId;
          nextMatch.participant1Name = winnerName;
          nextMatch.participant1Avatar = winnerAvatar;
        } else {
          nextMatch.participant2Id = winnerId;
          nextMatch.participant2Name = winnerName;
          nextMatch.participant2Avatar = winnerAvatar;
        }
        
        // Si ambos participantes estu00e1n asignados, el partido estu00e1 listo
        if (nextMatch.participant1Id && nextMatch.participant2Id) {
          nextMatch.status = 'ready';
        }
      } else {
        // Es la final, establecer ganador del torneo
        tournament.winner = winnerId;
        tournament.status = 'completed';
      }
      
      // Guardar los cambios
      await db.collection('tournaments').updateOne(
        { _id: tournament._id },
        { $set: {
          rounds: tournament.rounds,
          winner: tournament.winner,
          status: tournament.status
        }}
      );
      
      // Obtener nombres de participantes para incluir en la respuesta
      const participantIds = tournament.participantIds.map(id => new ObjectId(id));
      const participants = await db.collection('participants')
        .find({ _id: { $in: participantIds } })
        .toArray();
      
      const participantMap = participants.reduce((map, p) => {
        map[p._id.toString()] = p.name;
        return map;
      }, {});
      
      // Notificar a todos los clientes
      io.emit('tournament_updated', { 
        matchId,
        winnerId,
        winnerName: participantMap[winnerId],
        isCompleted: tournament.status === 'completed'  
      });
      
      res.json({
        success: true,
        updatedMatch: {
          ...targetMatch,
          winnerName: participantMap[winnerId]
        }
      });
    } catch (error) {
      console.error('Error al avanzar participante:', error);
      res.status(500).json({
        success: false,
        message: 'Error al avanzar participante',
        error: error.message
      });
    }
  });

  // Reiniciar o cancelar un torneo
  app.post('/api/tournament/reset', async (req, res) => {
    try {
      await db.collection('tournaments').updateMany(
        { status: 'active' },
        { $set: { status: 'cancelled' } }
      );
      
      io.emit('tournament_reset');
      
      res.json({
        success: true,
        message: 'Torneo reiniciado correctamente'
      });
    } catch (error) {
      console.error('Error al reiniciar torneo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reiniciar torneo',
        error: error.message
      });
    }
  });
}