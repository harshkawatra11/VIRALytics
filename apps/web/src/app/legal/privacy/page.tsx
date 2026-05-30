import { H1, H2, P, UL, Updated, Note } from '@/components/legal-prose'

export const metadata = { title: 'Privacy Policy — VIRALytics' }

export default function PrivacyPage() {
  return (
    <>
      <H1>Privacy Policy</H1>
      <Updated date="May 30, 2026" />
      <Note>Template for review by counsel before launch. Bracketed values must be completed.</Note>

      <H2>Who this covers</H2>
      <P>
        This policy describes how we handle data for <strong>account holders</strong> (the agencies
        and managers who use VIRALytics) and the <strong>public social data</strong> we aggregate on
        their behalf.
      </P>

      <H2>Account-holder data we collect</H2>
      <UL>
        <li>Account: name, email, hashed password (managed by Supabase Auth).</li>
        <li>Billing: Stripe customer/subscription identifiers (card data is held by Stripe).</li>
        <li>Usage: the accounts you track and your in-app activity.</li>
      </UL>

      <H2>Public social data</H2>
      <P>
        For tracked accounts we store public profile and post-level metrics (views, likes,
        comments, shares, captions, hashtags, thumbnails, timestamps). For accounts you connect via
        OAuth, we store the additional private metrics the platform exposes to the owner, and the
        OAuth tokens themselves <strong>encrypted with AES-256-GCM</strong>.
      </P>

      <H2>What we deliberately do NOT collect</H2>
      <UL>
        <li>
          We do not store personal data about individual commenters, likers, or other third parties
          who interact with tracked posts.
        </li>
        <li>We do not sell personal data.</li>
      </UL>

      <H2>Storage &amp; security</H2>
      <P>
        Data is stored in Supabase (PostgreSQL) with row-level security isolating each tenant. OAuth
        tokens live in a table accessible only to our backend service role and are never exposed to
        the browser. Transport is HTTPS-only.
      </P>

      <H2>Retention &amp; deletion</H2>
      <P>
        You can delete a tracked account or your entire account at any time; deletion cascades to
        its posts, metrics, and tokens. Email [privacy@yourdomain.com] for data requests.
      </P>

      <H2>Contact</H2>
      <P>[privacy@yourdomain.com]</P>
    </>
  )
}
