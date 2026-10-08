export interface CorrectiveActionPlanInput {
  findingId: string;
  createdByPrincipalId: string;
  ownerPrincipalId?: string;
  plan: string;
  dueAt?: string;
  warningWindowSeconds?: number;
  gracePeriodSeconds?: number;
  escalationAfterSeconds?: number[];
  correlationId?: string;
}

export interface OperationalSuspensionInput {
  deploymentContextResourceId: string;
  principalId: string;
  reason: string;
  findingId?: string;
  authorizationId?: string;
  suspendedAt: string;
  correlationId?: string;
}

export interface OperationalResumptionInput {
  deploymentContextResourceId: string;
  principalId: string;
  rationale: string;
  resumedAt: string;
  authorizationId?: string;
  correlationId?: string;
}

export interface DeploymentRetirementInput {
  deploymentContextResourceId: string;
  principalId: string;
  reason: string;
  retiredAt: string;
  replacementDeploymentContextResourceId?: string;
  correlationId?: string;
}
