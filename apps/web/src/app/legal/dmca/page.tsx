import { H1, H2, P, UL, Updated, Note } from '@/components/legal-prose'

export const metadata = { title: 'DMCA & Takedowns — VIRALytics' }

export default function DmcaPage() {
  return (
    <>
      <H1>DMCA &amp; Takedown Requests</H1>
      <Updated date="May 30, 2026" />
      <Note>Template for review by counsel before launch. Bracketed values must be completed.</Note>

      <P>
        We respect intellectual-property rights and the wishes of account owners. If you are a
        rights holder or the owner of an account being tracked and you want content or data removed,
        contact our designated agent and we will act promptly.
      </P>

      <H2>Designated agent</H2>
      <P>[DMCA Agent Name] — [dmca@yourdomain.com] — [Postal Address]</P>

      <H2>What to include</H2>
      <UL>
        <li>Identification of the work or account at issue and the URL(s) involved.</li>
        <li>Your contact information.</li>
        <li>
          A statement that you have a good-faith belief the use is not authorized, and that the
          information in your notice is accurate.
        </li>
        <li>Your physical or electronic signature.</li>
      </UL>

      <H2>Account-owner opt-out</H2>
      <P>
        If you own an account being tracked on VIRALytics and do not consent to its monitoring,
        email [dmca@yourdomain.com] and we will stop collection and remove stored data for that
        account.
      </P>

      <H2>Repeat infringers</H2>
      <P>We terminate the accounts of users who repeatedly violate these rights.</P>
    </>
  )
}
