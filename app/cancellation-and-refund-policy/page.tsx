import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function CancellationAndRefundPolicyPage() {
  return (
    <PolicyPageLayout title="Cancellation and Refund Policy" lastUpdated="25 March 2026">
      <p>
        This policy applies to accommodation payments made on this portal for college outreach and event
        participation.
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-2">1. Cancellation by Participant</h2>
        <p>
          Cancellation requests must be raised in writing via the official contact email. The eligible
          refund, if any, will depend on the request date and event timelines communicated by the organizers.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">2. Refund Eligibility</h2>
        <p>
          Refunds are generally processed only for eligible cases such as duplicate payment, failed booking
          with successful debit, or approved cancellation under event guidelines.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">3. Non-Refundable Cases</h2>
        <p>
          Convenience charges, payment gateway charges, and late cancellation requests may be non-refundable,
          unless otherwise approved by the competent authority.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">4. Refund Timeline</h2>
        <p>
          Approved refunds are typically processed to the original payment source within 7 to 15 working days,
          subject to banking and payment partner timelines.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">5. College Right to Modify</h2>
        <p>
          Thapar Institute reserves the right to update this policy based on operational, legal,
          or event-specific requirements.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
