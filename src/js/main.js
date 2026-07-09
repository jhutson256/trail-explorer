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
 * 1. API Fetching & DOM Rendering
 */
async function loadRandomTrail() {
  const trailCard = document.querySelector('.trail-detail-card');
  if (!trailCard) return;

  try {
    if (!NPS_API_KEY) {
      throw new Error("API Key is missing. Check your .env configuration.");
    }
    
    const randomStartOffset = Math.floor(Math.random() * 4) * 50;
    const url = `${NPS_THINGS_TO_DO_URL}?actId=${HIKING_ACTIVITY_ID}&limit=50&start=${randomStartOffset}`;
    
    const response = await fetch(url, {
      headers: { "X-Api-Key": NPS_API_KEY },
    });

    if (!response.ok) throw new Error(`NPS API responded with status ${response.status}`);
    
    const payload = await response.json();
    const rawResults = payload?.data ?? [];

    const hikingTrails = rawResults.filter(item => {
      return item.activities?.some(activity => 
        activity.id === HIKING_ACTIVITY_ID || 
        activity.name?.toLowerCase() === 'hiking'
      );
    });

    if (hikingTrails.length === 0) {
      trailCard.querySelector('h2').textContent = "No hiking trails found.";
      return;
    }

    const randomIndex = Math.floor(Math.random() * hikingTrails.length);
    const randomTrail = hikingTrails[randomIndex];

    currentTrailTitle = randomTrail.title || "Unknown Trail";

    const trailDescription = randomTrail.shortDescription || randomTrail.description || "No description available.";
    const trailImageUrl = randomTrail.images?.[0]?.url;
    const parkCode = randomTrail.relatedParks?.[0]?.parkCode || "";
    const parkName = formatParkName(parkCode);
    const location = randomTrail.location || "NPS Managed Lands";
    const distanceInfo = randomTrail.duration || "Check trail marker for length";

    const titleElement = trailCard.querySelector('.trail-info-content h2');
    const descElement = trailCard.querySelector('.trail-info-content p');
    const imageWrapper = trailCard.querySelector('.large-trail-image');
    
    let metaContainer = trailCard.querySelector('.trail-meta-badges');
    if (!metaContainer) {
      metaContainer = document.createElement('div');
      metaContainer.className = 'trail-meta-badges';
      titleElement.insertAdjacentElement('afterend', metaContainer);
    }

    titleElement.textContent = currentTrailTitle;
    descElement.textContent = trailDescription;

    metaContainer.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 10px 0 15px 0; font-size: 0.85rem; color: #666;">
        ${parkName ? `<span style="background: #eef2f3; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #A26652;">⛰️ ${parkName}</span>` : ''}
        <span style="background: #eef2f3; padding: 4px 8px; border-radius: 4px;">📍 ${location}</span>
        <span style="background: #eef2f3; padding: 4px 8px; border-radius: 4px;">📏 ${distanceInfo}</span>
      </div>
    `;

    if (trailImageUrl) {
      imageWrapper.innerHTML = `
        <img src="${trailImageUrl}" 
             alt="${currentTrailTitle}" 
             style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;"
        />`;
    }

  } catch (error) {
    console.error("Error loading trail data:", error);
    const descElement = trailCard.querySelector('.trail-info-content p');
    if (descElement) {
      descElement.textContent = "Oops! We had trouble loading trail information right now.";
    }
  }
}

/**
 * 2. Modal Controls & Form Submissions
 */
function initModal() {
  const modal = document.getElementById('formModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const form = document.getElementById('hikePlanForm');
  const hikeInputField = document.getElementById('hike');

  if (!modal || !closeBtn) return;

  // Hero Section Open Control
  const heroBtn = document.querySelector('.hero-section #openModalBtn');
  if (heroBtn) {
    heroBtn.addEventListener('click', () => {
      modal.classList.add('active');
      if (hikeInputField) {
        hikeInputField.value = "";
      }
    });
  }

  // Trail Card Open Control
  const cardBtn = document.querySelector('.trail-info-content #openModalBtn');
  if (cardBtn) {
    cardBtn.addEventListener('click', () => {
      modal.classList.add('active');
      if (hikeInputField && currentTrailTitle) {
        hikeInputField.value = currentTrailTitle;
      }
    });
  }

  // Closing Controls
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Form Submission
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        hike: hikeInputField ? hikeInputField.value : document.getElementById('hike').value,
        date: document.getElementById('date').value,
      };

      console.log("Hike planned successfully!", formData);
      alert(`Awesome, ${formData.name}! Your hike to ${formData.hike} is locked in.`);

      form.reset();
      modal.classList.remove('active');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  loadRandomTrail();
});