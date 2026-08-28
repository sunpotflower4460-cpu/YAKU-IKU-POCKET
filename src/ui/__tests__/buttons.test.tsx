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

  it('keeps primary role/live-region authoritative while allowing a contextual spoken label', () => {
    const root = render(
      <PrimaryButton
        label="保存"
        loading
        accessibilityRole="link"
        accessibilityLabel="観察メモを保存"
        accessibilityLiveRegion="none"
        onPress={() => {}}
      />
    );
    const button = root.find((node) => node.props.accessibilityRole === 'button');
    expect(button.props.accessibilityLabel).toBe('観察メモを保存、処理中');
    expect(button.props.accessibilityLiveRegion).toBe('polite');
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
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

  it('keeps secondary role authoritative and accepts a contextual spoken label', () => {
    const root = render(
      <SecondaryButton
        label="候補"
        accessibilityRole="link"
        accessibilityLabel="別の植物候補を見る"
        onPress={() => {}}
      />
    );
    const button = root.find((node) => node.props.accessibilityRole === 'button');
    expect(button.props.accessibilityLabel).toBe('別の植物候補を見る');
  });

  it('uses the 44pt control itself rather than implicit overlapping hitSlop', () => {
    const root = render(
      <IconButton
        icon="close"
        accessibilityLabel="閉じる"
        accessibilityRole="link"
        onPress={() => {}}
      />
    );
    const button = root.find((node) => node.props.accessibilityRole === 'button');
    expect(button.props.hitSlop).toBeUndefined();
    expect(button.props.accessibilityState).toEqual({ disabled: false });
    expect(button.props.accessibilityLabel).toBe('閉じる');
  });
});
