import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        <p><strong>Effective Date:</strong> {new Date().toLocaleDateString("en-ZA")}</p>

        <h2>1. Information We Collect</h2>
        <p>
          GolfApp collects the following personal information when you create an account
          and use the service:
        </p>
        <ul>
          <li>Email address and display name</li>
          <li>Golf scores, handicap history, and round data</li>
          <li>GPS location data (only while actively using course maps)</li>
          <li>Photos uploaded to tournament chat</li>
          <li>Friend connections and activity</li>
        </ul>

        <h2>2. How We Use Your Data</h2>
        <p>Your data is used to:</p>
        <ul>
          <li>Provide scoring, handicap tracking, and tournament features</li>
          <li>Display your profile to friends and tournament participants</li>
          <li>Calculate leaderboards and predictions</li>
          <li>Improve the app experience</li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>
          Your data is stored securely using Supabase (PostgreSQL) hosted infrastructure.
          Data is encrypted in transit (TLS) and at rest. Offline data is stored locally
          on your device using IndexedDB and synced when connectivity is restored.
        </p>

        <h2>4. POPIA Compliance</h2>
        <p>
          In accordance with the Protection of Personal Information Act (POPIA) of
          South Africa:
        </p>
        <ul>
          <li><strong>Right to access:</strong> You can view all your data in the app</li>
          <li><strong>Right to correction:</strong> You can edit your profile and scores</li>
          <li><strong>Right to deletion:</strong> You can delete your account and all associated data from your profile settings</li>
          <li><strong>Right to data portability:</strong> You can export your round data as CSV or PDF</li>
          <li><strong>Consent:</strong> By creating an account, you consent to the collection and processing of your data as described in this policy</li>
        </ul>

        <h2>5. Data Sharing</h2>
        <p>
          We do not sell your personal data. Your scores and activity are shared only with
          your approved friends and tournament participants as part of the app features.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          Your data is retained for as long as your account is active. Upon account deletion,
          all personal data is permanently removed within 30 days.
        </p>

        <h2>7. Contact</h2>
        <p>
          For privacy inquiries, contact us at privacy@golfapp.co.za.
        </p>
      </div>
    </div>
  );
}
