import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { PlantCard } from '../PlantCard';
import { PLANTS } from '../../data/plants';

let renderer: TestRenderer.ReactTestRenderer | null = null;

afterEach(() => {
  if (renderer) {
    act(() => renderer?.unmount());
  }
  renderer = null;
});

describe('PlantCard — interaction structure', () => {
  it('keeps the card action and favorite action as sibling interactive controls', () => {
    const plant = PLANTS[0];
    const onPress = jest.fn();
    const onFavorite = jest.fn();

    act(() => {
      renderer = TestRenderer.create(
        <PlantCard
          plant={plant}
          discovered
          isFavorite={false}
          onPress={onPress}
          onFavorite={onFavorite}
        />
      );
    });

    const cardLabel = `${plant.name}。珍しさの目安5段階中${plant.rarity}`;
    const favoriteLabel = `${plant.name}をお気に入りに追加`;
    const cardButton = renderer!.root.findAll(
      (node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel?.startsWith(cardLabel)
    )[0];
    const favoriteButton = renderer!.root.findAll(
      (node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === favoriteLabel
    )[0];

    expect(cardButton).toBeDefined();
    expect(favoriteButton).toBeDefined();
    expect(cardButton.findAll((node) => node.props.accessibilityLabel === favoriteLabel)).toHaveLength(0);

    act(() => favoriteButton.props.onPress());
    expect(onFavorite).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('lets the card summary own rarity and danger semantics without duplicate stops', () => {
    const plant = PLANTS[0];

    act(() => {
      renderer = TestRenderer.create(
        <PlantCard
          plant={plant}
          discovered
          onPress={() => {}}
        />
      );
    });

    const cardButton = renderer!.root.findAll(
      (node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel?.startsWith(plant.name)
    )[0];

    expect(cardButton.props.accessibilityLabel).toContain('珍しさの目安');
    expect(cardButton.findAll(
      (node) => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('珍しさの目安、')
    )).toHaveLength(0);
    expect(cardButton.findAll(
      (node) => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('植物情報の注意区分、')
    )).toHaveLength(0);
  });
});
