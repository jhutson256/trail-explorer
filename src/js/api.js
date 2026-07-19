// Configuration constants
const NPS_API_KEY = import.meta.env.VITE_NPS_API_KEY;
const NPS_THINGS_TO_DO_URL = "https://developer.nps.gov/api/v1/thingstodo";
const HIKING_ACTIVITY_ID = "B33C32DA-8600-4791-9951-9F3E61FA429E";

/**
 * Fetches trails from the NPS API based on a query parameter or a random offset start point.
 */
export async function fetchTrailsFromAPI(query = null) {
  if (!NPS_API_KEY) {
    throw new Error("API Key configuration error.");
  }

  let url = "";
  if (query) {
    url = `${NPS_THINGS_TO_DO_URL}?actId=${HIKING_ACTIVITY_ID}&q=${encodeURIComponent(query)}&limit=50`;
  } else {
    const randomStartOffset = Math.floor(Math.random() * 4) * 50;
    url = `${NPS_THINGS_TO_DO_URL}?actId=${HIKING_ACTIVITY_ID}&limit=50&start=${randomStartOffset}`;
  }

  const response = await fetch(url, { headers: { "X-Api-Key": NPS_API_KEY } });
  if (!response.ok) {
    throw new Error(`NPS API responded with status ${response.status}`);
  }
  
  const payload = await response.json();
  const rawResults = payload?.data ?? [];

  // Filter down strictly to hiking activities
  return rawResults.filter(item => 
    item.activities?.some(activity => activity.id === HIKING_ACTIVITY_ID || activity.name?.toLowerCase() === 'hiking')
  );
}