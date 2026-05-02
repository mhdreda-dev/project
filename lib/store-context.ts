import type { AuthSession } from '@/lib/auth'

export const DEFAULT_STORE_ID = 'default-store'

export function getSessionStoreId(session: AuthSession | null | undefined) {
  return session?.user.storeId ?? DEFAULT_STORE_ID
}

export function withStoreScope<T extends object>(
  where: T | undefined,
  storeId: string | null | undefined,
) {
  return {
    ...(where ?? {}),
    storeId: storeId ?? DEFAULT_STORE_ID,
  }
}
