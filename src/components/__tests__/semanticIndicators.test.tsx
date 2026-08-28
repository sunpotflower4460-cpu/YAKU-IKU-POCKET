import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { RarityStars } from '../RarityStars';
import { DangerBadge } from '../DangerBadge';

let renderer: TestRenderer.ReactTestRenderer | null = null;

afterEach(() => {
  if (renderer) act(() => renderer?.unmount());
  renderer = null;
});

function render(element: React.ReactElement) {
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer!.root;
}

describe('semantic indicators — standalone vs composed accessibility', () => {
  it('announces rarity when used as standalone information', () => {
    const root = render(<RarityStars rarity={5} />);
    const summary = root.find((node) => node.props.accessibilityRole === 'text');
    expect(summary.props.accessibilityLabel).toBe('珍しさの目安、とても珍しい、5段階中5');
  });

  it('can hide rarity semantics when a parent control already announces them', () => {
    const root = render(<RarityStars rarity={5} accessible={false} />);
    expect(root.findAll((node) => node.props.accessibilityRole === 'text')).toHaveLength(0);
    expect(root.findAll((node) => node.props.accessibilityElementsHidden === true).length).toBeGreaterThan(0);
  });

  it('announces the danger category when used as standalone information', () => {
    const root = render(<DangerBadge danger="RED" />);
    const summary = root.find((node) => node.props.accessibilityRole === 'text');
    expect(summary.props.accessibilityLabel).toBe('植物情報の注意区分、危険・有毒');
  });

  it('can hide danger semantics when a parent control already announces them', () => {
    const root = render(<DangerBadge danger="RED" accessible={false} />);
    expect(root.findAll((node) => node.props.accessibilityRole === 'text')).toHaveLength(0);
    expect(root.findAll((node) => node.props.accessibilityElementsHidden === true).length).toBeGreaterThan(0);
  });
});
