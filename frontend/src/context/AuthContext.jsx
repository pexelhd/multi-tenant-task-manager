import { createContext, useContext, useEffect, useState, useRef } from 'react'
import keycloak from '@/lib/keycloak'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [initialized, setInitialized] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      })
      .then((auth) => {
        setAuthenticated(auth)

        if (auth) {
          localStorage.setItem('access_token', keycloak.token)
          localStorage.setItem('refresh_token', keycloak.refreshToken)

          const roles = keycloak.tokenParsed?.realm_access?.roles || []
          setUser({
            keycloakId: keycloak.tokenParsed?.sub,
            email: keycloak.tokenParsed?.email,
            name: keycloak.tokenParsed?.name,
            username: keycloak.tokenParsed?.preferred_username,
            roles,
          })
        }

        setInitialized(true)
      })
      .catch((err) => {
        console.error('Keycloak init failed:', err)
        setInitialized(true)
      })

    // Keep the token fresh
    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            localStorage.setItem('access_token', keycloak.token)
            localStorage.setItem('refresh_token', keycloak.refreshToken)
          }
        })
        .catch(() => {
          keycloak.login()
        })
    }
  }, [])

  const login = () => keycloak.login()

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    keycloak.logout({ redirectUri: window.location.origin })
  }

  const hasRole = (...roles) => {
    if (!user) return false
    return roles.some((r) => user.roles.includes(r))
  }

  return (
    <AuthContext.Provider value={{ initialized, authenticated, user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
