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

// Access token lives only in JS memory — never in localStorage/sessionStorage.
// XSS cannot read it. On page reload the __root.tsx beforeLoad restores it
// via the HttpOnly refresh cookie.
let _accessToken: string | null = null

export const tokenStorage = {
  getAccessToken: () => _accessToken,
  setTokens: (accessToken: string) => { _accessToken = accessToken },
  clearTokens: () => { _accessToken = null },
  decodeAccessToken: (): JwtPayload | null =>
    _accessToken ? decodeJwt(_accessToken) : null,
}
