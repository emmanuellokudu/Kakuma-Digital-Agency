const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const attempts = new Map();

const allowedServices = new Set([
  "Website design & development",
  "Graphic design & brand identity",
  "Social media management",
  "Digital strategy & support",
  "Not sure yet",
]);
const allowedFileTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

function clean(value, maxLength) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength)
    : "";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function validate(body = {}) {
  const data = {
    name: clean(body.name, 100),
    organisation: clean(body.organisation, 120),
    phone: clean(body.phone, 30),
    email: clean(body.email, 160).toLowerCase(),
    location: clean(body.location, 100),
    service: clean(body.service, 80),
    budget: clean(body.budget, 80),
    deadline: clean(body.deadline, 80),
    description: clean(body.description, 4000),
    website: clean(body.website, 200),
  };
  const errors = {};

  if (data.website) errors.website = "Spam check failed.";
  if (data.name.length < 2) errors.name = "Enter your full name.";
  if (!/^[+()\d\s.-]{7,30}$/.test(data.phone)) errors.phone = "Enter a valid phone or WhatsApp number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (!allowedServices.has(data.service)) errors.service = "Choose a valid service.";
  if (data.description.length < 20) errors.description = "Add at least 20 characters about the project.";

  let attachment = null;
  if (body.attachment) {
    const name = clean(body.attachment.name, 150);
    const type = clean(body.attachment.type, 120);
    const content = typeof body.attachment.content === "string" ? body.attachment.content : "";
    const size = Number(body.attachment.size);
    if (!allowedFileTypes.has(type)) errors.attachment = "Use PDF, DOC, DOCX, JPG or PNG.";
    else if (!Number.isFinite(size) || size < 1 || size > MAX_ATTACHMENT_BYTES) errors.attachment = "The file must be 2 MB or smaller.";
    else if (!/^[A-Za-z0-9+/]+={0,2}$/.test(content)) errors.attachment = "The attachment could not be read.";
    else if (Buffer.byteLength(content, "base64") > MAX_ATTACHMENT_BYTES) errors.attachment = "The file must be 2 MB or smaller.";
    else attachment = { name, type, content };
  }

  return { data, errors, attachment };
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function json(response, status, payload) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.status(status).json(payload);
}

async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { ok: false, message: "Method not allowed." });
  }

  const ip = clean(request.headers["x-forwarded-for"]?.split(",")[0] || request.socket?.remoteAddress || "unknown", 80);
  if (isRateLimited(ip)) return json(response, 429, { ok: false, message: "Too many attempts. Please wait ten minutes or use email." });

  const { data, errors, attachment } = validate(request.body);
  if (Object.keys(errors).length) return json(response, 400, { ok: false, message: "Please correct the highlighted fields.", errors });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL || "kakuma.digital.agency@gmail.com";
  if (!apiKey || !fromEmail) return json(response, 503, { ok: false, message: "Form delivery is not configured yet. Please use the email option." });

  const rows = [
    ["Name", data.name], ["Organisation", data.organisation || "Not provided"],
    ["Phone / WhatsApp", data.phone], ["Email", data.email], ["Location", data.location || "Not provided"],
    ["Service", data.service], ["Budget", data.budget || "Not provided"], ["Deadline", data.deadline || "Not provided"],
  ].map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #ddd">${label}</th><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(value)}</td></tr>`).join("");

  const payload = {
    from: `KDA Website <${fromEmail}>`,
    to: [toEmail],
    reply_to: data.email,
    subject: `New KDA project brief: ${data.service}`,
    html: `<h1>New project brief</h1><table>${rows}</table><h2>Project description</h2><p style="white-space:pre-wrap">${escapeHtml(data.description)}</p>`,
  };
  if (attachment) payload.attachments = [{ filename: attachment.name, content: attachment.content }];

  try {
    const delivery = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!delivery.ok) return json(response, 502, { ok: false, message: "Delivery failed. Your details are still in the form; please retry or use email." });
    return json(response, 200, { ok: true, message: "Thank you. Your project brief has been sent to KDA." });
  } catch (_error) {
    return json(response, 502, { ok: false, message: "Delivery failed. Your details are still in the form; please retry or use email." });
  }
}

module.exports = handler;
module.exports.validate = validate;
module.exports.constants = { MAX_ATTACHMENT_BYTES };
