// Builds the "現物確認" checklist for a candidate plant (v3 §7.3).
//
// PlantDefinition.morphology is intentionally sparse (see PR11 — no
// structured leaf-shape/flower-colour fields exist without fabricating
// them). Rather than invent per-species attributes, every check item here
// is grounded in data this app already has and shows elsewhere: habitat,
// season, the general description, and — most importantly — the specific
// look-alike differentiation notes authored in src/data/safety.ts.

import { Plant } from '../types';
import { TraitDefinition } from '../types/traitCheck';
import { getSafetyWarnings } from '../data/safety';

export function buildTraitChecklist(plant: Plant): TraitDefinition[] {
  const items: TraitDefinition[] = [
    {
      id: 'habitat',
      label: '生育場所',
      referenceHint: plant.habitat,
    },
    {
      id: 'season',
      label: '季節・時期',
      referenceHint: plant.season,
    },
    {
      id: 'appearance',
      label: '全体の見た目',
      referenceHint: plant.description,
    },
  ];

  for (const risk of getSafetyWarnings(plant.id)) {
    items.push({
      id: `lookalike_${risk.name}`,
      label: `${risk.name}との違い`,
      referenceHint: risk.note,
    });
  }

  return items;
}
