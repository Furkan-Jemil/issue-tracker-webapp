import { SetMetadata } from '@nestjs/common';
import type { AppAbility } from '@workspace/shared';

export type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export const CHECK_POLICIES_KEY = 'check_policy';

/**
 * CheckPolicies — declarative CASL policy decorator for NestJS endpoints.
 *
 * Usage:
 *   @CheckPolicies((ability) => ability.can('read', 'Issue'))
 */
export const CheckPolicies = (...handlers: PolicyHandlerCallback[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
