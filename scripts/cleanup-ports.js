#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Script para limpiar procesos que estén usando puertos específicos
 * Útil para evitar errores EADDRINUSE al reiniciar la aplicación
 */

const PORTS_TO_CHECK = [3000, 5173]; // Backend y Frontend

async function findProcessOnPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    return stdout.trim().split('\n').filter(pid => pid);
  } catch (error) {
    // No hay procesos en este puerto
    return [];
  }
}

async function killProcess(pid) {
  try {
    await execAsync(`kill -9 ${pid}`);
    console.log(`✓ Proceso ${pid} terminado exitosamente`);
    return true;
  } catch (error) {
    console.log(`✗ Error terminando proceso ${pid}: ${error.message}`);
    return false;
  }
}

async function getProcessInfo(pid) {
  try {
    const { stdout } = await execAsync(`ps -p ${pid} -o comm=`);
    return stdout.trim();
  } catch (error) {
    return 'proceso desconocido';
  }
}

async function cleanupPorts() {
  console.log('🧹 Limpiando puertos ocupados...\n');
  
  let totalKilled = 0;
  
  for (const port of PORTS_TO_CHECK) {
    console.log(`Verificando puerto ${port}...`);
    
    const pids = await findProcessOnPort(port);
    
    if (pids.length === 0) {
      console.log(`✓ Puerto ${port} está libre\n`);
      continue;
    }
    
    console.log(`⚠️  Puerto ${port} está ocupado por ${pids.length} proceso(s)`);
    
    for (const pid of pids) {
      const processName = await getProcessInfo(pid);
      console.log(`  - PID ${pid} (${processName})`);
      
      const killed = await killProcess(pid);
      if (killed) {
        totalKilled++;
      }
    }
    
    console.log('');
  }
  
  if (totalKilled > 0) {
    console.log(`🎉 Se terminaron ${totalKilled} proceso(s) exitosamente`);
    console.log('⏳ Esperando 2 segundos para que los puertos se liberen...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log('✨ No se encontraron procesos para terminar\n');
  }
}

// Función para verificar si los puertos están realmente libres
async function verifyPortsAreFree() {
  console.log('🔍 Verificando que los puertos estén libres...');
  
  for (const port of PORTS_TO_CHECK) {
    const pids = await findProcessOnPort(port);
    if (pids.length > 0) {
      console.log(`❌ Puerto ${port} aún está ocupado`);
      return false;
    } else {
      console.log(`✅ Puerto ${port} está libre`);
    }
  }
  
  return true;
}

// Ejecutar si se llama directamente
if (process.argv[1].endsWith('cleanup-ports.js')) {
  cleanupPorts()
    .then(() => verifyPortsAreFree())
    .then((allFree) => {
      if (allFree) {
        console.log('\n🚀 Todos los puertos están libres. Listo para iniciar la aplicación!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Algunos puertos siguen ocupados. Puede que necesites reiniciar manualmente.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Error durante la limpieza:', error.message);
      process.exit(1);
    });
}

export { cleanupPorts, verifyPortsAreFree };