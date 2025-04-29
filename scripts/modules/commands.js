/**
 * commands.js
 * Core functionality for the Task Master CLI
 */

import fs from 'fs';
import path from 'path';

// Default paths
const DEFAULT_TASKS_PATH = path.join(process.cwd(), 'tasks', 'tasks.json');
const DEFAULT_TASKS_DIR = path.join(process.cwd(), 'tasks');
const SCRIPTS_TASKS_PATH = path.join(process.cwd(), 'scripts', 'tasks', 'tasks.json');

// Status symbols for UI
const STATUS_SYMBOLS = {
  'pending': '⏱️',
  'done': '✅',
  'deferred': '⏸️',
  'in-progress': '🔄'
};

/**
 * Reads the tasks.json file
 * @param {string} filePath - Path to tasks.json
 * @returns {Object} The parsed tasks data
 */
function readTasksFile(filePath = DEFAULT_TASKS_PATH) {
  // Try the default path first
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  // If not found in default path, try scripts/tasks/tasks.json
  if (fs.existsSync(SCRIPTS_TASKS_PATH)) {
    return JSON.parse(fs.readFileSync(SCRIPTS_TASKS_PATH, 'utf8'));
  }
  
  throw new Error(`Tasks file not found at ${filePath} or ${SCRIPTS_TASKS_PATH}`);
}

/**
 * Writes the tasks data to tasks.json
 * @param {Object} tasksData - The tasks data to write
 * @param {string} filePath - Path to tasks.json
 */
function writeTasksFile(tasksData, filePath = DEFAULT_TASKS_PATH) {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(tasksData, null, 2));
}

/**
 * Generates task files from tasks.json
 * @param {Object} options - Options for the command
 */
function generateTaskFiles(options = {}) {
  const filePath = options.file || DEFAULT_TASKS_PATH;
  const outputDir = options.output || DEFAULT_TASKS_DIR;
  
  try {
    // Read tasks data
    const tasksData = readTasksFile(filePath);
    
    if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
      console.error('Invalid tasks.json format: "tasks" array not found');
      return;
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }
    
    // Generate task files
    tasksData.tasks.forEach(task => {
      const taskFilePath = path.join(outputDir, `task-${task.id}.md`);
      
      // Format dependencies
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
  }
}

/**
 * Lists tasks from tasks.json
 * @param {Object} options - Options for the command
 */
function listTasks(options = {}) {
  const filePath = options.file || DEFAULT_TASKS_PATH;
  const statusFilter = options.status;
  
  try {
    // Read tasks data
    const tasksData = readTasksFile(filePath);
    
    if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
      console.error('Invalid tasks.json format: "tasks" array not found');
      return;
    }
    
    // Filter tasks by status if provided
    const filteredTasks = statusFilter 
      ? tasksData.tasks.filter(task => task.status === statusFilter)
      : tasksData.tasks;
    
    // Print header
    console.log('\n==========================================');
    console.log(`🚀 ${tasksData.metadata?.projectName || 'Project'} - Task List`);
    if (statusFilter) {
      console.log(`Filtered by status: ${statusFilter}`);
    }
    console.log('==========================================\n');
    
    // Count status totals
    const statusCounts = {
      'pending': 0,
      'done': 0,
      'deferred': 0,
      'in-progress': 0
    };
    
    // Print tasks
    filteredTasks.forEach(task => {
      const statusSymbol = STATUS_SYMBOLS[task.status] || '❓';
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      
      // Format dependencies
      const deps = task.dependencies && task.dependencies.length > 0
        ? task.dependencies.map(depId => {
            const depTask = tasksData.tasks.find(t => t.id === depId);
            const depStatus = depTask ? STATUS_SYMBOLS[depTask.status] || '❓' : '❓';
            return `${depStatus} ${depId}`;
          }).join(', ')
        : 'None';
      
      console.log(`${statusSymbol} [${task.id}] ${task.title} (${task.priority})`);
      console.log(`   Description: ${task.description}`);
      console.log(`   Dependencies: ${deps}`);
      
      if (options.with_subtasks && task.subtasks && task.subtasks.length > 0) {
        console.log('   Subtasks:');
        task.subtasks.forEach(subtask => {
          const subtaskStatus = STATUS_SYMBOLS[subtask.status] || '❓';
          console.log(`      ${subtaskStatus} ${subtask.id}. ${subtask.title}`);
        });
      }
      
      console.log('');
    });
    
    // Print summary
    console.log('==========================================');
    console.log('Summary:');
    console.log(`Total Tasks: ${filteredTasks.length}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`${STATUS_SYMBOLS[status] || '❓'} ${status}: ${count}`);
      }
    });
    console.log('==========================================\n');
  } catch (error) {
    console.error(`Error listing tasks: ${error.message}`);
  }
}

/**
 * Parse command line arguments and run the appropriate command
 * @param {Array} argv - Process arguments
 */
export function runCLI(argv) {
  const args = argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    return;
  }
  
  const command = args[0];
  const options = parseOptions(args.slice(1));
  
  if (process.env.DEBUG === '1') {
    console.error('DEBUG - Command:', command);
    console.error('DEBUG - Options:', options);
  }
  
  switch (command) {
    case 'list':
      listTasks(options);
      break;
    case 'generate':
      generateTaskFiles(options);
      break;
    case 'parse-prd':
      console.log('The parse-prd command is not yet implemented in this basic version.');
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      break;
  }
}

/**
 * Parse command line options into an object
 * @param {Array} args - Command line arguments
 * @returns {Object} Options object
 */
function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const parts = arg.substring(2).split('=');
      const key = parts[0];
      const value = parts.length > 1 ? parts[1] : true;
      options[key] = value;
    } else if (arg.startsWith('-')) {
      const key = arg.substring(1);
      const value = args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : true;
      options[key] = value;
    }
  }
  
  return options;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Task Master CLI - Basic Version

Commands:
  list                List all tasks
    --status=<status>   Filter tasks by status
    --file=<path>       Use alternative tasks.json file
    --with-subtasks     Show subtasks for each task
    
  generate           Generate individual task files
    --file=<path>       Use alternative tasks.json file
    --output=<dir>      Output directory

  parse-prd          Parse a PRD document (not implemented in basic version)
  `);
} 