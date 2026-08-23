document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");

  if (!menu || !nav) return;

  menu.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");

    menu.setAttribute("aria-expanded", isOpen ? "true" : "false");

    menu.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open navigation menu");
    });
  });
});