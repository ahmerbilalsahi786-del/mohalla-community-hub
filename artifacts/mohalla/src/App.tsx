import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Feed from "@/pages/Feed";
import Marketplace from "@/pages/Marketplace";
import MarketplaceListing from "@/pages/MarketplaceListing";
import Safety from "@/pages/Safety";
import Events from "@/pages/Events";
import Polls from "@/pages/Polls";
import Profile from "@/pages/Profile";
import SettingsPage from "@/pages/Settings";
import AdminMembers from "@/pages/admin/Members";
import AdminPosts from "@/pages/admin/Posts";
import AdminCommunity from "@/pages/admin/Community";
import AdminAnnouncements from "@/pages/admin/Announcements";
import Community from "@/pages/Community";
import Places from "@/pages/Places";
import Volunteer from "@/pages/Volunteer";
import Help from "@/pages/Help";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { CommunityRulesModal } from "@/components/modals/community-rules-modal";
import { OnboardingModal } from "@/components/modals/onboarding-modal";
import { CommandSearch } from "@/components/search/command-search";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import { clearToken } from "@/lib/auth";

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
const PMarketplace     = ProtectedRoute(Marketplace);
const PMarketplaceListing = ProtectedRoute(MarketplaceListing);
const PSafety          = ProtectedRoute(Safety);
const PEvents          = ProtectedRoute(Events);
const PPolls           = ProtectedRoute(Polls);
const PProfile         = ProtectedRoute(Profile);
const PSettings        = ProtectedRoute(SettingsPage);
const PCommunity       = ProtectedRoute(Community);
const PPlaces          = ProtectedRoute(Places);
const PVolunteer       = ProtectedRoute(Volunteer);
const PHelp            = ProtectedRoute(Help);

// Admin-only page wrappers
const AAdminMembers       = AdminRoute(AdminMembers);
const AAdminPosts         = AdminRoute(AdminPosts);
const AAdminCommunity     = AdminRoute(AdminCommunity);
const AAdminAnnouncements = AdminRoute(AdminAnnouncements);

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Protected routes */}
      <Route path="/" component={PDashboard} />
      <Route path="/feed" component={PFeed} />
      <Route path="/marketplace" component={PMarketplace} />
      <Route path="/marketplace/:id" component={PMarketplaceListing} />
      <Route path="/safety" component={PSafety} />
      <Route path="/events" component={PEvents} />
      <Route path="/polls" component={PPolls} />
      <Route path="/profile/:id" component={PProfile} />
      <Route path="/settings" component={PSettings} />
      <Route path="/community" component={PCommunity} />
      <Route path="/places" component={PPlaces} />
      <Route path="/volunteer" component={PVolunteer} />
      <Route path="/help" component={PHelp} />

      {/* Admin-only routes */}
      <Route path="/announcements" component={AAdminAnnouncements} />
      <Route path="/admin" component={AAdminMembers} />
      <Route path="/admin/members" component={AAdminMembers} />
      <Route path="/admin/posts" component={AAdminPosts} />
      <Route path="/admin/community" component={AAdminCommunity} />
      <Route path="/admin/announcements" component={AAdminAnnouncements} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
          <MobileNav />
        </WouterRouter>
        <CommunityRulesModal />
        <OnboardingModal />
        <CommandSearch />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
