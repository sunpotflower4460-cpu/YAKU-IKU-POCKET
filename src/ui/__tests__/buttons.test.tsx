import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { IconButton } from '../IconButton';

let renderer: TestRenderer.ReactTestRenderer | null = null;

afterEach(() => {
  if (renderer) {
    act(() => renderer?.unmount());
  }
  renderer = null;
});

function render(element: React.ReactElement) {
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer!.root;
}

describe('shared buttons — accessibility state composition', () => {
  it('preserves caller state while adding primary loading semantics', () => {
    const root = render(
      <PrimaryButton
        label="保存"
        loading
        accessibilityState={{ selected: true }}
        onPress={() => {}}
      />
    );
    const button = root.find((node) => node.props.accessibilityRole === 'button');
    expect(button.props.accessibilityState).toEqual({ selected: true, disabled: true, busy: true });
    expect(button.props.accessibilityLabel).toBe('保存、処理中');
  });

  it('preserves caller state while adding secondary disabled semantics', () => {
    const root = render(
      <SecondaryButton
        label="候補"
        disabled
        accessibilityState={{ expanded: true }}
        onPress={() => {}}
      />
    );
    const button = root.find((node) => node.props.accessibilityRole === 'button');
    expect(button.props.accessibilityState).toEqual({ expanded: true, disabled: true });
  });

  it('uses the 44pt control itself rather than implicit overlapping hitSlop', () => {
    const root = render(
      <IconButton icon="close" accessibilityLabel="閉じる" onPress={() => {}} />
    );
    const button = root.find((node) => node.props.accessibilityRole === 'button');
    expect(button.props.hitSlop).toBeUndefined();
    expect(button.props.accessibilityState).toEqual({ disabled: false });
  });
});
