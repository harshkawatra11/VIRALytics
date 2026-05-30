import { H1, H2, P, UL, Updated, Note } from '@/components/legal-prose'

export const metadata = { title: 'Terms of Service — VIRALytics' }

export default function TermsPage() {
  return (
    <>
      <H1>Terms of Service</H1>
      <Updated date="May 30, 2026" />
      <Note>
        Template for review. Have qualified counsel review and finalize before public launch.
        Bracketed values must be completed.
      </Note>

      <P>
        These Terms govern your use of VIRALytics (the “Service”), operated by [Legal Entity Name]
        (“we”, “us”). By creating an account you agree to these Terms.
      </P>

      <H2>1. What the Service does</H2>
      <P>
        VIRALytics aggregates <strong>publicly available</strong> social-media performance data for
        accounts you choose to track, and — where you explicitly connect an account you control via
        official platform OAuth — additional private metrics that the platform makes available to
        that account’s owner.
      </P>

      <H2>2. Acceptable use &amp; your attestation</H2>
      <P>When you add an account to track, you represent and warrant that:</P>
      <UL>
        <li>you own or control that account, or</li>
        <li>
          it is a public account you are authorized to monitor for a legitimate business purpose
          (e.g. competitive analysis of publicly visible content).
        </li>
      </UL>
      <P>You agree not to use the Service to:</P>
      <UL>
        <li>access non-public data without authorization;</li>
        <li>harass, stalk, dox, or surveil any individual;</li>
        <li>
          re-identify, aggregate, or store personal data about individual commenters, likers, or
          private persons; or
        </li>
        <li>violate any applicable law or a platform’s rights.</li>
      </UL>

      <H2>3. Platform data &amp; third-party terms</H2>
      <P>
        Social platforms (YouTube, Instagram, TikTok and others) are not affiliated with us and do
        not endorse the Service. Data accuracy depends on those platforms and may be delayed,
        incomplete, or temporarily unavailable. We collect public data at reasonable rates and honor
        platform signals; we may suspend collection for any account at our discretion.
      </P>

      <H2>4. Subscriptions &amp; billing</H2>
      <P>
        Paid plans are billed through Stripe on a recurring basis. You can cancel anytime via the
        billing portal; access continues until the end of the current period. Trials, where offered,
        convert to paid unless cancelled before the trial ends.
      </P>

      <H2>5. Disclaimers &amp; liability</H2>
      <P>
        The Service is provided “as is”, without warranties of any kind. To the maximum extent
        permitted by law, our aggregate liability is limited to the amounts you paid us in the 12
        months preceding the claim.
      </P>

      <H2>6. Termination</H2>
      <P>
        We may suspend or terminate accounts that breach these Terms, including the acceptable-use
        rules above.
      </P>

      <H2>7. Contact</H2>
      <P>Questions: [legal@yourdomain.com].</P>
    </>
  )
}
