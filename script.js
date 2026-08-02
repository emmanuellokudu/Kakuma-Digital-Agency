const root = document.body;
const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const themeButton = document.querySelector(".theme-toggle");
const progress = document.querySelector(".scroll-progress span");
const header = document.querySelector(".site-header");
const menuLabel = menuButton?.querySelector(".sr-only");

const currentPage = location.pathname.split("/").pop() || "index.html";
siteNav?.querySelectorAll("a").forEach((link) => {
  if (link.getAttribute("href") === currentPage) link.setAttribute("aria-current", "page");
});
if (currentPage === "contact.html") document.querySelector('.nav-cta[href="contact.html"]')?.setAttribute("aria-current", "page");

let savedTheme = null;
try { savedTheme = localStorage.getItem("kda-theme"); } catch (_error) {}
if (savedTheme) root.dataset.theme = savedTheme;

function updateThemeButton() {
  if (!themeButton) return;
  const isDark = root.dataset.theme === "dark";
  themeButton.setAttribute("aria-pressed", String(isDark));
  themeButton.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
}
updateThemeButton();

themeButton?.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("kda-theme", root.dataset.theme); } catch (_error) {}
  updateThemeButton();
});

function setMenuState(isOpen) {
  menuButton?.setAttribute("aria-expanded", String(isOpen));
  siteNav?.classList.toggle("is-open", isOpen);
  if (siteNav) {
    if (window.innerWidth <= 820) siteNav.setAttribute("aria-hidden", String(!isOpen));
    else siteNav.removeAttribute("aria-hidden");
  }
  if (menuLabel) menuLabel.textContent = isOpen ? "Close menu" : "Open menu";
}

menuButton?.addEventListener("click", () => {
  const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
  setMenuState(willOpen);
  if (willOpen) siteNav?.querySelector("a")?.focus();
});
siteNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuState(false)));
document.addEventListener("click", (event) => {
  if (menuButton?.getAttribute("aria-expanded") === "true" && header && !header.contains(event.target)) setMenuState(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
    setMenuState(false);
    menuButton.focus();
  }
});
window.addEventListener("resize", () => setMenuState(false));
setMenuState(false);

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduceMotion) root.classList.add("no-motion");
const revealItems = document.querySelectorAll("[data-reveal]");
if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("revealed"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

if (!reduceMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (window.innerWidth < 720) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateY(-5px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
  document.querySelectorAll(".browser-art").forEach((preview) => {
    const stopInteraction = () => preview.classList.remove("is-interacting");
    preview.addEventListener("pointerdown", () => preview.classList.add("is-interacting"));
    ["pointerup", "pointercancel", "pointerleave"].forEach((name) => preview.addEventListener(name, stopInteraction));
  });
}

document.querySelectorAll(".is-pending").forEach((icon) => icon.addEventListener("click", (event) => event.preventDefault()));
document.getElementById("year")?.append(new Date().getFullYear());

function configureWhatsApp() {
  const number = window.KDA_SITE_CONFIG?.whatsappNumber?.replace(/\D/g, "");
  if (!number || number.length < 8) return;
  const url = `https://wa.me/${number}?text=${encodeURIComponent("Hello KDA, I would like to discuss a digital project.")}`;
  const slot = document.querySelector("[data-whatsapp-slot]");
  if (slot) {
    const link = document.createElement("a");
    link.className = "text-link whatsapp-link";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Chat with KDA on WhatsApp ↗";
    slot.replaceChildren(link);
  }
  const floatingLink = document.createElement("a");
  floatingLink.className = "whatsapp-float";
  floatingLink.href = url;
  floatingLink.target = "_blank";
  floatingLink.rel = "noopener noreferrer";
  floatingLink.setAttribute("aria-label", "Chat with KDA on WhatsApp");
  floatingLink.textContent = "WhatsApp";
  document.body.append(floatingLink);
}
configureWhatsApp();

const projectForm = document.getElementById("project-form");
const statusMessage = document.querySelector(".form-status");
const submitButton = projectForm?.querySelector('button[type="submit"]');
const submitLabel = submitButton?.querySelector(".submit-label");
const maximumAttachmentSize = 2 * 1024 * 1024;
const acceptedAttachmentTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"]);
let formIsSending = false;

function setFormStatus(message, state = "") {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  if (state) statusMessage.dataset.state = state;
  else delete statusMessage.dataset.state;
}

function readAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const content = String(reader.result).split(",")[1];
      if (!content) reject(new Error("The file could not be read."));
      else resolve({ name: file.name, type: file.type, size: file.size, content });
    });
    reader.addEventListener("error", () => reject(new Error("The file could not be read.")));
    reader.readAsDataURL(file);
  });
}

function validateAttachment() {
  const input = projectForm?.elements.namedItem("attachment");
  const file = input?.files?.[0];
  if (!file) return null;
  if (file.size > maximumAttachmentSize) input.setCustomValidity("Choose a file no larger than 2 MB.");
  else if (!acceptedAttachmentTypes.has(file.type)) input.setCustomValidity("Choose a PDF, DOC, DOCX, JPG or PNG file.");
  else input.setCustomValidity("");
  return file;
}

projectForm?.elements.namedItem("attachment")?.addEventListener("change", () => {
  validateAttachment();
  projectForm.elements.namedItem("attachment").reportValidity();
});

projectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (formIsSending) return;
  const file = validateAttachment();
  if (!projectForm.checkValidity()) {
    projectForm.reportValidity();
    return;
  }
  const submittedAt = projectForm.elements.namedItem("submitted_at");
  if (submittedAt) submittedAt.value = new Date().toISOString();
  formIsSending = true;
  if (submitButton) submitButton.disabled = true;
  if (submitLabel) submitLabel.textContent = "Sending…";
  setFormStatus("Sending your project brief…");
  try {
    const formData = new FormData(projectForm);
    const payload = Object.fromEntries(formData.entries());
    delete payload.attachment;
    if (file) payload.attachment = await readAttachment(file);
    const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Delivery failed. Your details are still in the form; please retry or use email.");
    projectForm.reset();
    setFormStatus(result.message || "Thank you. Your project brief has been sent to Kakuma Digital Agency.", "success");
  } catch (error) {
    setFormStatus(error.message || "We could not send your brief. Your information is still here; please retry or use the email link.", "error");
  } finally {
    formIsSending = false;
    if (submitButton) submitButton.disabled = false;
    if (submitLabel) submitLabel.textContent = "Send project brief";
  }
});
