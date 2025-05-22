module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-react', // For React components
    '@babel/preset-typescript', // For TypeScript files
  ],
};
