import { Link } from "wouter";

export default function Terms() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-background px-5 py-10 text-foreground">
      <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Back to Mohalla</Link>
      <h1 className="mt-6 text-3xl font-bold">Community Terms</h1>
      <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground">
        <p>Use Mohalla for lawful, respectful neighborhood communication. Do not post harassment, threats, fraud, private information without permission, or misleading emergency reports.</p>
        <p>Marketplace transactions are arranged directly between members. Verify items and payment details independently before completing a transaction.</p>
        <p>Community administrators may approve memberships, moderate content, resolve reports and remove accounts that put residents or the service at risk.</p>
        <p>Safety alerts support community awareness but do not replace emergency services. Contact the appropriate local authority for urgent emergencies.</p>
      </div>
    </main>
  );
}
