# Project enquiry form setup

The form sends enquiries through the server-side Vercel function at `api/contact.js`. Private credentials are never included in browser files.

## Required Vercel environment variables

1. Create a Resend account and verify a sending domain.
2. In Vercel, open **Project Settings → Environment Variables**.
3. Add:
   - `RESEND_API_KEY`: the private Resend API key.
   - `CONTACT_FROM_EMAIL`: an address on the verified sending domain, such as `enquiries@example.org`.
   - `CONTACT_TO_EMAIL`: the inbox that should receive briefs. If omitted, the endpoint uses `kakuma.digital.agency@gmail.com`.
4. Redeploy the project.
5. Submit one real test brief and confirm that it arrives and that replying addresses the visitor's email.

Until the first real delivery is confirmed, the site must not be described as having tested production delivery. The form returns a clear configuration error and preserves the visitor's fields when credentials are missing.

## WhatsApp

Add the verified number to `site-config.js` using digits only, including country code. For example, a Kenyan number would follow the format `254…`. Do not add an example number as a real contact.

When configured, the site automatically adds the contact-page link and floating WhatsApp button with this message:

> Hello KDA, I would like to discuss a digital project.

## Built-in protections

- Client- and server-side validation
- Hidden honeypot field
- Five-attempt rate limit per ten minutes per IP (best-effort in serverless instances)
- Two-megabyte attachment limit
- PDF, DOC, DOCX, JPG and PNG allowlist
- HTML escaping before email rendering
- Duplicate-submission blocking in the browser
- Generic visitor-facing delivery errors
