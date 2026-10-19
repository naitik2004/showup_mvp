// A shared counter keeps overlapping requests from dismissing one another.
let pending = 0;
const listeners = new Set<() => void>();
export const subscribeToRequests = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const getPendingRequests = () => pending;
function notify() { listeners.forEach((listener) => listener()); }

export const requestFetch: typeof fetch = async (input, init) => {
  if (typeof window === 'undefined') return fetch(input, init);
  pending += 1;
  notify();
  try {
    return await fetch(input, init);
  } finally {
    pending -= 1;
    notify();
  }
};
