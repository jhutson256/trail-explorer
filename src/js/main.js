import { fetchTrailsFromAPI } from './api.js';
import { toggleFavoriteInStorage, completePlannedHikeInStorage, savePlannedHike } from './storage.js';
import { 
  showToast, 
  buildTrailCardHTML, 
  updatePlannedHikesDropdown, 
  updateCompletedHikesDropdown, 
  updateFavoritesDropdown,
  clearExploreContainer
} from './render.js';

let lastActiveElement = null;

async function loadRandomTrail() {
  const container = document.getElementById('exploreContainer');
  if (!container) return;
  try {
    container.setAttribute('aria-busy', 'true');
    clearExploreContainer();
    const hikingTrails = await fetchTrailsFromAPI();
    if (hikingTrails.length === 0) {
      container.insertAdjacentHTML('beforeend', `<p class="search-status-msg">No hiking trails found.</p>`);
      return;
    }
    const randomTrail = hikingTrails[Math.floor(Math.random() * hikingTrails.length)];
    container.insertAdjacentHTML('beforeend', buildTrailCardHTML(randomTrail));
  } catch (error) {
    container.insertAdjacentHTML('beforeend', `
      <div class="inline-error-msg fade-in-up">
        <h3>🌲 Adventure Sync Interrupted</h3>
        <p>We're having trouble fetching trail data right now.</p>
      </div>
    `);
  } finally {
    container.setAttribute('aria-busy', 'false');
  }
}

async function searchTrails(query, isPopState = false) {
  const container = document.getElementById('exploreContainer');
  const searchInput = document.getElementById('searchInput');
  if (!container || !query.trim()) return;

  if (searchInput) searchInput.value = query;
  if (!isPopState) {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('search', query);
    window.history.pushState({}, '', newUrl);
  }

  try {
    container.setAttribute('aria-busy', 'true');
    clearExploreContainer();
    container.insertAdjacentHTML('beforeend', `<h2 class="search-status-msg fade-in-up" style="color: var(--primary-color); font-family: 'Rubik Dirt';">Searching trails...</h2>`);
    
    const hikingTrails = await fetchTrailsFromAPI(query);
    container.querySelector('.search-status-msg')?.remove();

    if (hikingTrails.length === 0) {
      container.insertAdjacentHTML('beforeend', `<p class="search-status-msg">No matching trails found.</p>`);
      return;
    }
    hikingTrails.slice(0, 10).forEach(trail => container.insertAdjacentHTML('beforeend', buildTrailCardHTML(trail)));
  } catch (error) {
    container.querySelector('.search-status-msg')?.remove();
    container.insertAdjacentHTML('beforeend', `<div class="inline-error-msg"><p>Could not execute search. Try again.</p></div>`);
  } finally {
    container.setAttribute('aria-busy', 'false');
  }
}

function handleFavoriteToggle(title) {
  const result = toggleFavoriteInStorage(title);
  updateFavoritesDropdown();
  showToast(result === 'added' ? `Added "${title}" to favorites! ★` : `Removed "${title}" from favorites.`);
  
  document.querySelectorAll(`.favorite-star-btn[data-trail-title="${title.replace(/"/g, '&quot;')}"]`).forEach(btn => {
    btn.classList.toggle('is-active', result === 'added');
    btn.setAttribute('aria-label', result === 'added' ? `Remove ${title} from favorites` : `Add ${title} to favorites`);
  });
}

function handleHikeCompletion(timestamp) {
  const item = completePlannedHikeInStorage(timestamp);
  if (item) {
    updatePlannedHikesDropdown();
    updateCompletedHikesDropdown();
    showToast(`Completed "${item.hike}"! 🌲`);
  }
}

function initAccessibleNav() {
  const wrappers = document.querySelectorAll('.nav-dropdown-wrapper');
  wrappers.forEach(wrapper => {
    const trigger = wrapper.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;
    
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      
      document.querySelectorAll('.nav-dropdown-trigger').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        btn.parentElement.classList.remove('is-open');
      });

      if (!isExpanded) {
        trigger.setAttribute('aria-expanded', 'true');
        wrapper.classList.add('is-open');
      }
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown-trigger').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
      btn.parentElement.classList.remove('is-open');
    });
  });
}

/**
 * Custom Input Validation Engine
 */
function validateField(inputElement, errorElement, validationMessage) {
  if (!inputElement.validity.valid) {
    inputElement.classList.add('input-invalid');
    inputElement.setAttribute('aria-invalid', 'true');
    errorElement.textContent = validationMessage;
    return false;
  } else {
    inputElement.classList.remove('input-invalid');
    inputElement.setAttribute('aria-invalid', 'false');
    errorElement.textContent = "";
    return true;
  }
}

function initModal() {
  const modal = document.getElementById('formModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const form = document.getElementById('hikePlanForm');
  const hikeInput = document.getElementById('hike');
  const dateIn = document.getElementById('date'); // Target the date input

  if (!modal || !closeBtn || !form || !dateIn) return;

  // --- DYNAMIC MINIMUM DATE RESTRICTION ---
  // Get today's local date parameters formatted perfectly as YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const formattedToday = `${yyyy}-${mm}-${dd}`;
  
  // Set the native minimum date restriction constraint directly on the DOM input element
  dateIn.setAttribute('min', formattedToday);

  // Focus trap configurations...
  const focusableElements = modal.querySelectorAll('button, input');
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.matches('.open-modal-btn')) {
      lastActiveElement = document.activeElement;
      
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      document.body.classList.add('modal-open');
      
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      const title = e.target.getAttribute('data-trail-title');
      if (hikeInput && title) hikeInput.value = title;
      setTimeout(() => closeBtn.focus(), 50);
    }

    if (e.target.matches('.favorite-star-btn') || e.target.matches('.dropdown-remove-fav')) {
      const title = e.target.getAttribute('data-trail-title');
      if (title) handleFavoriteToggle(title);
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.matches('.complete-checkbox')) {
      const ts = e.target.getAttribute('data-timestamp');
      if (ts) setTimeout(() => handleHikeCompletion(ts), 300);
    }
  });

  const closeModalActions = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('--scrollbar-width');
    
    if (lastActiveElement) lastActiveElement.focus();
    
    form.querySelectorAll('input').forEach(i => i.classList.remove('input-invalid'));
    form.querySelectorAll('.inline-error').forEach(e => e.textContent = "");
  };

  closeBtn.addEventListener('click', closeModalActions);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModalActions(); });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameIn = document.getElementById('name');
    const emailIn = document.getElementById('email');
    const nameErr = document.getElementById('nameError');
    const emailErr = document.getElementById('emailError');
    const dateErr = document.getElementById('dateError');

    // Execute core baseline validation checks
    const isNameValid = validateField(nameIn, nameErr, "Please provide your explorer name.");
    const isEmailValid = validateField(emailIn, emailErr, "Please provide a valid email address.");
    
    // Custom evaluation parameter confirming input date isn't set before our minimum attribute string
    let isDateValid = validateField(dateIn, dateErr, "Please select a valid date.");
    if (isDateValid && dateIn.value < formattedToday) {
      dateIn.classList.add('input-invalid');
      dateIn.setAttribute('aria-invalid', 'true');
      dateErr.textContent = "Hike dates cannot be planned in the past.";
      isDateValid = false;
    }

    if (!isNameValid || !isEmailValid || !isDateValid) return;

    try {
      const newPlan = {
        name: nameIn.value.trim(),
        email: emailIn.value.trim(),
        hike: hikeInput.value.trim(),
        date: dateIn.value.trim(),
        timestamp: Date.now()
      };

      savePlannedHike(newPlan);
      updatePlannedHikesDropdown();
      showToast(`Hike to ${newPlan.hike} successfully saved! ⛰️`);
      form.reset();
      closeModalActions();
    } catch (err) {
      showToast("Could not save your plan. Try again.", true);
    }
  });

  updatePlannedHikesDropdown();
  updateCompletedHikesDropdown();
  updateFavoritesDropdown();
}

function initSearch() {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  if (!searchForm || !searchInput) return;

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchTrails(searchInput.value);
  });
}

function handleRouting() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  if (searchQuery) {
    searchTrails(searchQuery, true);
  } else {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = "";
    loadRandomTrail();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAccessibleNav();
  initModal();
  initSearch();
  handleRouting();
  window.addEventListener('popstate', handleRouting);
});