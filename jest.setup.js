// Jest setup (PR6). Mock AsyncStorage so the persisted Zustand store can be
// imported and exercised in unit tests without a native module.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
