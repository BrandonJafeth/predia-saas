const ACCESS_TOKEN_KEY = 'predia_access_token'

interface JwtPayload {
  sub: string
  tenantId: string
  role: 'super_admin' | 'admin' | 'agent'
  exp: number
  iat: number
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1]
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload
  } catch {
    return null
  }
}

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  setTokens: (accessToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
  decodeAccessToken: (): JwtPayload | null => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    return token ? decodeJwt(token) : null
  },
}
