import { redirect } from 'next/navigation'
import { LoginClient } from './login-client'

type LoginPageProps = {
  searchParams?: {
    store?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const storeSlug = searchParams?.store?.trim().toLowerCase()

  if (storeSlug) {
    redirect(`/${encodeURIComponent(storeSlug)}/login`)
  }

  return <LoginClient />
}
