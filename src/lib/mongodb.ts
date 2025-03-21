import { MongoClient, ServerApiVersion } from 'mongodb';

// Variables de entorno para MongoDB
const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || '';
const MONGODB_DB = import.meta.env.VITE_MONGODB_DB || 'quiz_app';

// Cliente de MongoDB
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

if (!MONGODB_URI) {
  throw new Error('Por favor, define la variable de entorno VITE_MONGODB_URI');
}

if (process.env.NODE_ENV === 'development') {
  // En desarrollo, usamos una variable global para mantener la conexión
  // entre recargas de página
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // En producción, es mejor no usar una variable global
  client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  clientPromise = client.connect();
}

export { clientPromise, MONGODB_DB };

// Función de ayuda para obtener una colección
export async function getCollection(collectionName: string) {
  const client = await clientPromise;
  const db = client.db(MONGODB_DB);
  return db.collection(collectionName);
}
