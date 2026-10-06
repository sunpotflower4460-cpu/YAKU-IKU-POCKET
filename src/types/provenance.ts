/**
 * Provenance foundation for Global Plant Brain claims (G0).
 */

import {
  YakuProvenanceId,
  YakuRightsPolicyId,
  YakuSourceId,
} from './canonicalIds';

export type ProvenanceAgentKind =
  | 'human'
  | 'ai_model'
  | 'software'
  | 'organization'
  | 'community';

export interface ProvenanceAgentRef {
  id: string;
  kind: ProvenanceAgentKind;
  label?: string;
  version?: string;
}

export type ProvenanceTransformation =
  | 'direct_ingest'
  | 'normalized'
  | 'extracted'
  | 'translated'
  | 'summarized'
  | 'synthesized'
  | 'manually_authored';

export interface KnowledgeProvenance {
  id: YakuProvenanceId;

  /** Direct evidence/source records used to create the knowledge object. */
  sourceRefIds: YakuSourceId[];

  /** Effective rights decision for the produced record. */
  rightsPolicyId: YakuRightsPolicyId;

  transformation: ProvenanceTransformation;
  agents: ProvenanceAgentRef[];

  extractionActivityId?: string;
  modelVersion?: string;
  reviewerIds?: string[];

  createdAt: string;
}

export function validateKnowledgeProvenance(
  provenance: KnowledgeProvenance,
): string[] {
  const issues: string[] = [];

  if (provenance.sourceRefIds.length === 0) {
    issues.push('source_ref_required');
  }
  if (provenance.agents.length === 0) {
    issues.push('agent_required');
  }
  if (!provenance.createdAt.trim()) {
    issues.push('created_at_required');
  }

  return issues;
}
