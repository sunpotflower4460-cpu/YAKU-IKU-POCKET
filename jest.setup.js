// Jest setup (PR6). Mock AsyncStorage so the persisted Zustand store can be
// imported and exercised in unit tests without a native module.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// PR10: @expo/vector-icons pulls in expo-font's native font loader, which
// throws outside a real app runtime. Component tests only need icons to
// render as an inert placeholder, not load real glyphs.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  function makeIconSet(setName) {
    return function Icon(props) {
      return React.createElement(Text, props, `[${setName}:${props.name}]`);
    };
  }
  return new Proxy(
    {},
    {
      get: (_target, name) => makeIconSet(String(name)),
    }
  );
});
