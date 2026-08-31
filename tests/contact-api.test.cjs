const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/contact.js");

const validBody = {
  name: "Test Visitor",
  organisation: "Test Organisation",
  phone: "+254 700 000 000",
  email: "visitor@example.com",
  location: "Kakuma",
  service: "Website Design and Development",
  budget: "KES 30,000 – 60,000",
  deadline: "30 August",
  description: "We need a clear and accessible website for our organisation.",
  website: "",
};

function mockResponse() {
  return {
    headers: {}, statusCode: 200, body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test("accepts a complete valid brief", () => {
  const result = handler.validate(validBody);
  assert.deepEqual(result.errors, {});
  assert.equal(result.data.email, "visitor@example.com");
});

test("rejects spam, invalid contact details and short descriptions", () => {
  const result = handler.validate({ ...validBody, website: "spam", phone: "abc", email: "bad", description: "short" });
  assert.ok(result.errors.website);
  assert.ok(result.errors.phone);
  assert.ok(result.errors.email);
  assert.ok(result.errors.description);
});

test("returns a safe configuration error when credentials are unavailable", async () => {
  const oldKey = process.env.RESEND_API_KEY;
  const oldFrom = process.env.CONTACT_FROM_EMAIL;
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_FROM_EMAIL;
  const response = mockResponse();
  await handler({ method: "POST", headers: { "x-forwarded-for": "test-config" }, socket: {}, body: validBody }, response);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.ok, false);
  if (oldKey) process.env.RESEND_API_KEY = oldKey;
  if (oldFrom) process.env.CONTACT_FROM_EMAIL = oldFrom;
});

test("sends a validated brief through the configured provider", async () => {
  const originalFetch = global.fetch;
  let outgoing;
  process.env.RESEND_API_KEY = "test-key";
  process.env.CONTACT_FROM_EMAIL = "enquiries@example.org";
  global.fetch = async (_url, options) => { outgoing = JSON.parse(options.body); return { ok: true }; };
  const response = mockResponse();
  await handler({ method: "POST", headers: { "x-forwarded-for": "test-success" }, socket: {}, body: validBody }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(outgoing.reply_to, validBody.email);
  assert.match(outgoing.subject, /Website Design/);
  global.fetch = originalFetch;
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_FROM_EMAIL;
});
