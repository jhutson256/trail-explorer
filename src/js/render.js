import { getSafeStorage } from './storage.js';

function isTrailFavorited(title) {
  const favorites = getSafeStorage('favoriteTrails');
  return favorites.some(fav => fav.title === title);
}

export function showToast(message, isError = false) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-message ${isError ? 'error-toast' : ''}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/**
 * Component Template Helper - Creates optimized HTML structure cleanly.
 */
export function buildTrailCardHTML(trail) {
  const title = trail.title || "Unknown Trail";
  const description = trail.shortDescription || trail.description || "No description available.";
  const imageUrl = trail.images?.[0]?.url || "";
  const parkCode = trail.relatedParks?.[0]?.parkCode || "";
  const location = trail.location || "NPS Managed Lands";
  const distanceInfo = trail.duration || "Check trail marker for length";

  // Fixed: Appended performance optimizations to dynamically loaded trail images
  const imageSection = imageUrl 
    ? `<img src="${imageUrl}" alt="Photograph of ${title}" loading="lazy" decoding="async" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />`
    : `<p style="color: var(--primary-color);">🌲 No Image Available</p>`;

  const isFav = isTrailFavorited(title);
  const activeClass = isFav ? 'is-active' : '';
  const ariaLabel = isFav ? `Remove ${title} from favorites` : `Add ${title} to favorites`;

  return `
    <div class="trail-detail-card fade-in-up">
      <div class="large-trail-image">${imageSection}</div>
      <div class="trail-info-content">
        <h2>${title}</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 10px 0 15px 0; font-size: 0.85rem; color: #666; justify-content: center;">
          ${parkCode ? `<span style="background: #eef2f3; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #A26652;">⛰️ ${parkCode.toUpperCase()} Park</span>` : ''}
          <span style="background: #eef2f3; padding: 4px 8px; border-radius: 4px;">📍 ${location}</span>
          <span style="background: #eef2f3; padding: 4px 8px; border-radius: 4px;">📏 ${distanceInfo}</span>
        </div>
        <p>${description}</p>
        <div class="trail-actions">
          <button class="btn-plan open-modal-btn" data-trail-title="${title.replace(/"/g, '&quot;')}">Plan This Hike <span class="sr-only">for ${title}</span></button>
          <button class="favorite-star-btn ${activeClass}" data-trail-title="${title.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" aria-label="${ariaLabel}">★</button>
        </div>
      </div>
    </div>
  `;
}

export function updatePlannedHikesDropdown() {
  const dropdown = document.getElementById('plannedDropdown');
  if (!dropdown) return;

  const savedHikes = getSafeStorage('plannedHikes');
  if (savedHikes.length === 0) {
    dropdown.innerHTML = '<li class="empty-msg">No hikes planned yet!</li>';
    return;
  }

  dropdown.innerHTML = [...savedHikes].reverse().map(item => `
    <li class="planned-item-row">
      <div class="planned-item-text">
        <span class="dropdown-trail">⛰️ ${item.hike || 'Unknown Trail'}</span>
        <span class="dropdown-meta">👤 ${item.name || 'Explorer'} | 📅 ${item.date || 'TBD'}</span>
      </div>
      <input type="checkbox" class="complete-checkbox" data-timestamp="${item.timestamp}" aria-label="Mark ${item.hike || 'trail'} as completed" />
    </li>
  `).join('');
}

export function updateCompletedHikesDropdown() {
  const dropdown = document.getElementById('completedDropdown');
  if (!dropdown) return;

  const completedHikes = getSafeStorage('completedHikes');
  if (completedHikes.length === 0) {
    dropdown.innerHTML = '<li class="empty-msg">No completed hikes yet!</li>';
    return;
  }

  dropdown.innerHTML = [...completedHikes].reverse().map(item => `
    <li>
      <span class="dropdown-trail">🌲 ${item.hike || 'Unknown Trail'}</span>
      <span class="dropdown-meta">👤 ${item.name || 'Explorer'}</span>
      <span class="dropdown-completed-badge">✓ Completed</span>
    </li>
  `).join('');
}

export function updateFavoritesDropdown() {
  const dropdown = document.getElementById('favoritesDropdown');
  if (!dropdown) return;

  const favorites = getSafeStorage('favoriteTrails');
  if (favorites.length === 0) {
    dropdown.innerHTML = '<li class="empty-msg">No favorites added yet!</li>';
    return;
  }

  dropdown.innerHTML = [...favorites].reverse().map(item => `
    <li>
      <span class="dropdown-trail">★ ${item.title}</span>
      <button class="dropdown-remove-fav" data-trail-title="${item.title.replace(/"/g, '&quot;')}" aria-label="Remove ${item.title} from favorites">Remove</button>
    </li>
  `).join('');
}

export function clearExploreContainer() {
  const container = document.getElementById('exploreContainer');
  if (!container) return;
  container.querySelectorAll('.trail-detail-card, .search-status-msg, .inline-error-msg').forEach(el => el.remove());
}