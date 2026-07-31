# Kakuma Digital Agency website

A responsive, multi-page agency website for Kakuma Digital Agency (KDA). It uses a bold, futuristic interface with interactive hover effects, scroll reveals and a persistent dark/light mode toggle.

## Open locally

Open `index.html` in a browser, or run a local static server from this folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Before launch

1. The official agency email is `kakuma.digital.agency@gmail.com`.
2. Add KDA's official WhatsApp link where required.
3. Replace the founder image with an approved KDA team photo.
4. Add real case studies and client testimonials only after receiving approval.
5. Add a domain, hosting and analytics.

## EmailJS contact form

The contact form is wired to EmailJS and sends project briefs to
`kakuma.digital.agency@gmail.com`.

1. Connect the agency email as an Email Service in the EmailJS dashboard.
2. Create a template with **To Email** set to `{{to_email}}`, **Reply To** set
   to `{{email}}`, and a subject such as
   `New KDA project enquiry — {{service}}`.
3. Use these form variables in the template as needed: `name`, `organisation`,
   `phone`, `whatsapp`, `email`, `location`, `service`, `budget`, `deadline`,
   `description`, and `submitted_at`.
4. To receive the optional upload, add a **Form File Attachment** in the
   template's Attachments tab and set its parameter name to `attachment`.
5. Copy the EmailJS Public Key, Service ID, and Template ID into
   `emailjs-config.js`. Never place an EmailJS Private Key in client-side code.

## Files

- `index.html` — Home page
- `about.html` — KDA story, values and approach
- `services.html` — Detailed agency services
- `work.html` — Capabilities and verified-work policy
- `team.html` — Team members and social profile icons
- `contact.html` — Project brief form
- `styles.css` — visual design, dark/light theme and responsive layouts
- `script.js` — navigation, dark mode, scroll animation, card interaction and project-email form behaviour
- `assets/logo/kda-main-logo.png` — primary Kakuma Digital Agency logo
