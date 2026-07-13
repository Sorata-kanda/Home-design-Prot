// Wishlist utility — stores product objects in localStorage
const STORAGE_KEY = 'stratum_wishlist';

export function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveWishlist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // Dispatch a custom event so any listener can react
  window.dispatchEvent(new Event('wishlist-change'));
}

export function addToWishlist(product) {
  const list = getWishlist();
  if (!list.find(p => p._id === product._id)) {
    saveWishlist([...list, product]);
  }
}

export function removeFromWishlist(productId) {
  saveWishlist(getWishlist().filter(p => p._id !== productId));
}

export function toggleWishlist(product) {
  const list = getWishlist();
  const exists = list.find(p => p._id === product._id);
  if (exists) {
    removeFromWishlist(product._id);
    return false; // was removed
  } else {
    addToWishlist(product);
    return true; // was added
  }
}

export function isWishlisted(productId) {
  return getWishlist().some(p => p._id === productId);
}
