#!/usr/bin/env node

/**
 * generate-tasks.js
 * Simple script to generate individual task files from tasks.json
 */

import fs from 'fs';
import path from 'path';

// Paths
const tasksJsonPath = path.join(process.cwd(), 'scripts', 'tasks', 'tasks.json');
const outputDir = path.join(process.cwd(), 'tasks');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Read tasks.json
try {
  const tasksData = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
  
  if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
    console.error('Invalid tasks.json format: "tasks" array not found');
    process.exit(1);
  }
  
  // Generate individual task files
  tasksData.tasks.forEach(task => {
    const taskFilePath = path.join(outputDir, `task-${task.id}.md`);
    
    // Format dependencies as a comma-separated list
    const dependenciesStr = task.dependencies && task.dependencies.length > 0 
      ? task.dependencies.join(', ')
      : 'None';
    
    // Generate task file content
    const content = `# Task ID: ${task.id}
# Title: ${task.title}
# Status: ${task.status}
# Dependencies: ${dependenciesStr}
# Priority: ${task.priority}
# Description: ${task.description}

## Details:
${task.details}

## Test Strategy:
${task.testStrategy}
`;
    
    // Write the task file
    fs.writeFileSync(taskFilePath, content);
    console.log(`Generated: ${taskFilePath}`);
  });
  
  console.log(`Successfully generated ${tasksData.tasks.length} task files in ${outputDir}`);
} catch (error) {
  console.error(`Error generating task files: ${error.message}`);
  process.exit(1);
} 