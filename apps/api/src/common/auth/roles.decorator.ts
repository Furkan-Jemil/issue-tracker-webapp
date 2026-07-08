import { SetMetadata } from '@nestjs/common';
import type { Role } from '@workspace/database';

/**
 * Restricts a route to the given roles. Enforced by RolesGuard, which returns
 * the common `{ error: 'Forbidden' }` / 401 `{ error: 'Unauthorized' }` bodies.
 *
 * NOTE: endpoints whose 403 body differs from `{error:'Forbidden'}` (e.g. admin
 * `GET /users` returns `{users:[]}` with 403) must NOT use @Roles — they enforce
 * inline in the controller to preserve their exact contract.
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
