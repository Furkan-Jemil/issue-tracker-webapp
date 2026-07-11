import { Injectable } from '@nestjs/common';
import { defineAbilitiesFor, type AppAbility } from '@workspace/shared';
import type { ServerUser } from '../auth/session.service';

/**
 * CaslAbilityFactory — NestJS provider encapsulating attribute-based CASL rules.
 *
 * Reuses `@workspace/shared` defineAbilitiesFor to ensure declarative consistency
 * between backend API policies and frontend UI rendering.
 */
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: ServerUser | null): AppAbility {
    if (!user) {
      return defineAbilitiesFor(null);
    }
    return defineAbilitiesFor({
      id: user.id,
      role: user.role as any,
    });
  }
}
