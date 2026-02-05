document.querySelectorAll(".mark-read-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;

    try {
      const res = await axios.patch(`/admin/notifications/read/${id}`);

      if (res.data.success) {
        const item = btn.closest(".notification-item");

        item.classList.remove("unread");
        item.classList.add("read");

        btn.remove();

        // optional reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        showNotificationError(
          res.data.alert || "Unable to mark notification as read",
        );
      }
    } catch (error) {
      showNotificationError(
        error.response?.data?.alert || "Unable to mark notification as read",
      );
    }
  });
});
function showNotificationError(message) {
  document.getElementById("notificationErrorText").textContent = message;

  const modal = new bootstrap.Modal(
    document.getElementById("notificationErrorModal"),
  );
  modal.show();
}
