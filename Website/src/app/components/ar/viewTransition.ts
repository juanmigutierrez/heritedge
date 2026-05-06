// Stable view-transition-name string for a given landmark.
// Both panorama and detail attach this name to the elements that should
// morph during navigation; the browser's View Transitions API matches the
// names across the snapshot pair to animate the shared element.
export const landmarkVT = (id: string) => `landmark-${id}`;
