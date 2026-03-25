import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function AboutUsPage() {
  return (
    <PolicyPageLayout title="About Us" lastUpdated="25 March 2026">
      <p>
        Thapar Institute of Engineering and Technology, Patiala, is an academic institution committed to
        excellence in education, innovation, and student development.
      </p>

      <p>
        This portal has been created to streamline accommodation-related payment workflows for outreach,
        fest, and campus event participants.
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-2">Legal Name</h2>
        <p>Thapar Institute of Engineering and Technology</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Portal Purpose</h2>
        <p>
          The platform enables participants to review accommodation options, complete digital payments,
          and receive transaction confirmation in a transparent and secure manner.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
