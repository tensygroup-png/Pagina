document.addEventListener("DOMContentLoaded", function () {
  // Function to update the timer
  function updateTimer() {
    const timerElement = document.querySelector("#cart-timer");

    if (!timerElement) return; // Exit if timer element doesn't exist

    let countdownStartTime = localStorage.getItem('countdownStartTime');
    if (!countdownStartTime) {
      countdownStartTime = new Date().getTime();
      localStorage.setItem('countdownStartTime', countdownStartTime);
    }

    const duration = 5 * 60; // Duration in seconds (5 minutes)
    const startTime = parseInt(countdownStartTime);
    const endTime = startTime + duration * 1000;
    const now = new Date().getTime();
    let remainingTime = (endTime - now) / 1000;

    if (remainingTime <= 0) {
      clearCart(); // Ensure the cart is cleared if the timer ends
      localStorage.removeItem('countdownStartTime');
      timerElement.style.display = 'none'; // Hide the timer
      return;
    }

    const countdownInterval = setInterval(() => {
      remainingTime = (endTime - new Date().getTime()) / 1000;
      const minutes = Math.floor(remainingTime / 60);
      const seconds = Math.floor(remainingTime % 60);
      timerElement.textContent = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
        clearCart();
        localStorage.removeItem('countdownStartTime');
        timerElement.style.display = 'none'; // Hide the timer after cart is cleared
      }
    }, 1000);

    timerElement.style.display = 'block'; // Ensure the timer is visible
  }

  // Function to clear the cart
  function clearCart() {
    fetch('/cart/clear.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(data => {
      console.log('Cart cleared', data);
      window.location.reload(); // Refresh the page after clearing the cart
    })
    .catch((error) => {
      console.error('Error clearing cart:', error);
    });
  }

  // Trigger the updateTimer function when the page is loaded
  updateTimer();
});