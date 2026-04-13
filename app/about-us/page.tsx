import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function AboutUsPage() {
  return (
    <PolicyPageLayout title="About Us" lastUpdated="13 April 2026">
      <h2 className="text-xl font-semibold text-foreground mt-2 mb-3">
        Thapar Institute of Engineering &amp; Technology
      </h2>
      <p>
        Thapar Institute of Engineering and Technology (TIET) is a premier private technical
        university located in Patiala, Punjab, India. Established in 1956 and granted the
        status of a Deemed University in 1985, TIET has grown into one of India's most respected
        engineering institutions, consistently ranked among the top private engineering
        universities in the country.
      </p>

      <p>
        The institute is home to a vibrant academic community of over 12,000 students, offering
        undergraduate, postgraduate, and doctoral programmes across disciplines including
        engineering, technology, science, management, and humanities. TIET is known for its
        world-class research facilities, strong industry partnerships, and a culture of
        innovation and entrepreneurship.
      </p>

      <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">
        About This Portal
      </h2>
      <p>
        This is the official Accommodation Payment Portal for events and fests hosted at Thapar
        Institute of Engineering and Technology. It is designed to provide a seamless, secure,
        and transparent experience for outstation participants who wish to book accommodation
        and food services during their visit to campus.
      </p>

      <p>
        Participants are redirected to this portal from their respective fest websites after
        completing event registration. All payments are processed securely through Easebuzz,
        a RBI-compliant payment gateway. No direct walk-in or off-portal payments are accepted
        through this system.
      </p>

      <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">
        Built by Team CCS
      </h2>
      <p>
        This portal is built and maintained by <strong>Team CCS</strong> — the technical team
        at Thapar Institute responsible for developing and managing digital infrastructure for
        campus events. The team ensures that every aspect of the portal, from registration
        flows to payment handling, meets high standards of reliability and security.
      </p>

      <p>
        Should you have any questions, face any issues, or require support, please reach out
        to us through the contact details provided on this site. We are here to make your
        campus visit experience as smooth as possible.
      </p>
    </PolicyPageLayout>
  );
}
