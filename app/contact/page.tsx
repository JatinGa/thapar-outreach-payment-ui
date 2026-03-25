import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function ContactPage() {
  return (
    <PolicyPageLayout title="Contact Details" lastUpdated="25 March 2026">
      <p>
        For portal support, payment issues, or policy-related queries, contact the institute using the
        official details below.
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-2">Legal Name</h2>
        <p>Thapar Institute of Engineering and Technology</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Contact Number</h2>
        <p>xxxxx-xxxxx</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Email ID</h2>
        <p>xxxx@thapar.edu</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Address</h2>
        <p>
          Thapar Institute of Engineering and Technology,<br />
          Bhadson Road, Adarsh Nagar,<br />
          Patiala, Punjab 147004, India
        </p>
      </section>
    </PolicyPageLayout>
  );
}
