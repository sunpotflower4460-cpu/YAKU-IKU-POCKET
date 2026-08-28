import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { ScanResultModal } from '../ScanResultModal';
import { PLANTS, getPlantById } from '../../data/plants';
import { IdentificationCandidate } from '../../types/observation';

function allText(root: TestRenderer.ReactTestInstance): string[] {
  return root.findAllByType(Text).map((n) => (Array.isArray(n.props.children) ? n.props.children.join('') : String(n.props.children ?? '')));
}

function candidate(plantId: string, rank: number, visionScore: number): IdentificationCandidate {
  const plant = getPlantById(plantId)!;
  return { plant, score: { visionScore, overallRank: rank }, reason: 'test reason' };
}

/** Find the Pressable whose rendered text includes `label` (e.g. a labelled button). */
function findButtonByText(root: TestRenderer.ReactTestInstance, label: string): TestRenderer.ReactTestInstance {
  return root
    .findAll((node) => typeof node.props.onPress === 'function')
    .find((node) => allText(node).some((t) => t.includes(label)))!;
}

function renderModal(element: React.ReactElement) {
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
}

// ScanResultModal starts entry animations/state synchronization on mount;
// unmount inside act so no state/timer work leaks beyond a test boundary.
let renderer: TestRenderer.ReactTestRenderer | null = null;
afterEach(() => {
  if (renderer) {
    act(() => renderer?.unmount());
  }
  renderer = null;
});

describe('ScanResultModal — candidate compare (§7.5)', () => {
  it('shows the single-result view (no compare header) when only one candidate exists', () => {
    renderModal(
      <ScanResultModal
        visible
        plant={PLANTS[0]}
        confidence={90}
        isNewDiscovery={false}
        usedRealAI
        candidates={[candidate(PLANTS[0].id, 1, 90)]}
        selectedPlantId={PLANTS[0].id}
        imageUri={undefined}
        onAddToZukan={() => {}}
        onScanAgain={() => {}}
      />
    );
    const texts = allText(renderer!.root);
    expect(texts.some((t) => t.includes('候補が') && t.includes('件あります'))).toBe(false);
  });

  it('shows the compare header and every candidate name when multiple candidates exist', () => {
    const [a, b] = PLANTS;
    renderModal(
      <ScanResultModal
        visible
        plant={a}
        confidence={90}
        isNewDiscovery={false}
        usedRealAI
        candidates={[candidate(a.id, 1, 90), candidate(b.id, 2, 60)]}
        selectedPlantId={a.id}
        imageUri={undefined}
        onAddToZukan={() => {}}
        onScanAgain={() => {}}
      />
    );
    const texts = allText(renderer!.root);
    expect(texts.some((t) => t.includes('候補が2件あります'))).toBe(true);
    expect(texts.some((t) => t.includes(a.name))).toBe(true);
    expect(texts.some((t) => t.includes(b.name))).toBe(true);
  });

  it('shows the cross-candidate safety block when a dangerous plant is among the candidates', () => {
    const trikabuto = getPlantById('p024')!; // トリカブト, RED
    const tanpopo = getPlantById('p001')!; // non-RED comparison candidate
    renderModal(
      <ScanResultModal
        visible
        plant={tanpopo}
        confidence={70}
        isNewDiscovery={false}
        usedRealAI
        candidates={[candidate(tanpopo.id, 1, 70), candidate(trikabuto.id, 2, 55)]}
        selectedPlantId={tanpopo.id}
        imageUri={undefined}
        onAddToZukan={() => {}}
        onScanAgain={() => {}}
      />
    );
    const texts = allText(renderer!.root);
    expect(texts.some((t) => t.includes('候補の中に危険植物、または有毒な類似種があります'))).toBe(true);
    expect(texts.some((t) => t.includes('採取・摂取の判断には使用しないでください'))).toBe(true);
  });

  it('calls onSelectCandidate when a candidate card is pressed', () => {
    const [a, b] = PLANTS;
    const onSelect = jest.fn();
    renderModal(
      <ScanResultModal
        visible
        plant={a}
        confidence={90}
        isNewDiscovery={false}
        usedRealAI
        candidates={[candidate(a.id, 1, 90), candidate(b.id, 2, 60)]}
        selectedPlantId={a.id}
        onSelectCandidate={onSelect}
        imageUri={undefined}
        onAddToZukan={() => {}}
        onScanAgain={() => {}}
      />
    );
    const secondCandidateButton = renderer!.root.findAll(
      (node) => node.props.accessibilityLabel?.startsWith(`候補2: ${b.name}`)
    )[0];
    act(() => secondCandidateButton.props.onPress());
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].plant.id).toBe(b.id);
  });
});

describe('ScanResultModal — 現物確認チェックリスト (v3 §7.3, PR18)', () => {
  it('shows the checklist for a real-AI, non-demo result and hides it for demo results', () => {
    renderModal(
      <ScanResultModal
        visible
        plant={PLANTS[0]}
        confidence={80}
        isNewDiscovery={false}
        usedRealAI
        imageUri={undefined}
        onAddToZukan={() => {}}
        onScanAgain={() => {}}
      />
    );
    const texts = allText(renderer!.root);
    expect(texts.some((t) => t.includes('目の前の植物と見比べる'))).toBe(true);
    act(() => renderer?.unmount());
    renderer = null;

    renderModal(
      <ScanResultModal
        visible
        plant={PLANTS[0]}
        confidence={80}
        isNewDiscovery={false}
        usedRealAI={false}
        isDemo
        imageUri={undefined}
        onAddToZukan={() => {}}
        onScanAgain={() => {}}
      />
    );
    const demoTexts = allText(renderer!.root);
    expect(demoTexts.some((t) => t.includes('目の前の植物と見比べる'))).toBe(false);
  });

  it('updates the match/mismatch/unknown summary as the user taps and passes checks through onAddToZukan', () => {
    const onAdd = jest.fn();
    renderModal(
      <ScanResultModal
        visible
        plant={PLANTS[0]}
        confidence={80}
        isNewDiscovery={false}
        usedRealAI
        imageUri={undefined}
        onAddToZukan={onAdd}
        onScanAgain={() => {}}
      />
    );
    const matchButtons = renderer!.root.findAll(
      (node) => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('生育場所: 一致')
    );
    act(() => matchButtons[0].props.onPress());

    const texts = allText(renderer!.root);
    expect(texts.some((t) => t.includes('一致 1') && t.includes('未確認'))).toBe(true);

    // Trigger save via the primary CTA and confirm the checklist state is forwarded.
    act(() => {
      findButtonByText(renderer!.root, '記録に保存').props.onPress();
    });

    expect(onAdd).toHaveBeenCalledTimes(1);
    const passedChecks = onAdd.mock.calls[0][0];
    expect(passedChecks.find((c: { traitId: string }) => c.traitId === 'habitat').state).toBe('match');
  });

  it('resets the checklist when the selected candidate changes', () => {
    const [a, b] = PLANTS;
    renderModal(
      <ScanResultModal
        visible
        plant={a}
        confidence={80}
        isNewDiscovery={false}
        usedRealAI
        candidates={[candidate(a.id, 1, 80), candidate(b.id, 2, 60)]}
        selectedPlantId={a.id}
        imageUri={undefined}
        onAddToZukan={() => {}}
        onScanAgain={() => {}}
      />
    );
    const matchButtons = renderer!.root.findAll(
      (node) => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('生育場所: 一致')
    );
    act(() => matchButtons[0].props.onPress());
    expect(allText(renderer!.root).some((t) => t.includes('一致 1'))).toBe(true);

    act(() => {
      renderer!.update(
        <ScanResultModal
          visible
          plant={b}
          confidence={60}
          isNewDiscovery={false}
          usedRealAI
          candidates={[candidate(a.id, 1, 80), candidate(b.id, 2, 60)]}
          selectedPlantId={b.id}
          imageUri={undefined}
          onAddToZukan={() => {}}
          onScanAgain={() => {}}
        />
      );
    });
    expect(allText(renderer!.root).some((t) => t.includes('一致 0'))).toBe(true);
  });
});
