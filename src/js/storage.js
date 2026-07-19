export function getSafeStorage(key) {
  try {
    const rawData = localStorage.getItem(key);
    if (!rawData) return [];
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Local Storage corruption detected at key "${key}". Resetting node data.`, error);
    localStorage.setItem(key, JSON.stringify([]));
    return [];
  }
}

export function toggleFavoriteInStorage(title) {
  let favorites = getSafeStorage('favoriteTrails');
  const index = favorites.findIndex(fav => fav.title === title);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push({ title });
  }
  localStorage.setItem('favoriteTrails', JSON.stringify(favorites));
  return index > -1 ? 'removed' : 'added';
}

export function completePlannedHikeInStorage(timestamp) {
  let planned = getSafeStorage('plannedHikes');
  let completed = getSafeStorage('completedHikes');
  const itemIndex = planned.findIndex(hike => hike.timestamp === parseInt(timestamp, 10));
  
  if (itemIndex > -1) {
    const hikeToMove = planned.splice(itemIndex, 1)[0];
    completed.push(hikeToMove);
    localStorage.setItem('plannedHikes', JSON.stringify(planned));
    localStorage.setItem('completedHikes', JSON.stringify(completed));
    return hikeToMove;
  }
  return null;
}

export function savePlannedHike(newPlan) {
  const currentHikes = getSafeStorage('plannedHikes');
  
  // Fixed: Privacy compliance safeguard. Remove clear-text emails from database record array
  const safeRecord = {
    name: newPlan.name,
    hike: newPlan.hike,
    date: newPlan.date,
    timestamp: newPlan.timestamp
  };
  
  currentHikes.push(safeRecord);
  localStorage.setItem('plannedHikes', JSON.stringify(currentHikes));
}