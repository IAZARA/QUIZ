#!/usr/bin/env node

/**
 * list-tasks.js
 * Simple script to list tasks from tasks.json
 */

import fs from 'fs';
import path from 'path';

// Paths
const tasksJsonPath = path.join(process.cwd(), 'scripts', 'tasks', 'tasks.json');

// Status symbols
const statusSymbols = {
  'pending': '⏱️',
  'done': '✅',
  'deferred': '⏸️',
  'in-progress': '🔄'
};

// Read tasks.json
try {
  const tasksData = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
  
  if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
    console.error('Invalid tasks.json format: "tasks" array not found');
    process.exit(1);
  }
  
  // Print header
  console.log('\n==========================================');
  console.log(`🚀 ${tasksData.metadata?.projectName || 'Project'} - Task List`);
  console.log('==========================================\n');
  
  // Count status totals
  const statusCounts = {
    'pending': 0,
    'done': 0,
    'deferred': 0,
    'in-progress': 0
  };
  
  // Print tasks
  tasksData.tasks.forEach(task => {
    const statusSymbol = statusSymbols[task.status] || '❓';
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    
    // Format dependencies
    const deps = task.dependencies && task.dependencies.length > 0
      ? task.dependencies.map(depId => {
          const depTask = tasksData.tasks.find(t => t.id === depId);
          const depStatus = depTask ? statusSymbols[depTask.status] || '❓' : '❓';
          return `${depStatus} ${depId}`;
        }).join(', ')
      : 'None';
    
    console.log(`${statusSymbol} [${task.id}] ${task.title} (${task.priority})`);
    console.log(`   Description: ${task.description}`);
    console.log(`   Dependencies: ${deps}`);
    console.log('');
  });
  
  // Print summary
  console.log('==========================================');
  console.log('Summary:');
  console.log(`Total Tasks: ${tasksData.tasks.length}`);
  Object.entries(statusCounts).forEach(([status, count]) => {
    if (count > 0) {
      console.log(`${statusSymbols[status] || '❓'} ${status}: ${count}`);
    }
  });
  console.log('==========================================\n');
  
} catch (error) {
  console.error(`Error listing tasks: ${error.message}`);
  process.exit(1);
} 