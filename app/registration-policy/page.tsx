import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function RegistrationPolicyPage() {
  return (
    <PolicyPageLayout title="Registration Policy" lastUpdated="25 March 2026">
      <section>
        <h2 className="text-xl font-semibold mb-2">Registration Process</h2>
        <p>
          All participants must register through the official Helix website. Registration requires
          accurate personal information, valid contact details, and payment of applicable fees. Incomplete
          registrations will not be processed.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Registration Fees</h2>
        <p>
          Registration fees vary by event type and participant category (Thapar students vs. external
          participants). Fees include event participation, basic amenities, and festival kit. Accommodation
          and meals are charged separately.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Team Registrations</h2>
        <p>
          For team events, all team members must be registered individually. Team composition cannot be
          changed after the registration deadline. Substitutions are only allowed in exceptional
          circumstances with prior approval from the organizing committee.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Registration Deadlines</h2>
        <p>
          Registration deadlines are strictly enforced. Late registrations may be accepted on a
          case-by-case basis with additional charges. Early bird discounts are available for registrations
          completed before specified dates.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Confirmation and Communication</h2>
        <p>
          Upon successful registration, participants will receive confirmation emails with event details,
          reporting instructions, and necessary guidelines. Please ensure your contact information is
          accurate to receive important updates.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
