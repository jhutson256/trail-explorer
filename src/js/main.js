// Configuration
const NPS_API_KEY = import.meta.env.VITE_NPS_API_KEY;
const NPS_THINGS_TO_DO_URL = "https://developer.nps.gov/api/v1/thingstodo";
const HIKING_ACTIVITY_ID = "B33C32DA-8600-4791-9951-9F3E61FA429E";

let currentTrailTitle = "";

function formatParkName(parkCode) {
  if (!parkCode) return "";
  return `${parkCode.toUpperCase()} National Park`;
}

/**
 * Check if a trail is in the local favorites list
 */
function isTrailFavorited(title) {
  const favorites = JSON.parse(localStorage.getItem('favoriteTrails')) || [];
  return favorites.some(fav => fav.title === title);
}

/**
 * Creates the HTML block for a single trail card.
 */
function buildTrailCardHTML(trail) {
  const title = trail.title || "Unknown Trail";
  const description = trail.shortDescription || trail.description || "No description available.";
  const imageUrl = trail.images?.[0]?.url || "";
  const parkCode = trail.relatedParks?.[0]?.parkCode || "";
  const parkName = formatParkName(parkCode);
  const location = trail.location || "NPS Managed Lands";
  const distanceInfo = trail.duration || "Check trail marker for length";

  const imageSection = imageUrl 
    ? `<img src="${imageUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />`
    : `<p style="color: var(--primary-color);">🌲 No Image Available</p>`;

  const activeClass = isTrailFavorited(title) ? 'is-active' : '';

  return `
    <div class="trail-detail-card">
      <div class="large-trail-image">
        ${imageSection}
      </div>
      <div class="trail-info-content">
        <h2>${title}</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 10px 0 15px 0; font-size: 0.85rem; color: #666; justify-content: center;">
          ${parkName ? `<span style="background: #eef2f3; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #A26652;">⛰️ ${parkName}</span>` : ''}
          <span style="background: #eef2f3; padding: 4px 8px; border-radius: 4px;">📍 ${location}</span>
          <span style="background: #eef2f3; padding: 4px 8px; border-radius: 4px;">📏 ${distanceInfo}</span>
        </div>
        <p>${description}</p>
        <div class="trail-actions">
          <button class="btn-plan" id="openModalBtn" data-trail-title="${title.replace(/"/g, '&quot;')}">Plan This Hike</button>
          <button class="favorite-star-btn ${activeClass}" data-trail-title="${title.replace(/"/g, '&quot;')}">★</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Loads a single random trail on page setup
 */
async function loadRandomTrail() {
  const container = document.querySelector('.explore-container');
  if (!container) return;

  try {
    if (!NPS_API_KEY) {
      throw new Error("API Key is missing. Check your .env configuration.");
    }
    
    const randomStartOffset = Math.floor(Math.random() * 4) * 50;
    const url = `${NPS_THINGS_TO_DO_URL}?actId=${HIKING_ACTIVITY_ID}&limit=50&start=${randomStartOffset}`;
    
    const response = await fetch(url, { headers: { "X-Api-Key": NPS_API_KEY } });
    if (!response.ok) throw new Error(`NPS API responded with status ${response.status}`);
    
    const payload = await response.json();
    const rawResults = payload?.data ?? [];

    const hikingTrails = rawResults.filter(item => 
      item.activities?.some(activity => activity.id === HIKING_ACTIVITY_ID || activity.name?.toLowerCase() === 'hiking')
    );

    const existingCards = container.querySelectorAll('.trail-detail-card, .search-status-msg');
    existingCards.forEach(el => el.remove());

    if (hikingTrails.length === 0) {
      container.insertAdjacentHTML('beforeend', `<p class="search-status-msg">No hiking trails found. Refresh to try again.</p>`);
      return;
    }

    const randomTrail = hikingTrails[Math.floor(Math.random() * hikingTrails.length)];
    currentTrailTitle = randomTrail.title || "Unknown Trail";

    container.insertAdjacentHTML('beforeend', buildTrailCardHTML(randomTrail));

  } catch (error) {
    console.error("Error loading trail data:", error);
  }
}

/**
 * Searches and returns up to 10 matching results sequentially.
 * Also keeps the input search field populated if requested externally.
 */
async function searchTrails(query, isPopState = false) {
  const container = document.querySelector('.explore-container');
  const searchInput = document.getElementById('searchInput');
  if (!container || !query.trim()) return;

  // Make sure search input displays the correct text (great for popstate/back button & shared links)
  if (searchInput) {
    searchInput.value = query;
  }

  // Update URL parameters (Skip if triggered by backward/forward navigation)
  if (!isPopState) {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('search', query);
    window.history.pushState({}, '', newUrl);
  }

  try {
    const existingCards = container.querySelectorAll('.trail-detail-card, .search-status-msg');
    existingCards.forEach(el => el.remove());
    container.insertAdjacentHTML('beforeend', `<h2 class="search-status-msg" style="color: var(--primary-color); font-family: 'Rubik Dirt', display;">Searching trails...</h2>`);

    const url = `${NPS_THINGS_TO_DO_URL}?actId=${HIKING_ACTIVITY_ID}&q=${encodeURIComponent(query)}&limit=50`;
    const response = await fetch(url, { headers: { "X-Api-Key": NPS_API_KEY } });
    if (!response.ok) throw new Error(`NPS API responded with status ${response.status}`);
    
    const payload = await response.json();
    const rawResults = payload?.data ?? [];

    const hikingTrails = rawResults.filter(item => 
      item.activities?.some(activity => activity.id === HIKING_ACTIVITY_ID || activity.name?.toLowerCase() === 'hiking')
    );

    container.querySelector('.search-status-msg')?.remove();

    if (hikingTrails.length === 0) {
      container.insertAdjacentHTML('beforeend', `
        <div class="search-status-msg" style="text-align: center;">
          <h2>No matching trails found.</h2>
          <p>Try a different keyword or park name (e.g., 'Yosemite', 'Zion', 'Canyon').</p>
        </div>
      `);
      return;
    }

    const resultsToRender = hikingTrails.slice(0, 10);
    
    resultsToRender.forEach(trail => {
      container.insertAdjacentHTML('beforeend', buildTrailCardHTML(trail));
    });

  } catch (error) {
    console.error("Error searching trails:", error);
  }
}

/**
 * Loads planned hikes from localStorage and syncs the dropdown UI
 */
function updatePlannedHikesDropdown() {
  const dropdown = document.getElementById('plannedDropdown');
  if (!dropdown) return;

  const savedHikes = JSON.parse(localStorage.getItem('plannedHikes')) || [];

  if (savedHikes.length === 0) {
    dropdown.innerHTML = '<li class="empty-msg">No hikes planned yet!</li>';
    return;
  }

  dropdown.innerHTML = [...savedHikes].reverse().map(item => `
    <li class="planned-item-row">
      <div class="planned-item-text">
        <span class="dropdown-trail">⛰️ ${item.hike}</span>
        <span class="dropdown-meta">👤 ${item.name} | 📅 ${item.date}</span>
      </div>
      <input type="checkbox" class="complete-checkbox" data-timestamp="${item.timestamp}" title="Mark as Completed" />
    </li>
  `).join('');
}

/**
 * Loads completed hikes from localStorage and syncs the dropdown UI
 */
function updateCompletedHikesDropdown() {
  const dropdown = document.getElementById('completedDropdown');
  if (!dropdown) return;

  const completedHikes = JSON.parse(localStorage.getItem('completedHikes')) || [];

  if (completedHikes.length === 0) {
    dropdown.innerHTML = '<li class="empty-msg">No completed hikes yet!</li>';
    return;
  }

  dropdown.innerHTML = [...completedHikes].reverse().map(item => `
    <li>
      <span class="dropdown-trail">🌲 ${item.hike}</span>
      <span class="dropdown-meta">👤 ${item.name}</span>
      <span class="dropdown-completed-badge">✓ Completed</span>
    </li>
  `).join('');
}

/**
 * Moves a planned hike to completed hikes based on its timestamp ID
 */
function completePlannedHike(timestamp) {
  let planned = JSON.parse(localStorage.getItem('plannedHikes')) || [];
  let completed = JSON.parse(localStorage.getItem('completedHikes')) || [];

  const itemIndex = planned.findIndex(hike => hike.timestamp === parseInt(timestamp, 10));
  
  if (itemIndex > -1) {
    const hikeToMove = planned.splice(itemIndex, 1)[0];
    completed.push(hikeToMove);

    localStorage.setItem('plannedHikes', JSON.stringify(planned));
    localStorage.setItem('completedHikes', JSON.stringify(completed));

    updatePlannedHikesDropdown();
    updateCompletedHikesDropdown();
  }
}

/**
 * Loads favorite trails from localStorage and syncs the dropdown UI
 */
function updateFavoritesDropdown() {
  const dropdown = document.getElementById('favoritesDropdown');
  if (!dropdown) return;

  const favorites = JSON.parse(localStorage.getItem('favoriteTrails')) || [];

  if (favorites.length === 0) {
    dropdown.innerHTML = '<li class="empty-msg">No favorites added yet!</li>';
    return;
  }

  dropdown.innerHTML = [...favorites].reverse().map(item => `
    <li>
      <span class="dropdown-trail">★ ${item.title}</span>
      <button class="dropdown-remove-fav" data-trail-title="${item.title.replace(/"/g, '&quot;')}">Remove</button>
    </li>
  `).join('');
}

/**
 * Handle favoriting a trail or removing it
 */
function toggleFavorite(title) {
  let favorites = JSON.parse(localStorage.getItem('favoriteTrails')) || [];
  const index = favorites.findIndex(fav => fav.title === title);

  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push({ title });
  }

  localStorage.setItem('favoriteTrails', JSON.stringify(favorites));
  
  updateFavoritesDropdown();
  
  const starButtons = document.querySelectorAll(`.favorite-star-btn[data-trail-title="${title.replace(/"/g, '\\"')}"]`);
  starButtons.forEach(btn => {
    if (index > -1) {
      btn.classList.remove('is-active');
    } else {
      btn.classList.add('is-active');
    }
  });
}

/**
 * Modal Controls, Form Submission & Storage Lifecycle
 */
function initModal() {
  const modal = document.getElementById('formModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const form = document.getElementById('hikePlanForm');
  const hikeInputField = document.getElementById('hike');

  if (!modal || !closeBtn) return;

  document.addEventListener('click', (e) => {
    if (e.target.matches('.trail-info-content #openModalBtn')) {
      modal.classList.add('active');
      const selectedTrailTitle = e.target.getAttribute('data-trail-title');
      if (hikeInputField && selectedTrailTitle) {
        hikeInputField.value = selectedTrailTitle;
      }
    }

    if (e.target.matches('.favorite-star-btn')) {
      const title = e.target.getAttribute('data-trail-title');
      if (title) {
        toggleFavorite(title);
      }
    }

    if (e.target.matches('.dropdown-remove-fav')) {
      const title = e.target.getAttribute('data-trail-title');
      if (title) {
        toggleFavorite(title);
      }
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.matches('.complete-checkbox')) {
      const timestamp = e.target.getAttribute('data-timestamp');
      if (timestamp) {
        setTimeout(() => {
          completePlannedHike(timestamp);
        }, 300);
      }
    }
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const newPlan = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        hike: document.getElementById('hike').value.trim(),
        date: document.getElementById('date').value.trim(),
        timestamp: Date.now()
      };

      const currentHikes = JSON.parse(localStorage.getItem('plannedHikes')) || [];
      currentHikes.push(newPlan);
      localStorage.setItem('plannedHikes', JSON.stringify(currentHikes));

      updatePlannedHikesDropdown();

      alert(`Awesome, ${newPlan.name}! Your hike to ${newPlan.hike} is locked in.`);
      form.reset();
      modal.classList.remove('active');
    });
  }

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

/**
 * NEW: Checks the URL search query parameters when page loads 
 * or when back/forward navigation is clicked.
 */
function handleRouting() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');

  if (searchQuery) {
    searchTrails(searchQuery, true); // Executes the search with popstate set to true
  } else {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = ""; // Empty out search input if landing back at root
    loadRandomTrail();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initSearch();
  handleRouting(); // Replaced direct loadRandomTrail() to handle query routing on startup

  // Listen to browser history navigation (back and forward button interactions)
  window.addEventListener('popstate', handleRouting);
});