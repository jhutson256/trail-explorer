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
        <button class="btn-plan" id="openModalBtn" data-trail-title="${title.replace(/"/g, '&quot;')}">Plan This Hike</button>
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
 * Searches and returns up to 10 matching results sequentially
 */
async function searchTrails(query) {
  const container = document.querySelector('.explore-container');
  if (!container || !query.trim()) return;

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
 * Modal Controls & Event Delegation
 */
/**
/**
 * Loads planned hikes from localStorage and syncs the dropdown UI
 */
function updatePlannedHikesDropdown() {
  const dropdown = document.getElementById('plannedDropdown');
  if (!dropdown) return;

  // Retrieve existing plans or start clean
  const savedHikes = JSON.parse(localStorage.getItem('plannedHikes')) || [];

  if (savedHikes.length === 0) {
    dropdown.innerHTML = '<li class="empty-msg">No hikes planned yet!</li>';
    return;
  }

  // Build list rows backwards so newest entries show up at the top
  dropdown.innerHTML = [...savedHikes].reverse().map(item => `
    <li>
      <span class="dropdown-trail">⛰️ ${item.hike}</span>
      <span class="dropdown-meta">👤 ${item.name} | 📅 ${item.date}</span>
    </li>
  `).join('');
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

  // Intercept clicks on dynamic trail card buttons
  document.addEventListener('click', (e) => {
    if (e.target.matches('.trail-info-content #openModalBtn')) {
      modal.classList.add('active');
      const selectedTrailTitle = e.target.getAttribute('data-trail-title');
      if (hikeInputField && selectedTrailTitle) {
        hikeInputField.value = selectedTrailTitle;
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

      // Retrieve existing list, push new element, store it back
      const currentHikes = JSON.parse(localStorage.getItem('plannedHikes')) || [];
      currentHikes.push(newPlan);
      localStorage.setItem('plannedHikes', JSON.stringify(currentHikes));

      // Refresh layout components
      updatePlannedHikesDropdown();

      alert(`Awesome, ${newPlan.name}! Your hike to ${newPlan.hike} is locked in.`);
      form.reset();
      modal.classList.remove('active');
    });
  }

  // Run immediately on file execution to parse past saved history state 
  updatePlannedHikesDropdown();
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

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initSearch();
  loadRandomTrail();
});