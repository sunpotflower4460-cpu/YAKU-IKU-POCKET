import { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

const webAccessibilityStyles = `
  html, body, #root {
    min-height: 100%;
    background: #EEF4EF;
  }

  body {
    margin: 0;
    color-scheme: light dark;
  }

  ::selection {
    background: rgba(23, 79, 42, 0.22);
  }

  @media (prefers-color-scheme: dark) {
    html, body, #root {
      background: #0E1510;
    }

    ::selection {
      background: rgba(117, 225, 128, 0.24);
    }
  }

  /*
   * React Native Web controls remain keyboard-operable, but their browser
   * focus treatment can vary by element/browser. Give keyboard users one
   * consistent, high-contrast focus indicator without showing it for pointer
   * clicks. The white inner ring + forest outer ring remains visible on both
   * the app's light and dark surfaces.
   */
  *:focus-visible {
    outline: 3px solid #FFFFFF !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 5px #174F2A !important;
  }

  /*
   * Component animations also read the preference in useReduceMotion(). This
   * CSS layer is a second line of defence for browser-native transitions,
   * future CSS animation and smooth scrolling that bypass React Native's hook.
   */
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto !important;
    }

    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
    }
  }

  @media (forced-colors: active) {
    *:focus-visible {
      outline: 3px solid CanvasText !important;
      box-shadow: none !important;
    }
  }
`;

/** Web-only document shell. Native builds do not render this file. */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webAccessibilityStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
