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

  // API para agregar o actualizar preguntas de una ronda específica
  app.post('/api/tournament/:tournamentId/round/:roundNumber/questions', async (req, res) => {
    try {
      const { tournamentId, roundNumber } = req.params;
      const { questions } = req.body;

      // Validar tournamentId
      if (!ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ success: false, message: 'ID de torneo no válido' });
      }

      // Validar roundNumber
      const rn = parseInt(roundNumber);
      if (isNaN(rn) || rn <= 0) {
        return res.status(400).json({ success: false, message: 'Número de ronda no válido' });
      }

      // Validar questions
      if (!Array.isArray(questions) || questions.length < 1 || questions.length > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Debe proporcionar entre 1 y 5 preguntas' 
        });
      }

      for (const q of questions) {
        if (!q.content || typeof q.content !== 'string' ||
            !q.options || typeof q.options !== 'object' ||
            !q.correct_option || typeof q.correct_option !== 'string') {
          return res.status(400).json({ 
            success: false, 
            message: 'Cada pregunta debe tener contenido (string), opciones (objeto) y correct_option (string)' 
          });
        }
        // Validar que correct_option sea una de las claves en options
        if (!q.options.hasOwnProperty(q.correct_option)) {
          return res.status(400).json({
            success: false,
            message: `La opción correcta '${q.correct_option}' no existe en las opciones de la pregunta '${q.content}'`
          });
        }
      }

      const tournament = await db.collection('tournaments').findOne({ _id: new ObjectId(tournamentId) });

      if (!tournament) {
        return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
      }

      if (tournament.status !== 'active') {
        return res.status(400).json({ success: false, message: 'El torneo no está activo. No se pueden modificar las preguntas.' });
      }

      const roundIndex = tournament.rounds.findIndex(r => r.roundNumber === rn);

      if (roundIndex === -1) {
        return res.status(404).json({ success: false, message: 'Ronda no encontrada en este torneo' });
      }

      // Asignar nuevos IDs a las preguntas y prepararlas
      const processedQuestions = questions.map(q => ({
        ...q,
        question_id: new ObjectId().toString() // Siempre generar nuevo ID para reemplazar
      }));

      // Actualizar las preguntas en la ronda específica
      tournament.rounds[roundIndex].questions = processedQuestions;

      // Guardar los cambios en la base de datos
      const updateResult = await db.collection('tournaments').updateOne(
        { _id: new ObjectId(tournamentId) },
        { $set: { rounds: tournament.rounds } }
      );

      if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
        // Esto podría significar que las preguntas eran idénticas a las existentes
        // o un problema donde el documento coincidió pero no se modificó.
        // Por ahora, lo trataremos como éxito si coincidió.
        console.warn(`Tournament ${tournamentId}, Round ${rn}: Questions might not have been updated if they were identical.`);
      } else if (updateResult.matchedCount === 0) {
        return res.status(404).json({ success: false, message: 'Torneo no encontrado durante la actualización.' });
      }
      
      io.emit('tournament_questions_updated', { 
        tournamentId, 
        roundNumber: rn, 
        questions: processedQuestions 
      });

      res.json({
        success: true,
        message: `Preguntas para la ronda ${rn} actualizadas correctamente.`,
        round: tournament.rounds[roundIndex]
      });

    } catch (error) {
      console.error('Error al agregar/actualizar preguntas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al agregar/actualizar preguntas',
        error: error.message
      });
    }
  });

  // API para iniciar la fase de preguntas para un partido específico
  app.post('/api/tournament/round/:roundNumber/match/:matchId/start-questions', async (req, res) => {
    try {
      const { roundNumber, matchId } = req.params;

      // Validar roundNumber
      const rn = parseInt(roundNumber);
      if (isNaN(rn) || rn <= 0) {
        return res.status(400).json({ success: false, message: 'Número de ronda no válido.' });
      }

      // Validar matchId (solo que exista, ya que es un string de matchNumber)
      if (!matchId) {
        return res.status(400).json({ success: false, message: 'Se requiere matchId.' });
      }

      const tournament = await db.collection('tournaments').findOne({ status: 'active' });
      if (!tournament) {
        return res.status(404).json({ success: false, message: 'No hay torneo activo.' });
      }

      const currentRound = tournament.rounds.find(r => r.roundNumber === rn);
      if (!currentRound) {
        return res.status(404).json({ success: false, message: `Ronda ${rn} no encontrada en este torneo.` });
      }

      if (!currentRound.questions || currentRound.questions.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `La ronda ${rn} no tiene preguntas configuradas. Por favor, agregue preguntas primero.` 
        });
      }

      const matchIndex = currentRound.matches.findIndex(m => m.matchNumber.toString() === matchId);
      if (matchIndex === -1) {
        return res.status(404).json({ success: false, message: `Partido con ID ${matchId} no encontrado en la ronda ${rn}.` });
      }
      
      const targetMatch = currentRound.matches[matchIndex];

      // Validar estado del partido
      if (targetMatch.status !== 'ready') {
        let userMessage = `El partido ${matchId} no está listo para iniciar preguntas.`;
        if (targetMatch.status === 'pending') userMessage = `El partido ${matchId} aún está pendiente de participantes.`;
        else if (targetMatch.status === 'questions_active') userMessage = `Las preguntas para el partido ${matchId} ya están activas.`;
        else if (targetMatch.status === 'completed') userMessage = `El partido ${matchId} ya ha sido completado.`;
        
        return res.status(400).json({ success: false, message: userMessage, currentStatus: targetMatch.status });
      }
      
      if (!targetMatch.participant1Id || !targetMatch.participant2Id) {
        return res.status(400).json({ success: false, message: `El partido ${matchId} no tiene ambos participantes asignados.` });
      }

      // Actualizar estado del partido
      tournament.rounds = tournament.rounds.map(r => {
        if (r.roundNumber === rn) {
          r.matches = r.matches.map(m => {
            if (m.matchNumber.toString() === matchId) {
              return { ...m, status: 'questions_active' };
            }
            return m;
          });
        }
        return r;
      });
      
      const updatedMatch = tournament.rounds.find(r => r.roundNumber === rn).matches.find(m => m.matchNumber.toString() === matchId);

      await db.collection('tournaments').updateOne(
        { _id: tournament._id },
        { $set: { rounds: tournament.rounds } }
      );

      const eventData = {
        tournamentId: tournament._id.toString(),
        roundNumber: currentRound.roundNumber,
        matchId: targetMatch.matchNumber.toString(),
        participant1Id: targetMatch.participant1Id,
        participant2Id: targetMatch.participant2Id,
        questions: currentRound.questions,
        // Nota: La duración podría añadirse aquí si se implementa
      };

      // Emitir evento general. Los clientes (participantes) deberán filtrar este evento.
      // Una mejora futura sería emitir directamente a los sockets de los participantes
      // si se implementa un mapeo de participantId a socketId.
      io.emit('tournament_match_question_phase_started', eventData);

      res.json({
        success: true,
        message: `Fase de preguntas iniciada para el partido ${matchId} de la ronda ${rn}.`,
        match: updatedMatch
      });

    } catch (error) {
      console.error('Error al iniciar fase de preguntas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al iniciar la fase de preguntas.',
        error: error.message
      });
    }
  });

  // API para que un participante envíe sus respuestas para un partido
  app.post('/api/tournament/match/:matchId/submit-answers', async (req, res) => {
    try {
      const { matchId: paramMatchId } = req.params;
      const { tournamentId, roundNumber, participantId, answers } = req.body;

      // 1. Validaciones
      if (!ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ success: false, message: 'ID de torneo no válido.' });
      }
      if (typeof roundNumber !== 'number' || roundNumber <= 0) {
        return res.status(400).json({ success: false, message: 'Número de ronda no válido.' });
      }
      if (!ObjectId.isValid(participantId)) {
        return res.status(400).json({ success: false, message: 'ID de participante no válido.' });
      }
      if (!paramMatchId) { // paramMatchId es match.matchNumber, que es un número pero se pasa como string en la URL
        return res.status(400).json({ success: false, message: 'Se requiere matchId en la URL.' });
      }
      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ success: false, message: 'El array de respuestas no puede estar vacío.' });
      }
      for (const ans of answers) {
        if (!ans.question_id || typeof ans.question_id !== 'string' || // question_id es un string ( ObjectId().toString() )
            !ans.selected_option || typeof ans.selected_option !== 'string' ||
            typeof ans.time_taken_ms !== 'number' || ans.time_taken_ms < 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Cada respuesta debe tener question_id (string), selected_option (string) y time_taken_ms (number >= 0).' 
          });
        }
      }

      // 2. Encontrar torneo, ronda y partido
      const tournament = await db.collection('tournaments').findOne({ _id: new ObjectId(tournamentId), status: 'active' });
      if (!tournament) {
        return res.status(404).json({ success: false, message: 'Torneo activo no encontrado o ID incorrecto.' });
      }

      const currentRound = tournament.rounds.find(r => r.roundNumber === roundNumber);
      if (!currentRound) {
        return res.status(404).json({ success: false, message: `Ronda ${roundNumber} no encontrada.` });
      }

      const targetMatch = currentRound.matches.find(m => m.matchNumber.toString() === paramMatchId);
      if (!targetMatch) {
        return res.status(404).json({ success: false, message: `Partido ${paramMatchId} no encontrado en la ronda ${roundNumber}.` });
      }

      // 3. Validar estado del partido y participante
      if (targetMatch.status !== 'questions_active') {
        return res.status(400).json({ success: false, message: `El partido ${paramMatchId} no está en fase de preguntas. Estado actual: ${targetMatch.status}.` });
      }
      if (targetMatch.participant1Id !== participantId && targetMatch.participant2Id !== participantId) {
        return res.status(403).json({ success: false, message: 'El participante no forma parte de este partido.' });
      }

      // 4. Idempotencia: Verificar si ya envió respuestas
      const existingSubmission = await db.collection('tournament_round_answers').findOne({
        tournament_id: new ObjectId(tournamentId),
        round_number: roundNumber,
        match_id: paramMatchId, // match_id es el matchNumber.toString()
        participant_id: new ObjectId(participantId)
      });
      if (existingSubmission) {
        return res.status(400).json({ success: false, message: 'Ya has enviado tus respuestas para este partido.' });
      }
      
      // 5. Procesar y guardar respuestas
      const roundQuestions = currentRound.questions; // Estas son las preguntas originales con correct_option
      if (!roundQuestions || roundQuestions.length === 0) {
          return res.status(500).json({ success: false, message: 'No se encontraron preguntas configuradas para esta ronda en el torneo.'});
      }

      const answersToInsert = [];
      for (const ans of answers) {
        const originalQuestion = roundQuestions.find(q => q.question_id === ans.question_id);
        if (!originalQuestion) {
          // Esto no debería suceder si el frontend envía los question_id correctos
          console.warn(`Advertencia: Pregunta con ID ${ans.question_id} no encontrada en la ronda ${roundNumber} del torneo ${tournamentId} para el partido ${paramMatchId}.`);
          continue; // Opcional: podrías retornar un error aquí
        }
        
        const isCorrect = originalQuestion.correct_option === ans.selected_option;
        answersToInsert.push({
          tournament_id: new ObjectId(tournamentId),
          round_number: roundNumber,
          match_id: paramMatchId, 
          participant_id: new ObjectId(participantId),
          question_id: ans.question_id, // Ya es un string
          answer: ans.selected_option,
          time_taken_ms: ans.time_taken_ms,
          is_correct: isCorrect,
          created_at: new Date()
        });
      }

      if (answersToInsert.length > 0) {
        await db.collection('tournament_round_answers').insertMany(answersToInsert);
      } else {
        // Si todas las question_id eran inválidas, por ejemplo
        return res.status(400).json({ success: false, message: 'No se procesaron respuestas válidas.' });
      }
      
      io.emit('tournament_match_answers_submitted', { 
        tournamentId, 
        roundNumber, 
        matchId: paramMatchId, 
        participantId 
      });

      // 6. Verificar si el oponente ha enviado respuestas
      const otherParticipantId = targetMatch.participant1Id === participantId ? targetMatch.participant2Id : targetMatch.participant1Id;
      const opponentAnswers = await db.collection('tournament_round_answers').findOne({
        tournament_id: new ObjectId(tournamentId),
        round_number: roundNumber,
        match_id: paramMatchId,
        participant_id: new ObjectId(otherParticipantId)
      });

      if (!opponentAnswers) {
        return res.json({ success: true, message: 'Respuestas enviadas. Esperando al oponente.' });
      }

      // 7. Ambos han enviado: Calcular ganador y avanzar
      const allAnswersForMatch = await db.collection('tournament_round_answers').find({
        tournament_id: new ObjectId(tournamentId),
        round_number: roundNumber,
        match_id: paramMatchId,
      }).toArray();

      const calculateScore = (pid) => {
        let correctCount = 0;
        let totalTime = 0;
        allAnswersForMatch.filter(a => a.participant_id.toString() === pid && a.is_correct)
          .forEach(a => {
            correctCount++;
            totalTime += a.time_taken_ms;
          });
        return { participantId: pid, correctCount, totalTime };
      };

      const score1 = calculateScore(targetMatch.participant1Id);
      const score2 = calculateScore(targetMatch.participant2Id);

      let winnerId = null;
      let loserId = null;

      if (score1.correctCount > score2.correctCount) {
        winnerId = score1.participantId;
        loserId = score2.participantId;
      } else if (score2.correctCount > score1.correctCount) {
        winnerId = score2.participantId;
        loserId = score1.participantId;
      } else { // Empate en respuestas correctas, comparar tiempo
        if (score1.totalTime < score2.totalTime) {
          winnerId = score1.participantId;
          loserId = score2.participantId;
        } else if (score2.totalTime < score1.totalTime) {
          winnerId = score2.participantId;
          loserId = score1.participantId;
        } else {
          // Empate total. Decidir por alguna regla, ej. P1 o aleatorio. Aquí P1 por defecto.
          // O se podría marcar el partido como empate si el sistema lo permitiera.
          console.log(`Empate total en partido ${paramMatchId}, ronda ${roundNumber}. Ganador por defecto: ${targetMatch.participant1Id}`);
          winnerId = targetMatch.participant1Id; 
          loserId = targetMatch.participant2Id;
        }
      }
      
      // Actualizar torneo (lógica similar a /api/tournament/advance)
      let targetMatchInTournament = null;
      let targetRoundIndexInTournament = -1;
      let targetMatchIndexInTournament = -1;

      tournament.rounds.forEach((r, rIdx) => {
        r.matches.forEach((m, mIdx) => {
          if (m.matchNumber.toString() === paramMatchId) {
            targetMatchInTournament = m;
            targetRoundIndexInTournament = rIdx;
            targetMatchIndexInTournament = mIdx;
          }
        });
      });
      
      if (!targetMatchInTournament) {
         // Esto no debería ocurrir si las validaciones previas pasaron
        console.error(`Error crítico: Partido ${paramMatchId} no encontrado en la estructura del torneo durante la actualización.`);
        return res.status(500).json({ success: false, message: "Error crítico al actualizar el torneo." });
      }

      targetMatchInTournament.winnerId = winnerId;
      targetMatchInTournament.status = 'completed';
      
      // Obtener información del ganador para el siguiente partido (nombre, avatar)
      // Necesitamos buscar en la colección de participantes si no está en el partido actual (lo cual debería estar)
      let winnerDetails = { name: 'N/A', avatar: '🐾' };
      const p1Details = { id: targetMatchInTournament.participant1Id, name: targetMatchInTournament.participant1Name, avatar: targetMatchInTournament.participant1Avatar };
      const p2Details = { id: targetMatchInTournament.participant2Id, name: targetMatchInTournament.participant2Name, avatar: targetMatchInTournament.participant2Avatar };

      if (winnerId === p1Details.id) winnerDetails = { name: p1Details.name, avatar: p1Details.avatar };
      else if (winnerId === p2Details.id) winnerDetails = { name: p2Details.name, avatar: p2Details.avatar };


      const isLastRound = targetRoundIndexInTournament === tournament.rounds.length - 1;
      if (!isLastRound) {
        const nextRoundIndex = targetRoundIndexInTournament + 1;
        const nextMatchIndex = Math.floor(targetMatchIndexInTournament / 2);
        const nextMatch = tournament.rounds[nextRoundIndex].matches[nextMatchIndex];

        const goesToPosition1 = targetMatchIndexInTournament % 2 === 0;
        if (goesToPosition1) {
          nextMatch.participant1Id = winnerId;
          nextMatch.participant1Name = winnerDetails.name;
          nextMatch.participant1Avatar = winnerDetails.avatar;
        } else {
          nextMatch.participant2Id = winnerId;
          nextMatch.participant2Name = winnerDetails.name;
          nextMatch.participant2Avatar = winnerDetails.avatar;
        }

        if (nextMatch.participant1Id && nextMatch.participant2Id) {
          nextMatch.status = 'ready';
        }
      } else {
        tournament.winner = winnerId;
        tournament.status = 'completed';
      }
      
      await db.collection('tournaments').updateOne(
        { _id: tournament._id },
        { $set: { 
            rounds: tournament.rounds, 
            winner: tournament.winner, 
            status: tournament.status 
          } 
        }
      );
      
      // Emitir eventos de Socket.IO
      // Idealmente, se debería emitir a sockets específicos si se tiene el mapeo participantId -> socketId
      io.emit('tournament_match_completed', { 
        tournamentId: tournament._id.toString(), 
        roundNumber, 
        matchId: paramMatchId, 
        winnerId, 
        loserId,
        score1, // Para dar feedback de puntajes
        score2, // Para dar feedback de puntajes
        // NO enviaremos todo el tournament object aquí para evitar sobrecargar, clientes pueden re-fetch si es necesario
      });

      if (tournament.status === 'completed') {
        io.emit('tournament_completed', { 
          tournamentId: tournament._id.toString(), 
          winnerId,
          // De nuevo, no todo el objeto tournament
        });
      }
      
      // Obtener el nombre del ganador para el mensaje
      const allParticipantsInfo = await db.collection('participants')
        .find({ _id: { $in: [new ObjectId(winnerId), new ObjectId(loserId)] } })
        .toArray();
      const winnerInfo = allParticipantsInfo.find(p => p._id.toString() === winnerId);
      const winnerName = winnerInfo ? winnerInfo.name : 'Desconocido';

      res.json({ 
        success: true, 
        message: `Partido ${paramMatchId} completado. Ganador: ${winnerName}.`,
        winnerId,
        loserId,
        score1,
        score2,
        isTournamentOver: tournament.status === 'completed'
      });

    } catch (error) {
      console.error('Error al enviar respuestas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al enviar respuestas.',
        error: error.message
      });
    }
  });
}