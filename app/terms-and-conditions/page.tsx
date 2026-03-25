import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function TermsAndConditionsPage() {
  return (
    <PolicyPageLayout title="Terms and Conditions" lastUpdated="25 March 2026">
      <p>
        These Terms and Conditions constitute a binding agreement between the Helix Organizing
        Committee, Thapar Institute of Engineering and Technology ("Festival Organizers" or "we" or "us"
        or "our") and you ("participant" or "you" or "your") regarding your participation in Helix and
        use of our website and services.
      </p>

      <p>
        By registering for any event or using our website, you agree that you have read and accepted
        these Terms. We reserve the right to modify these Terms at any time. It is your responsibility to
        periodically review these Terms to stay informed of updates.
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-2">1. Registration and Participation</h2>
        <p>
          To participate in Helix events, you must provide accurate and complete information during
          registration. You are responsible for all activities that occur under your registration. False
          information may result in disqualification from events.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">2. Event Rules and Conduct</h2>
        <p>
          All participants must adhere to the specific rules and guidelines for each event. Unsportsmanlike
          conduct, cheating, or violation of event rules may result in immediate disqualification. The
          organizing committee's decisions regarding event conduct are final.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">3. Accommodation and Facilities</h2>
        <p>
          Accommodation arrangements are subject to availability and additional charges as specified.
          Participants are responsible for their personal belongings and any damages to institute property
          during their stay.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">4. Photography and Media</h2>
        <p>
          By participating in Helix, you consent to the use of your photographs, videos, and other
          media captured during the festival for promotional and documentation purposes by the
          organizing committee.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">5. Liability and Insurance</h2>
        <p>
          Participants participate at their own risk. The organizing committee and TIET are not liable for
          any injury, loss, or damage to persons or property during the festival. Participants are advised to
          have appropriate insurance coverage.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">6. Payment and Refunds</h2>
        <p>
          Registration fees and other charges must be paid as specified. Refund policies vary by event type
          and are detailed in the respective event guidelines. No refunds will be provided for cancellations
          made less than 48 hours before the event.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">7. Intellectual Property</h2>
        <p>
          All original works, projects, and creations presented during Helix remain the intellectual
          property of their creators. However, the organizing committee reserves the right to document and
          showcase these works for festival promotion.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">8. Force Majeure</h2>
        <p>
          The organizing committee is not liable for any failure to conduct events due to circumstances
          beyond our control, including natural disasters, government restrictions, or other force majeure
          events.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">9. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India. Any
          disputes shall be subject to the exclusive jurisdiction of the courts in Patiala, Punjab.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">10. Contact for Terms</h2>
        <p>
          All concerns or communications relating to these Terms must be communicated to us using the
          contact information provided on this website.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
