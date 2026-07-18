import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, Text } from 'react-native';
import { useReduceMotion } from '../reduceMotion';

function Probe() {
  const reduceMotion = useReduceMotion();
  return <Text>{String(reduceMotion)}</Text>;
}

describe('useReduceMotion', () => {
  it('reflects the initial OS setting once resolved', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const listeners: ((v: boolean) => void)[] = [];
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, handler) => {
      listeners.push(handler as unknown as (v: boolean) => void);
      return { remove: jest.fn() } as any;
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<Probe />);
    });
    expect(renderer!.root.findByType(Text).props.children).toBe('true');
  });

  it('updates when the OS setting changes at runtime', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    let capturedHandler: ((v: boolean) => void) | undefined;
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, handler) => {
      capturedHandler = handler as unknown as (v: boolean) => void;
      return { remove: jest.fn() } as any;
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<Probe />);
    });
    expect(renderer!.root.findByType(Text).props.children).toBe('false');

    act(() => {
      capturedHandler?.(true);
    });
    expect(renderer!.root.findByType(Text).props.children).toBe('true');
  });
});
