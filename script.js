const root = document.body;
const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const themeButton = document.querySelector(".theme-toggle");
const progress = document.querySelector(".scroll-progress span");
const header = document.querySelector(".site-header");
const menuLabel = menuButton?.querySelector(".sr-only");

const savedTheme = localStorage.getItem("kda-theme");
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
  localStorage.setItem("kda-theme", root.dataset.theme);
  updateThemeButton();
});

function setMenuState(isOpen) {
  menuButton?.setAttribute("aria-expanded", String(isOpen));
  siteNav?.classList.toggle("is-open", isOpen);
  if (menuLabel) menuLabel.textContent = isOpen ? "Close menu" : "Open menu";
}

menuButton?.addEventListener("click", () => {
  setMenuState(menuButton.getAttribute("aria-expanded") !== "true");
});

siteNav?.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    setMenuState(false);
  }),
);

document.addEventListener("click", (event) => {
  if (
    menuButton?.getAttribute("aria-expanded") === "true" &&
    header &&
    !header.contains(event.target)
  ) {
    setMenuState(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuState(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 820) setMenuState(false);
});

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
    preview.addEventListener("pointerup", stopInteraction);
    preview.addEventListener("pointercancel", stopInteraction);
    preview.addEventListener("pointerleave", stopInteraction);
  });
}

document
  .querySelectorAll(".is-pending")
  .forEach((icon) =>
    icon.addEventListener("click", (event) => event.preventDefault()),
  );
document.getElementById("year")?.append(new Date().getFullYear());

const projectForm = document.getElementById("project-form");
const statusMessage = document.querySelector(".form-status");
const emailJsConfig = window.KDA_EMAILJS_CONFIG;
const submitButton = projectForm?.querySelector('button[type="submit"]');
const submitLabel = submitButton?.querySelector(".submit-label");

function hasEmailJsConfig() {
  return [
    emailJsConfig?.publicKey,
    emailJsConfig?.serviceId,
    emailJsConfig?.templateId,
  ].every(
    (value) =>
      typeof value === "string" &&
      value.length > 0 &&
      !value.startsWith("YOUR_EMAILJS_"),
  );
}

function setFormStatus(message, state = "") {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  if (state) statusMessage.dataset.state = state;
  else delete statusMessage.dataset.state;
}

projectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!projectForm.checkValidity()) {
    projectForm.reportValidity();
    return;
  }

  if (!window.emailjs || !hasEmailJsConfig()) {
    setFormStatus(
      "Email delivery is not configured yet. Please email kakuma.digital.agency@gmail.com directly.",
      "error",
    );
    return;
  }

  const submittedAt = projectForm.elements.namedItem("submitted_at");
  if (submittedAt) submittedAt.value = new Date().toISOString();

  if (submitButton) submitButton.disabled = true;
  if (submitLabel) submitLabel.textContent = "Sending…";
  setFormStatus("Sending your project brief…");

  try {
    await window.emailjs.sendForm(
      emailJsConfig.serviceId,
      emailJsConfig.templateId,
      projectForm,
      { publicKey: emailJsConfig.publicKey },
    );
    projectForm.reset();
    setFormStatus(
      "Thank you. Your project brief has been sent to Kakuma Digital Agency.",
      "success",
    );
  } catch (error) {
    console.error("EmailJS form delivery failed:", error);
    setFormStatus(
      "We could not send your brief. Please try again or email kakuma.digital.agency@gmail.com.",
      "error",
    );
  } finally {
    if (submitButton) submitButton.disabled = false;
    if (submitLabel) submitLabel.textContent = "Send project brief";
  }
});
