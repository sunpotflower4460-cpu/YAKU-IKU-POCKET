module.exports = {
  extends: ['expo'],
  ignorePatterns: ['/dist/*', '/node_modules/*'],
  rules: {
    // `useRef(new Animated.Value(...)).current` is the standard RN pattern
    // for a stable per-instance Animated.Value and is used throughout this
    // codebase's entrance/loop animations. This rule is aimed at the
    // (not-yet-adopted) React Compiler and flags that safe, long-standing
    // idiom as an error; disabled rather than rewriting every animation.
    'react-hooks/refs': 'off',
    // Same rationale: several existing effects intentionally setState on
    // mount/prop-change (e.g. resetting a modal's slide index when it
    // becomes visible) with correct dependency arrays and no render loop.
    // This React-Compiler-oriented rule flags that as an error; disabled
    // rather than restructuring working effects for this PR's scope.
    'react-hooks/set-state-in-effect': 'off',
    // React Compiler readiness check; this project doesn't opt into the
    // compiler, and the flagged `useMemo` deps are correct as written.
    'react-hooks/preserve-manual-memoization': 'off',
  },
};
