import { lazy, Suspense } from "react";
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommunityRulesModal } from "@/components/modals/community-rules-modal";
import { OnboardingModal } from "@/components/modals/onboarding-modal";
import { CommandSearch } from "@/components/search/command-search";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { MohallaLoadingScreen } from "@/components/brand/mohalla-brand";
import { AppDelightLayer } from "@/components/community/community-delight";
import { ProtectedRoute, AdminRoute, AuthenticatedRoute, SuperAdminRoute } from "@/components/ProtectedRoute";
import { InstallAppButton, InstallAppPrompt } from "@/components/pwa/install-app";
import { clearToken, isLoggedIn } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCommunityTheme } from "@/lib/theme";

const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Feed = lazy(() => import("@/pages/Feed"));
const Messages = lazy(() => import("@/pages/Messages"));
const CityFeed = lazy(() => import("@/pages/CityFeed"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const MarketplaceListing = lazy(() => import("@/pages/MarketplaceListing"));
const Safety = lazy(() => import("@/pages/Safety"));
const Events = lazy(() => import("@/pages/Events"));
const Polls = lazy(() => import("@/pages/Polls"));
const Announcements = lazy(() => import("@/pages/Announcements"));
const Profile = lazy(() => import("@/pages/Profile"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const AdminMembers = lazy(() => import("@/pages/admin/Members"));
const AdminPosts = lazy(() => import("@/pages/admin/Posts"));
const AdminCommunity = lazy(() => import("@/pages/admin/Community"));
const AdminBranding = lazy(() => import("@/pages/admin/Branding"));
const AdminContacts = lazy(() => import("@/pages/admin/Contacts"));
const AdminAnnouncements = lazy(() => import("@/pages/admin/Announcements"));
const AdminModeration = lazy(() => import("@/pages/admin/Moderation"));
const SuperAdminDashboard = lazy(() => import("@/pages/super-admin/Dashboard"));
const SuperAdminCommunities = lazy(() => import("@/pages/super-admin/Communities"));
const SuperAdminCommunityDetail = lazy(() => import("@/pages/super-admin/CommunityDetail"));
const Community = lazy(() => import("@/pages/Community"));
const Places = lazy(() => import("@/pages/Places"));
const Volunteer = lazy(() => import("@/pages/Volunteer"));
const Help = lazy(() => import("@/pages/Help"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const MembershipPending = lazy(() => import("@/pages/MembershipPending"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if (error instanceof Error && error.message.includes("401")) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error: unknown) => {
        if (error instanceof Error && error.message.includes("401")) {
          clearToken();
          window.location.href = "/login";
        }
      },
    },
  },
});

// Protected page wrappers
const PDashboard       = ProtectedRoute(Dashboard);
const PFeed            = ProtectedRoute(Feed);
const PMessages        = ProtectedRoute(Messages);
const PCityFeed        = ProtectedRoute(CityFeed);
const PMarketplace     = ProtectedRoute(Marketplace);
const PMarketplaceListing = ProtectedRoute(MarketplaceListing);
const PSafety          = ProtectedRoute(Safety);
const PEvents          = ProtectedRoute(Events);
const PPolls           = ProtectedRoute(Polls);
const PAnnouncements   = ProtectedRoute(Announcements);
const PProfile         = ProtectedRoute(Profile);
const PSettings        = ProtectedRoute(SettingsPage);
const PCommunity       = ProtectedRoute(Community);
const PPlaces          = ProtectedRoute(Places);
const PVolunteer       = ProtectedRoute(Volunteer);
const PHelp            = ProtectedRoute(Help);
const PMembershipPending = AuthenticatedRoute(MembershipPending);
const PNotifications     = ProtectedRoute(Notifications);

// Admin-only page wrappers
const AAdminMembers       = AdminRoute(AdminMembers);
const AAdminPosts         = AdminRoute(AdminPosts);
const AAdminCommunity     = AdminRoute(AdminCommunity);
const AAdminBranding      = AdminRoute(AdminBranding);
const AAdminContacts      = AdminRoute(AdminContacts);
const AAdminAnnouncements = AdminRoute(AdminAnnouncements);
const AAdminModeration    = AdminRoute(AdminModeration);
const SAdminDashboard     = SuperAdminRoute(SuperAdminDashboard);
const SAdminCommunities   = SuperAdminRoute(SuperAdminCommunities);
const SAdminCommunityDetail = SuperAdminRoute(SuperAdminCommunityDetail);

function LandingEntry() {
  if (isLoggedIn()) return <Redirect to="/dashboard" />;
  return <Landing />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/pending" component={PMembershipPending} />
      <Route path="/pending-approval" component={PMembershipPending} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/" component={LandingEntry} />

      {/* Protected routes */}
      <Route path="/dashboard" component={PDashboard} />
      <Route path="/feed" component={PFeed} />
      <Route path="/messages" component={PMessages} />
      <Route path="/messages/:id" component={PMessages} />
      <Route path="/city-feed" component={PCityFeed} />
      <Route path="/marketplace" component={PMarketplace} />
      <Route path="/marketplace/:id" component={PMarketplaceListing} />
      <Route path="/safety" component={PSafety} />
      <Route path="/events" component={PEvents} />
      <Route path="/polls" component={PPolls} />
      <Route path="/announcements" component={PAnnouncements} />
      <Route path="/profile/:id" component={PProfile} />
      <Route path="/settings" component={PSettings} />
      <Route path="/community" component={PCommunity} />
      <Route path="/places" component={PPlaces} />
      <Route path="/volunteer" component={PVolunteer} />
      <Route path="/help" component={PHelp} />
      <Route path="/notifications" component={PNotifications} />

      {/* Admin-only routes */}
      <Route path="/admin" component={AAdminMembers} />
      <Route path="/admin/members" component={AAdminMembers} />
      <Route path="/admin/posts" component={AAdminPosts} />
      <Route path="/admin/community" component={AAdminCommunity} />
      <Route path="/admin/branding" component={AAdminBranding} />
      <Route path="/admin/contacts" component={AAdminContacts} />
      <Route path="/admin/announcements" component={AAdminAnnouncements} />
      <Route path="/admin/moderation" component={AAdminModeration} />

      {/* Super-admin routes */}
      <Route path="/super-admin" component={SAdminDashboard} />
      <Route path="/super-admin/dashboard" component={SAdminDashboard} />
      <Route path="/super-admin/communities" component={SAdminCommunities} />
      <Route path="/super-admin/communities/:id" component={SAdminCommunityDetail} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppChrome() {
  const [location] = useLocation();
  const isPublicAuth = location === "/login" || location === "/register" || location === "/reset-password" || location === "/verify-email" || location === "/pending" || location === "/pending-approval";
  const isLanding = location === "/";
  const isPlatformArea = location.startsWith("/super-admin");
  const { data: user } = useCurrentUser({ enabled: !isPublicAuth && !isLanding });
  useCommunityTheme(isLanding ? null : user?.community, { forceLight: isLanding });

  return (
    <>
      <Suspense fallback={<MohallaLoadingScreen />}>
        <Router />
      </Suspense>
      {isPublicAuth && <InstallAppButton variant="floating" />}
      {!isPublicAuth && !isLanding && !isPlatformArea && (
        <>
          <AppDelightLayer />
          <MobileNav />
          <CommunityRulesModal />
          <OnboardingModal />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppChrome />
        </WouterRouter>
        <InstallAppPrompt />
        <CommandSearch />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
