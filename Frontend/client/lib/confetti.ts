import confetti from 'canvas-confetti';

/**
 * Trigger celebration confetti effect
 * Used when saving a new memory successfully
 */
export function triggerConfetti() {
  // First burst - center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#06B6D4', '#A855F7', '#EC4899', '#3B82F6', '#22D3EE'],
  });

  // Second burst - left side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#06B6D4', '#A855F7', '#EC4899'],
    });
  }, 150);

  // Third burst - right side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#A855F7', '#EC4899', '#3B82F6'],
    });
  }, 300);
}

/**
 * Trigger success sparkles (smaller, for quick actions like favorite)
 */
export function triggerSparkles() {
  confetti({
    particleCount: 30,
    spread: 50,
    startVelocity: 20,
    gravity: 0.8,
    origin: { y: 0.5 },
    colors: ['#EC4899', '#F472B6', '#FBBF24'],
    shapes: ['circle'],
    scalar: 0.8,
  });
}
