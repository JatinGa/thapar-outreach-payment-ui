import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function ContactPage() {
  return (
    <PolicyPageLayout title="Contact Details" lastUpdated="25 March 2026">
      <p>
        You may contact us using the information below:
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-2">Event Organizer</h2>
        <p>Helix Organizing Committee</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Institution</h2>
        <p>Thapar Institute of Engineering and Technology</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Legal Name</h2>
        <p>Thapar Institute of Engineering and Technology</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Contact Number</h2>
        <p>98149-56560</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Email ID</h2>
        <p>accommodationsthapar@gmail.com</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Address</h2>
        <p>Thapar Institute of Engineering and Technology, Patiala, Punjab - 147004, India</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Festival Dates</h2>
        <p>17-19 April</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Website</h2>
        <p>helix.thapar.edu</p>
      </section>
    </PolicyPageLayout>
  );
}
