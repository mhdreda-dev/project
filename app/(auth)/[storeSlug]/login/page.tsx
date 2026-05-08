import { notFound, redirect } from 'next/navigation'
import { LoginClient } from '../../login/login-client'

type StoreLoginPageProps = {
  params: {
    storeSlug: string
  }
}

export default function StoreLoginPage({ params }: StoreLoginPageProps) {
  const storeSlug = params.storeSlug.trim().toLowerCase()

  if (!/^[a-z0-9-]+$/.test(storeSlug)) {
    notFound()
  }

  if (storeSlug !== params.storeSlug) {
    redirect(`/${encodeURIComponent(storeSlug)}/login`)
  }

  return <LoginClient storeSlug={storeSlug} />
}
