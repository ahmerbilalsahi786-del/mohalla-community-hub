import { type ComponentType } from 'react'
import { Redirect } from 'wouter'
import { isLoggedIn } from '@/lib/auth'
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'

/** Wraps a page component — redirects to /login if user is not authenticated. */
export function ProtectedRoute<P extends object>(Component: ComponentType<P>) {
  return function Protected(props: P) {
    if (!isLoggedIn()) {
      return <Redirect to="/login" />
    }
    return <Component {...props} />
  }
}

/** Wraps a page component — redirects to /feed if user is not admin/moderator. */
export function AdminRoute<P extends object>(Component: ComponentType<P>) {
  return function AdminProtected(props: P) {
    const { data: user, isLoading } = useCurrentUser()
    if (!isLoggedIn()) {
      return <Redirect to="/login" />
    }
    if (isLoading) return null
    if (!canManageCommunity(user?.role)) {
      return <Redirect to="/feed" />
    }
    return <Component {...props} />
  }
}
