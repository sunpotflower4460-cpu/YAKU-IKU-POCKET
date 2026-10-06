/**
 * Rights policy foundation for the Global Plant Brain (G0).
 *
 * "Publicly accessible" is not the same as "commercially reusable", and RAG,
 * embeddings, training, redistribution and local storage are intentionally
 * evaluated separately.
 */

import { YakuRightsPolicyId } from './canonicalIds';

export type RightsPermission =
  | 'allowed'
  | 'conditional'
  | 'permission_required'
  | 'prohibited'
  | 'unknown';

export type RightsUse =
  | 'commercial_use'
  | 'local_storage'
  | 'redistribution'
  | 'derivative_database'
  | 'ai_rag'
  | 'ai_embedding'
  | 'ai_training'
  | 'ai_evaluation';

export type RightsDecision = 'allow' | 'review' | 'deny';

export interface RightsPolicy {
  id: YakuRightsPolicyId;
  licenseType?: string;

  commercialUse: RightsPermission;
  localStorage: RightsPermission;
  redistribution: RightsPermission;
  derivativeDatabase: RightsPermission;

  attributionRequired: boolean;
  shareAlike: boolean;

  aiRag: RightsPermission;
  aiEmbedding: RightsPermission;
  aiTraining: RightsPermission;
  aiEvaluation: RightsPermission;

  notes?: string;
  checkedAt: string;
  policyVersion?: string;
}

export function permissionForUse(
  policy: RightsPolicy,
  use: RightsUse,
): RightsPermission {
  switch (use) {
    case 'commercial_use':
      return policy.commercialUse;
    case 'local_storage':
      return policy.localStorage;
    case 'redistribution':
      return policy.redistribution;
    case 'derivative_database':
      return policy.derivativeDatabase;
    case 'ai_rag':
      return policy.aiRag;
    case 'ai_embedding':
      return policy.aiEmbedding;
    case 'ai_training':
      return policy.aiTraining;
    case 'ai_evaluation':
      return policy.aiEvaluation;
  }
}

/**
 * Fail-closed policy:
 * - explicit allowed => allow
 * - explicit prohibited => deny
 * - conditional / permission_required / unknown => human or policy review
 */
export function evaluateRights(
  policy: RightsPolicy,
  use: RightsUse,
): RightsDecision {
  const permission = permissionForUse(policy, use);
  if (permission === 'allowed') return 'allow';
  if (permission === 'prohibited') return 'deny';
  return 'review';
}

export function createUnknownRightsPolicy(
  id: YakuRightsPolicyId,
  checkedAt: string,
  notes?: string,
): RightsPolicy {
  return {
    id,
    commercialUse: 'unknown',
    localStorage: 'unknown',
    redistribution: 'unknown',
    derivativeDatabase: 'unknown',
    attributionRequired: false,
    shareAlike: false,
    aiRag: 'unknown',
    aiEmbedding: 'unknown',
    aiTraining: 'unknown',
    aiEvaluation: 'unknown',
    checkedAt,
    notes,
  };
}
