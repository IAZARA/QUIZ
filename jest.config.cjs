module.exports = {
  testEnvironment: 'jest-environment-jsdom', // For React Testing Library
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/jest.setup.js'], // Added jest.setup.js
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest', // Use babel-jest for transforming JS/TS files
  },
  moduleNameMapper: {
    // Handle CSS imports (if any in components, otherwise not strictly needed for these tests)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
     // Handle module aliases, e.g., if using `paths` in tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1', // Example: maps @/components/* to src/components/*
  },
  // Ignore transform for node_modules except for specific modules if needed (e.g., ES modules)
  transformIgnorePatterns: [
    '/node_modules/(?!(axios|other-es-module-to-transform))/', // Adjusted to include axios as an example
  ],
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src', '<rootDir>/server'], // Ensure both src and server are included
  // Test spec file match pattern
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)',
  ],
};
