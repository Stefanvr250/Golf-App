import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Terms of Service</h1>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        <p><strong>Effective Date:</strong> {new Date().toLocaleDateString("en-ZA")}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By creating an account and using GolfApp, you agree to these Terms of Service.
          If you do not agree, do not use the service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          GolfApp is a golf scoring, handicap tracking, and social platform. Features
          include course management, round scoring, tournament organization, predictions,
          friend connections, and data export.
        </p>

        <h2>3. User Accounts</h2>
        <ul>
          <li>You must provide accurate information when registering</li>
          <li>You are responsible for maintaining the security of your account</li>
          <li>You must be at least 13 years old to use the service</li>
        </ul>

        <h2>4. User Content</h2>
        <p>
          You retain ownership of content you submit (scores, photos, course data).
          By submitting content, you grant GolfApp a license to store, display, and
          process it as needed to provide the service.
        </p>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Submit false or misleading scores</li>
          <li>Harass other users via chat or friend features</li>
          <li>Upload inappropriate or illegal content</li>
          <li>Attempt to manipulate handicap calculations or predictions</li>
          <li>Access admin features without authorization</li>
        </ul>

        <h2>6. Limitation of Liability</h2>
        <p>
          GolfApp is provided &quot;as is&quot; without warranty. We are not liable for
          data loss, scoring errors, or service interruptions. Handicap calculations
          are for recreational use and may not match official handicap systems.
        </p>

        <h2>7. Termination</h2>
        <p>
          You may delete your account at any time. We reserve the right to suspend
          or terminate accounts that violate these terms.
        </p>

        <h2>8. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the service
          after changes constitutes acceptance.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These terms are governed by the laws of South Africa.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about these terms, contact us at legal@golfapp.co.za.
        </p>
      </div>
    </div>
  );
}
