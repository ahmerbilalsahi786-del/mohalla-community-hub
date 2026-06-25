import { Link } from "wouter";

export default function Privacy() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-background px-5 py-10 text-foreground">
      <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Back to Mohalla</Link>
      <h1 className="mt-6 text-3xl font-bold">Privacy Policy</h1>
      <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground">
        <p>Mohalla stores account details, community posts, listings, event responses, safety reports and preferences so the community features can work.</p>
        <p>Community content is available only to approved members and administrators. Private contact details are limited to the account owner and authorized community managers.</p>
        <p>Images may be stored by the configured upload provider. Error monitoring is enabled only when the operator configures Sentry, with text and media masking enabled.</p>
        <p>You can export your account data or request permanent account deletion from Settings. Contact the community administrator for membership and moderation questions.</p>
      </div>
    </main>
  );
}
