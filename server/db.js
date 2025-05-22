import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || process.env.VITE_MONGODB_DB || 'quiz_app';

let client;
let dbConnection;

// Conectar con el cliente nativo de MongoDB
export async function connectToDb() {
  if (dbConnection) return dbConnection;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Conectado exitosamente a MongoDB (cliente nativo)');
    
    dbConnection = client.db(dbName);
    return dbConnection;
  } catch (error) {
    console.error('Error al conectar a MongoDB (cliente nativo):', error);
    throw error;
  }
}

export async function getDb() {
  if (!dbConnection) {
    await connectToDb();
  }
  return dbConnection;
}

export async function closeDb() {
  if (client) {
    await client.close();
    dbConnection = null;
    client = null;
    console.log('Conexión a MongoDB cerrada (cliente nativo)');
  }
}

// Conectar con Mongoose
export async function connectMongoose() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  
  try {
    await mongoose.connect(uri, {
      dbName: dbName
    });
    console.log('Conectado exitosamente a MongoDB (Mongoose)');
    return mongoose.connection;
  } catch (error) {
    console.error('Error al conectar a MongoDB (Mongoose):', error);
    throw error;
  }
}

// Inicializar ambas conexiones
export async function initializeConnections() {
  await connectToDb();
  await connectMongoose();
}
