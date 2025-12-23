document.addEventListener('DOMContentLoaded', function () {
  const cartCountBubble = document.querySelector('.cart-count-bubble span[aria-hidden="true"]');
  const countdownTimer = document.getElementById('countdown-timer');
  const display = document.querySelector('#countdown-time');
  const countdownMinutes = 5; // Set countdown duration (5 minutes)

  if (!cartCountBubble) {
    console.warn('Cart count bubble not found. Ensure the selector matches your HTML structure.');
    return;
  }

  if (!countdownTimer) {
    console.warn('Countdown timer element not found. Ensure it exists in your HTML.');
    return;
  }

  function startCountdown(duration, display) {
    let startTime = localStorage.getItem('countdownStartTime');
    const now = new Date().getTime();

    if (!startTime) {
      startTime = now;
      localStorage.setItem('countdownStartTime', startTime);
    }

    const endTime = parseInt(startTime) + duration * 1000;

    function updateCountdown() {
      const remainingTime = (endTime - new Date().getTime()) / 1000;
      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
        countdownTimer.style.display = 'none';
        clearCart(); // Clear cart when timer ends
        localStorage.removeItem('countdownStartTime');
        return;
      }

      const minutes = String(Math.floor(remainingTime / 60)).padStart(2, '0');
      const seconds = String(Math.floor(remainingTime % 60)).padStart(2, '0');
      display.textContent = `${minutes}:${seconds}`;
    }

    updateCountdown(); // Initial update
    const countdownInterval = setInterval(updateCountdown, 1000);
  }

  function clearCart() {
    fetch('/cart/clear.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then(() => {
        console.log('Cart cleared');
        window.location.reload(); // Refresh page after clearing cart
      })
      .catch((error) => console.error('Error clearing cart:', error));
  }

  function handleCartChange() {
    if (!countdownTimer) {
      console.warn('Countdown timer element not found. Ensure it exists in your HTML.');
      return;
    }

    const cartCount = parseInt(cartCountBubble.innerHTML, 10) || 0;

    if (cartCount > 0) {
      countdownTimer.style.display = 'block';
      startCountdown(countdownMinutes * 60, display);
    } else {
      countdownTimer.style.display = 'none';
      localStorage.removeItem('countdownStartTime'); // Clear timer if cart is empty
    }
  }

  // Observe cart count changes
  const observer = new MutationObserver(handleCartChange);
  observer.observe(cartCountBubble, { childList: true, subtree: true });

  // Initial check on page load
  handleCartChange();
});
