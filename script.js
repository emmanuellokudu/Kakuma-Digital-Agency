const root = document.body;
const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const themeButton = document.querySelector(".theme-toggle");
const progress = document.querySelector(".scroll-progress span");
const header = document.querySelector(".site-header");
const menuLabel = menuButton?.querySelector(".sr-only");

const currentPage = location.pathname.split("/").pop() || "index.html";
siteNav?.querySelectorAll("a").forEach((link) => {
  if (link.getAttribute("href") === currentPage)
    link.setAttribute("aria-current", "page");
});
if (currentPage === "contact.html")
  document
    .querySelector('.nav-cta[href="contact.html"]')
    ?.setAttribute("aria-current", "page");

let savedTheme = null;
try {
  savedTheme = localStorage.getItem("kda-theme");
} catch (_error) {}
if (savedTheme) root.dataset.theme = savedTheme;

function updateThemeButton() {
  if (!themeButton) return;
  const isDark = root.dataset.theme === "dark";
  themeButton.setAttribute("aria-pressed", String(isDark));
  themeButton.setAttribute(
    "aria-label",
    `Switch to ${isDark ? "light" : "dark"} mode`,
  );
}
updateThemeButton();

themeButton?.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("kda-theme", root.dataset.theme);
  } catch (_error) {}
  updateThemeButton();
});

function setMenuState(isOpen) {
  menuButton?.setAttribute("aria-expanded", String(isOpen));
  siteNav?.classList.toggle("is-open", isOpen);
  if (siteNav) {
    if (window.innerWidth <= 820)
      siteNav.setAttribute("aria-hidden", String(!isOpen));
    else siteNav.removeAttribute("aria-hidden");
  }
  if (menuLabel) menuLabel.textContent = isOpen ? "Close menu" : "Open menu";
}

menuButton?.addEventListener("click", () => {
  const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
  setMenuState(willOpen);
  if (willOpen) siteNav?.querySelector("a")?.focus();
});
siteNav
  ?.querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", () => setMenuState(false)));
document.addEventListener("click", (event) => {
  if (
    menuButton?.getAttribute("aria-expanded") === "true" &&
    header &&
    !header.contains(event.target)
  )
    setMenuState(false);
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton?.getAttribute("aria-expanded") === "true"
  ) {
    setMenuState(false);
    menuButton.focus();
  }
});
window.addEventListener("resize", () => setMenuState(false));
setMenuState(false);

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress)
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
if (reduceMotion) root.classList.add("no-motion");
const revealItems = document.querySelectorAll("[data-reveal]");
if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("revealed"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
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
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
  document.querySelectorAll(".browser-art").forEach((preview) => {
    const stopInteraction = () => preview.classList.remove("is-interacting");
    preview.addEventListener("pointerdown", () =>
      preview.classList.add("is-interacting"),
    );
    ["pointerup", "pointercancel", "pointerleave"].forEach((name) =>
      preview.addEventListener(name, stopInteraction),
    );
  });
}

document
  .querySelectorAll(".is-pending")
  .forEach((icon) =>
    icon.addEventListener("click", (event) => event.preventDefault()),
  );
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
let formIsSending = false;

function setFormStatus(message, state = "") {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  if (state) statusMessage.dataset.state = state;
  else delete statusMessage.dataset.state;
}

projectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (formIsSending) return;
  if (!projectForm.checkValidity()) {
    projectForm.reportValidity();
    return;
  }
  const honeypot = projectForm.elements.namedItem("website");
  if (honeypot?.value) {
    projectForm.reset();
    setFormStatus(
      "Thank you. Your project request has been sent to Kakuma Digital Agency.",
      "success",
    );
    return;
  }
  const emailjsConfig = window.KDA_SITE_CONFIG?.emailjs;
  if (
    !emailjsConfig?.publicKey ||
    !emailjsConfig.serviceId ||
    !emailjsConfig.templateId
  ) {
    setFormStatus(
      "Form delivery is not configured yet. Please use the email option.",
      "error",
    );
    return;
  }
  if (!window.emailjs?.sendForm) {
    setFormStatus(
      "The form service could not load. Please retry or use the email option.",
      "error",
    );
    return;
  }
  const submittedAt = projectForm.elements.namedItem("submitted_at");
  if (submittedAt) submittedAt.value = new Date().toISOString();
  formIsSending = true;
  if (submitButton) submitButton.disabled = true;
  if (submitLabel) submitLabel.textContent = "Sending…";
  setFormStatus("Sending your project request…");
  try {
    await window.emailjs.sendForm(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      projectForm,
      { publicKey: emailjsConfig.publicKey },
    );
    projectForm.reset();
    setFormStatus(
      "Thank you. Your project request has been sent to Kakuma Digital Agency.",
      "success",
    );
  } catch {
    setFormStatus(
      "We could not send your request. Your information is still here; please retry or use the email link.",
      "error",
    );
  } finally {
    formIsSending = false;
    if (submitButton) submitButton.disabled = false;
    if (submitLabel) submitLabel.textContent = "Submit Project Request";
  }
});
