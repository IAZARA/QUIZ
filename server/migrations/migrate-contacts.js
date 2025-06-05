import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || process.env.VITE_MONGODB_DB || 'quiz_app';

async function migrateContacts() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB para migración');
    
    const db = client.db(dbName);
    const contactsCollection = db.collection('contacts');
    
    // Obtener todos los contactos
    const contacts = await contactsCollection.find({}).toArray();
    console.log(`Encontrados ${contacts.length} contactos para migrar`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const contact of contacts) {
      // Verificar si ya tiene la nueva estructura
      if (contact.contactMethods) {
        console.log(`Contacto ${contact.name} ya migrado, saltando...`);
        skippedCount++;
        continue;
      }
      
      const contactMethods = [];
      
      // Migrar email si existe
      if (contact.email) {
        contactMethods.push({
          _id: new ObjectId(),
          type: 'email',
          value: contact.email
        });
      }
      
      // Migrar whatsapp si existe
      if (contact.whatsapp) {
        contactMethods.push({
          _id: new ObjectId(),
          type: 'whatsapp',
          value: contact.whatsapp
        });
      }
      
      // Actualizar el contacto
      const updateResult = await contactsCollection.updateOne(
        { _id: contact._id },
        {
          $set: { contactMethods },
          $unset: { email: "", whatsapp: "" }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log(`✓ Migrado contacto: ${contact.name}`);
        migratedCount++;
      } else {
        console.log(`✗ Error migrando contacto: ${contact.name}`);
      }
    }
    
    console.log('\n=== RESUMEN DE MIGRACIÓN ===');
    console.log(`Total de contactos: ${contacts.length}`);
    console.log(`Migrados exitosamente: ${migratedCount}`);
    console.log(`Ya migrados (saltados): ${skippedCount}`);
    console.log(`Errores: ${contacts.length - migratedCount - skippedCount}`);
    
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await client.close();
    console.log('Conexión cerrada');
  }
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateContacts()
    .then(() => {
      console.log('Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en migración:', error);
      process.exit(1);
    });
}

export { migrateContacts };