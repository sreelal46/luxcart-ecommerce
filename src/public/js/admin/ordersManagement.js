document
  .getElementById("searchOrderInput")
  .addEventListener("keyup", function () {
    const searchText = this.value.toLowerCase();
    const rows = document.querySelectorAll("#ordersTableBody tr");
    rows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      row.style.display = rowText.includes(searchText) ? "" : "none";
    });
  });
