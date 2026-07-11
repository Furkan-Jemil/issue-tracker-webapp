import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  type PolicyHandlerCallback,
} from './check-policies.decorator';

/**
 * PoliciesGuard — enforces CASL policies declared via @CheckPolicies().
 *
 * Guarantees strict contract parity:
 * - Missing/unauthenticated user -> 401 { error: 'Unauthorized' }
 * - Policy violation -> 403 { error: 'Forbidden' }
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandlerCallback[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    if (policyHandlers.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new HttpException(
        { error: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    for (const handler of policyHandlers) {
      if (!handler(ability)) {
        throw new HttpException(
          { error: 'Forbidden' },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return true;
  }
}
