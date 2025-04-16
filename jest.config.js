module.exports = {
    preset: 'jest-expo',
    // setupFiles: [
    //   './jest.setup.js'  // Important : référence le fichier de setup
    // ],
    setupFilesAfterEnv: [
      '@testing-library/jest-native/extend-expect'
    ],
    transformIgnorePatterns: [
      'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-secure-store|twrnc|@sentry|expo-router)'
    ],
    
    // Utilise des chemins simples pour la résolution
    moduleNameMapper: {
      '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
      '^@/auth/(.*)$': '<rootDir>/app/auth/$1',
      '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
      '^@/(.*)$': '<rootDir>/$1'
    },
    
    testMatch: [
      '**/__tests__/**/*.ts?(x)',
      '**/?(*.)+(spec|test).ts?(x)'
    ],
    
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}