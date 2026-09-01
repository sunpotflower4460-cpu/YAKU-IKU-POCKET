import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { CONTENT_MAX_WIDTH } from '../theme/layout';

export type ResponsiveFrameProps = ViewProps & {
  /** Maximum content width on tablet and web. */
  maxWidth?: number;
};

/**
 * Centers screen content without changing phone layouts. The frame remains
 * full-width below maxWidth, so existing padding and Dynamic Type behavior are
 * preserved.
 */
export function ResponsiveFrame({ maxWidth = CONTENT_MAX_WIDTH, style, ...props }: ResponsiveFrameProps) {
  return <View style={[styles.frame, { maxWidth }, style]} {...props} />;
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignSelf: 'center',
  },
});
