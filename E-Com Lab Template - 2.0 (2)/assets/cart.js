// Debounce function to delay execution
function debounce(func, wait) {
  let timeout;
  return function () {
    const later = () => {
      timeout = null;
      func.apply(this, arguments);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// CartRemoveButton class definition
class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

// CartItems class definition
class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }
// rending it

  initializeCartItems() {
    console.log("CartItems class initialized");
    this.updateTimer(); 
  
  }
// 


updateTimer() {
  let timer_numb = document.querySelector("#timer_duration").innerHTML;
  timer_numb = parseInt(timer_numb);
  // let timerInterval;
    console.log("Timer function initialized", typeof(timer_numb));
  // const TIMER_MINUTES = timer_numb.value; // Set the timer duration in minutes
let TIMER_MINUTES = timer_numb; // Default timer duration in minutes (global scope)
let timerInterval;
  function getRemainingTime() {
    const endTime = localStorage.getItem("cartTimerEndTime");
    if (!endTime) {
      // Timer is not initialized; return default time in seconds
      return TIMER_MINUTES * 60;
    }

    const timeLeft = Math.max(0, (endTime - new Date().getTime()) / 1000); // Calculate remaining time in seconds
    if (timeLeft <= 0) {
      clearTimer(); // Clear timer if time has expired
    }
    return timeLeft;
  }

  function startTimer(duration, display) {
    let timer = duration,
      minutes,
      seconds;

    clearInterval(timerInterval); // Clear any existing timer
    timerInterval = setInterval(function () {
      minutes = Math.floor(timer / 60);
      seconds = Math.floor(timer % 60);
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      display.textContent = minutes + ":" + seconds;

      // Stop timer when it reaches 0
      if (--timer < 0) {
        clearTimer();
        clearCart(); // Clear the cart when the timer ends
        display.textContent = "00:00";
      }
    }, 1000);
  }

  renderTimer();

function renderTimer() {
  const display = document.querySelector("#timer");
  console.log("Rendering timer...");

  // Check if the cart has items
  const cartIsEmpty = checkIfCartIsEmpty(); 

  if (cartIsEmpty) {
    clearTimer(); // Clear the timer and localStorage when the cart is empty
    localStorage.removeItem("cartTimerEndTime"); // Destroy the stored end time from localStorage
    return; // Stop further execution when the cart is empty
  }

  if (display) {
    let remainingTime = getRemainingTime(); // Get remaining time in seconds

    if (!localStorage.getItem("cartTimerEndTime")) {
      // Initialize the timer if not already set
      const newEndTime = new Date().getTime() + TIMER_MINUTES * 60 * 1000; // Set end time
      localStorage.setItem("cartTimerEndTime", newEndTime);
      remainingTime = TIMER_MINUTES * 60; // Start with full timer duration
    }

    startTimer(remainingTime, display); // Start or resume the timer
  }
}


function clearCart() {
  console.log("Clearing cart...");

  // Stop the timer
  clearTimer();

  // Clear cart on the frontend (if needed)
  const cartContainer = document.querySelector(".cart-container");
  
  // Clear cart from localStorage (specific key if applicable)
  localStorage.removeItem("countdownStartTime"); // Clear only the timer
  // Optionally: Remove other specific cart-related keys if they exist
  // localStorage.removeItem("cartItemsKey");

  // Send a request to clear the cart on the server
  fetch('/cart/clear.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to clear the cart');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Cart cleared:', data);
      localStorage.clear();
      window.location.reload(); // Refresh the page after clearing the cart
    })
    .catch((error) => {
      console.error('Error clearing cart:', error);
    });
}

// Function to stop the timer
function clearTimer() {
  
  
  // Remove timer data from localStorage
  localStorage.removeItem("cartTimerEndTime");
// Clear any running intervals
  clearInterval(timerInterval);
  localStorage.clear();
  // Update the timer display to 00:00
  const display = document.querySelector("#timer");
  if (display) {
    display.textContent = "00:00";
  }
}



  function checkIfCartIsEmpty() {
    // Check if cart is empty by looking for cart items
    const cartItems = document.querySelectorAll(".cart-item"); // Replace .cart-item with your cart item class
    return cartItems.length === 0; // Return true if no items are in the cart
  }

  function attachImmediateRender() {
    const cartDrawer = document.querySelector("cart-drawer");
    const atcButtons = document.querySelectorAll(".atc-button");

    if (atcButtons) {
      atcButtons.forEach((button) => {
        button.addEventListener("click", () => {
          renderTimer(); // Render the timer when an item is added to the cart
        });
      });
    }

    if (cartDrawer) {
      const observer = new MutationObserver(() => {
        renderTimer(); // Render the timer when the cart drawer updates
      });

      observer.observe(cartDrawer, {
        childList: true,
        subtree: true,
      });
    }
  }

  function monitorCartChanges() {
    const cartContainer = document.querySelector(".cart-container"); // Replace with your cart container class or ID
    if (cartContainer) {
      const observer = new MutationObserver(() => {
        const cartIsEmpty = checkIfCartIsEmpty();
        if (cartIsEmpty) {
          clearTimer(); // Clear the timer if the cart is empty
        } else {
          // renderTimer(); // Restart the timer if items are added back
        }
      });

      observer.observe(cartContainer, {
        childList: true,
        subtree: true,
      });
    }
  }

  // Initialize the timer when the page loads
  document.addEventListener("DOMContentLoaded", () => {
    // renderTimer(); // Render timer on page load
  });

  attachImmediateRender(); // Attach event listeners for cart and add-to-cart buttons
  monitorCartChanges(); // Monitor cart changes for empty state handling
}




  // 
  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === 'cart-items') {
        return;
      }
      this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = '';

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        document.activeElement.getAttribute('name'),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }

    // Update the timer after cart update
    this.updateTimer();
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section',
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents',
      },
    ];
  }

  updateQuantity(line, quantity, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement =
          document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll('.cart-item');

        if (parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute('value');
          this.updateLiveRegions(line, parsedState.errors);
          return;
        }

        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector('cart-drawer');
        const cartFooter = document.getElementById('main-cart-footer');

        if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
        if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(
            parsedState.sections[section.section],
            section.selector
          );
        });
        const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
        let message = '';
        if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
          if (typeof updatedValue === 'undefined') {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
          }
        }
        this.updateLiveRegions(line, message);

        const lineItem =
          document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
        } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
        }

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch(() => {
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError) lineItemError.querySelector('.cart-item__error-text').textContent = message;

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus =
      document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }





}

 

// Register CartItems custom element

document.addEventListener("DOMContentLoaded", () => {
  // Ensure custom element is defined only once
  if (!customElements.get('cart-items')) {
    customElements.define('cart-items', CartItems);
  }

  const cartItemsInstance = new CartItems();
  // Run the necessary methods on page load
  cartItemsInstance.initializeCartItems(); 
});


