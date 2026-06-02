import { type ComponentType } from 'react'
import { Redirect } from 'wouter'
import { isLoggedIn, getUser } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'

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
    if (!isLoggedIn()) {
      return <Redirect to="/login" />
    }
    const user = getUser()
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return <Redirect to="/feed" />
    }
    return <Component {...props} />
  }
}
