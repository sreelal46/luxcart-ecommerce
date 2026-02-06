// Global functions for modal
function showLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (modal) {
    modal.classList.add("show");
    document.body.classList.add("modal-open");
  }
}

function closeLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (modal) {
    modal.classList.remove("show");
    document.body.classList.remove("modal-open");
  }
}

function confirmLogout() {
  window.location.href = "/logout";
}

// Initialize when DOM is ready
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSidebar);
  } else {
    initSidebar();
  }

  function initSidebar() {
    // Handle active links
    const links = document.querySelectorAll(".nav-acc .nav-link");
    const currentPath = location.pathname.replace(/\/$/, "");

    links.forEach((link) => {
      // Skip the logout link - it should never be active
      if (link.id === "logoutLink") {
        return;
      }

      const linkPath = new URL(
        link.href,
        window.location.origin,
      ).pathname.replace(/\/$/, "");

      if (currentPath === linkPath || currentPath.startsWith(linkPath + "/")) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Auto-scroll active link into view on mobile
    if (window.innerWidth < 992) {
      const activeLink = document.querySelector(".nav-acc .nav-link.active");
      if (activeLink) {
        setTimeout(() => {
          activeLink.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }, 100);
      }
    }

    // Intercept logout link click
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        showLogoutModal();
      });
    }

    // Close modal when clicking outside
    const modal = document.getElementById("logoutModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target.id === "logoutModal") {
          closeLogoutModal();
        }
      });
    }

    // Close modal on ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.getElementById("logoutModal");
        if (modal && modal.classList.contains("show")) {
          closeLogoutModal();
        }
      }
    });
  }
})();
