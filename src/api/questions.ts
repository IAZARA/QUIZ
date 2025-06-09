import { getCollection } from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export interface Question {
  _id?: string;
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option?: string;
  explanation?: string;
  is_active: boolean;
  timer?: number;
  endTime?: number;
  votingClosed?: boolean;
  created_at: Date;
}

export interface Vote {
  _id?: string;
  question_id: string;
  option: string;
  voter_id: string;
  created_at: Date;
}

// Obtener todas las preguntas
export async function getQuestions() {
  const collection = await getCollection('questions');
  return collection.find({}).sort({ created_at: -1 }).toArray();
}

// Obtener una pregunta por ID
export async function getQuestionById(id: string) {
  const collection = await getCollection('questions');
  return collection.findOne({ _id: new ObjectId(id) });
}

// Obtener la pregunta activa actual
export async function getActiveQuestion() {
  const collection = await getCollection('questions');
  return collection.findOne({ is_active: true });
}

// Crear una nueva pregunta
export async function createQuestion(question: Omit<Question, '_id' | 'created_at'>) {
  const collection = await getCollection('questions');
  const result = await collection.insertOne({
    ...question,
    created_at: new Date()
  });
  return { 
    _id: result.insertedId.toString(),
    ...question,
    created_at: new Date()
  };
}

// Actualizar una pregunta
export async function updateQuestion(id: string, updates: Partial<Question>) {
  const collection = await getCollection('questions');
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );
  return getQuestionById(id);
}

// Eliminar una pregunta
export async function deleteQuestion(id: string) {
  const collection = await getCollection('questions');
  await collection.deleteOne({ _id: new ObjectId(id) });
  return { success: true };
}

// Iniciar votación para una pregunta
export async function startVoting(id: string) {
  const collection = await getCollection('questions');
  
  // Primero, desactivar todas las preguntas
  await collection.updateMany(
    {},
    { $set: { is_active: false, votingClosed: false, endTime: null } }
  );
  
  // Luego, activar la pregunta seleccionada
  const question = await getQuestionById(id);
  const endTime = question?.timer ? new Date(Date.now() + (question.timer * 1000)) : null;
  
  await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        is_active: true,
        endTime,
        votingClosed: false
      }
    }
  );
  
  // Limpiar votos anteriores para esta pregunta
  const votesCollection = await getCollection('votes');
  await votesCollection.deleteMany({ question_id: id });
  
  return getQuestionById(id);
}

// Cerrar votación
export async function closeVoting(id: string) {
  const collection = await getCollection('questions');
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { votingClosed: true, endTime: null } }
  );
  return getQuestionById(id);
}

// Detener votación
export async function stopVoting(id: string) {
  const collection = await getCollection('questions');
  await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        is_active: false,
        endTime: null,
        votingClosed: true
      }
    }
  );
  return getQuestionById(id);
}

// Enviar un voto
export async function submitVote(questionId: string, option: string, voterId: string) {
  // Verificar si la pregunta está activa
  const question = await getQuestionById(questionId);
  if (!question || !question.is_active || question.votingClosed) {
    throw new Error('La votación no está activa');
  }
  
  // Verificar si este votante ya ha votado
  const votesCollection = await getCollection('votes');
  const existingVote = await votesCollection.findOne({
    question_id: questionId,
    voter_id: voterId
  });
  
  if (existingVote) {
    throw new Error('Ya has votado en esta pregunta');
  }
  
  // Registrar el voto
  await votesCollection.insertOne({
    question_id: questionId,
    option,
    voter_id: voterId,
    created_at: new Date()
  });
  
  return { success: true };
}

// Obtener votos para una pregunta
export async function getVotesForQuestion(questionId: string) {
  const votesCollection = await getCollection('votes');
  const votes = await votesCollection.find({ question_id: questionId }).toArray();
  
  // Contar votos por opción
  const voteCounts: Record<string, number> = {};
  votes.forEach(vote => {
    voteCounts[vote.option] = (voteCounts[vote.option] || 0) + 1;
  });
  
  return {
    total: votes.length,
    counts: voteCounts
  };
}
