import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function TermsAndConditionsPage() {
  return (
    <PolicyPageLayout title="Terms and Conditions" lastUpdated="25 March 2026">
      <p>
        These Terms and Conditions govern the use of the Thapar Institute Accommodation Payment Portal
        for outreach and event-related accommodation bookings.
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
        <p>
          By using this portal, you agree to comply with these terms, the Privacy Policy, and the
          Cancellation and Refund Policy published on this website.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">2. Service Scope</h2>
        <p>
          This portal is provided to facilitate online payment collection for accommodation packages
          offered during specific college events. Availability of packages and prices may vary by event.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">3. User Responsibilities</h2>
        <p>
          You must provide accurate personal and booking information. Any incorrect details may affect
          booking confirmation, allotment, or refund processing.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">4. Payments</h2>
        <p>
          Payments are processed via authorized third-party payment partners. A booking is treated as
          confirmed only after successful payment acknowledgment from the payment gateway and portal.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">5. Modification or Cancellation of Services</h2>
        <p>
          Thapar Institute reserves the right to revise accommodation rules, pricing, timelines,
          and allotment policies where required for operational or administrative reasons.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
        <p>
          Thapar Institute shall not be liable for losses caused by user-side errors, payment network
          interruptions, force majeure events, or third-party payment service outages.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">7. Governing Law and Jurisdiction</h2>
        <p>
          These terms are governed by the laws of India. Any disputes are subject to the jurisdiction
          of courts in Patiala, Punjab.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
