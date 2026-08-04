# Project enquiry form setup

The form sends enquiries directly from the browser through EmailJS.

## EmailJS setup

1. Create an EmailJS account and connect the inbox that should receive project briefs.
2. Create an email template. Its variables can use the form field names: `name`, `organisation`, `phone`, `email`, `location`, `service`, `budget`, `deadline`, `description`, and `submitted_at`.
3. Copy the Public Key, Service ID, and Template ID into the `emailjs` object in `site-config.js`.
4. In the template, set **To Email** directly to `kakuma.digital.agency@gmail.com` and **Reply-To** to `{{email}}`. Do not use a visitor-controlled variable for the recipient address.
5. Deploy the site, submit one real test brief, and confirm delivery and reply-to behavior.

Files are not collected through the enquiry form. If a project requires reference files, KDA can request them later through email or WhatsApp.

The EmailJS public key is designed for browser use. Never add an EmailJS private key or mailbox password to this repository. Until the first real delivery is confirmed, the site must not be described as having tested production delivery. If any required ID is blank, the form shows a configuration error and preserves the visitor's fields.

## WhatsApp

Add the verified number to `site-config.js` using digits only, including country code. For example, a Kenyan number would follow the format `254…`. Do not add an example number as a real contact.

When configured, the site automatically adds the contact-page link and floating WhatsApp button with this message:

> Hello KDA, I would like to discuss a digital project.

## Built-in protections

- Client-side validation
- Hidden honeypot field
- Duplicate-submission blocking in the browser
- Generic visitor-facing delivery errors
