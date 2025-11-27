// fill welcome name from sidebar
const sidebarNameEl = document.getElementById("sidebarName");
const welcomeName =
  (sidebarNameEl && sidebarNameEl.textContent.trim()) || "User";
document.getElementById("welcomeName").textContent = welcomeName;

// function to activate nav link
const clickNav = (path) => {
  const link = document.querySelector(
    '.nav-acc .nav-link[href="' + path + '"]'
  );
  if (link) {
    link.click();
  }
};

// buttons -> correct full paths
document
  .getElementById("goToProfileBtn")
  .addEventListener("click", () => clickNav("/account/profile"));

document
  .getElementById("goToOrdersBtn")
  .addEventListener("click", () => clickNav("/account/orders"));
