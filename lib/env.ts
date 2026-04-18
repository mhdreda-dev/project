const required = ['DATABASE_URL', 'AUTH_SECRET'] as const

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  AUTH_SECRET: process.env.AUTH_SECRET as string,
  AUTH_URL: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
}
