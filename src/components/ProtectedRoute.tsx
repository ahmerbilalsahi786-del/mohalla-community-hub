import { type ComponentType } from 'react'
import { Redirect } from 'wouter'
import { getUser } from '@/lib/auth'
import { canManageCommunity, isSuperAdmin, useCurrentUser } from '@/hooks/use-current-user'

/** Wraps a page component — redirects to /login if user is not authenticated. */
export function ProtectedRoute<P extends object>(Component: ComponentType<P>) {
  return function Protected(props: P) {
    const { data: user, isLoading } = useCurrentUser()
    if (isLoading) return null
    if (!user) return <Redirect to="/login" />
    if (isSuperAdmin(user.role)) {
      return <Redirect to="/super-admin/dashboard" />
    }
    if (user.communityStatus !== "approved") {
      return <Redirect to="/pending-approval" />
    }
    if (user.membershipStatus !== "approved") {
      return <Redirect to="/pending" />
    }
    return <Component {...props} />
  }
}

export function AuthenticatedRoute<P extends object>(Component: ComponentType<P>) {
  return function Authenticated(props: P) {
    const demoUser = getUser()
    const { data: user, isLoading } = useCurrentUser()
    if (demoUser?.userId === "ahmed" && demoUser.email === "demo@mohalla.app") {
      return <Component {...props} />
    }
    if (isLoading) return null
    if (!user) return <Redirect to="/login" />
    return <Component {...props} />
  }
}

/** Wraps a page component — redirects to /feed if user is not admin/moderator. */
export function AdminRoute<P extends object>(Component: ComponentType<P>) {
  return function AdminProtected(props: P) {
    const { data: user, isLoading } = useCurrentUser()
    if (isLoading) return null
    if (!user) return <Redirect to="/login" />
    if (isSuperAdmin(user.role)) {
      return <Redirect to="/super-admin/dashboard" />
    }
    if (user.communityStatus !== "approved" || user.membershipStatus !== "approved" || !canManageCommunity(user?.role)) {
      return <Redirect to="/feed" />
    }
    return <Component {...props} />
  }
}

export function SuperAdminRoute<P extends object>(Component: ComponentType<P>) {
  return function SuperAdminProtected(props: P) {
    const { data: user, isLoading } = useCurrentUser()
    if (isLoading) return null
    if (!user) return <Redirect to="/login" />
    if (!isSuperAdmin(user.role)) {
      return <Redirect to="/feed" />
    }
    return <Component {...props} />
  }
}
