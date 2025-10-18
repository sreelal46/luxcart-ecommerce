// 🔍 Simple search filter
document.getElementById("searchInput").addEventListener("keyup", function () {
  const searchText = this.value.toLowerCase();
  const rows = document.querySelectorAll("#salesTableBody tr");
  rows.forEach((row) => {
    const rowText = row.innerText.toLowerCase();
    row.style.display = rowText.includes(searchText) ? "" : "none";
  });
});

// 🧾 Dummy download actions
document.getElementById("downloadPDF").addEventListener("click", () => {
  alert("Download PDF functionality to be implemented");
});

document.getElementById("downloadExcel").addEventListener("click", () => {
  alert("Download Excel functionality to be implemented");
});

// 🔧 Apply filter logic
document.getElementById("applyFilter").addEventListener("click", () => {
  alert("Filter applied (to be implemented)");
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("filterModal")
  );
  modal.hide();
});
