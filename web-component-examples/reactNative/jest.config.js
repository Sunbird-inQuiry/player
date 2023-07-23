module.exports = {
  // other Jest configuration options...
  preset: 'react-native',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.js?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // You can add regular expression patterns to match specific files or libraries
    // For example, to ignore all files inside "node_modules" except "my-library"
  ],
};
