// Search functionality
document
  .getElementById("walletSearchInput")
  .addEventListener("keyup", function () {
    const searchText = this.value.toLowerCase();
    const rows = document.querySelectorAll("#walletTableBody tr");
    rows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      row.style.display = rowText.includes(searchText) ? "" : "none";
    });
  });
