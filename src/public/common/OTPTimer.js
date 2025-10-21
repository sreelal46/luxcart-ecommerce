let time = 3 * 60; // 3 minutes in seconds
const timer = document.getElementById("timer");

const countdown = setInterval(() => {
  // Calculate minutes and seconds
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  // Display with leading zero for seconds
  timer.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  time--;

  // Stop countdown at 0
  if (time < 0) {
    clearInterval(countdown);
    timer.textContent = "Resend OTP";
  }
}, 1000);
