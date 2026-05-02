export const DEFAULT_STORE_ID = 'default-store'

export type StoreScope = {
  storeId: string
}

export function getSessionStoreId(
  session: { user?: { storeId?: string | null } } | null | undefined,
): string {
  return session?.user?.storeId ?? DEFAULT_STORE_ID
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
