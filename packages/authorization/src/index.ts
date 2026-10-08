export {
  getDeploymentAuthorizationEffectiveness,
  minimumApprovalQuorum,
  recordDeploymentAuthorizationDecision,
  requestDeploymentAuthorization,
  resolveAuthorizationPrerequisite,
  revokeDeploymentAuthorization,
} from "./authorization.js";

export type {
  AuthorizationClient,
} from "./authorization.js";

export type {
  DeploymentAuthorizationConditions,
  DeploymentAuthorizationMode,
  DeploymentAuthorizationPrerequisite,
  DeploymentAuthorizationRequest,
} from "./types.js";
