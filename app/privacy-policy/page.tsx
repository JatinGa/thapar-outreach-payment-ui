import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageLayout title="Privacy Policy" lastUpdated="25 March 2026">
      <p>
        Thapar Institute of Engineering and Technology is committed to protecting your personal data.
        This policy describes how information is collected, used, and protected when you use this portal.
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
        <p>
          We may collect your name, email address, phone number, event-related booking preferences,
          and payment transaction identifiers required for processing bookings.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">2. How We Use Data</h2>
        <p>
          Data is used for booking confirmation, payment reconciliation, accommodation allotment,
          customer support, compliance, and audit requirements.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">3. Payment Data</h2>
        <p>
          Payments are processed through secure third-party gateways. Sensitive card or banking details
          are not stored by this portal.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">4. Data Sharing</h2>
        <p>
          Data may be shared only with authorized administrative teams and service providers as required
          to deliver accommodation services and complete payment operations.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">5. Data Retention and Security</h2>
        <p>
          Records are retained only for as long as necessary under institutional and legal requirements.
          Reasonable technical and organizational safeguards are applied to protect stored information.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">6. Contact for Privacy Queries</h2>
        <p>
          For privacy-related concerns, contact us through the details listed on the Contact page.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
