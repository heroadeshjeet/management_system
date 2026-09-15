/**
 * Haptic Feedback Engine
 * Utilizes the navigator.vibrate() Web API with graceful fallbacks.
 * Designed for mobile touch feedback and tactile interface interactions.
 */

export const haptics = {
  /**
   * Light tactile tap for standard button clicks, tab switches, and theme toggles
   * @param {number} duration - Vibration duration in milliseconds (default: 25ms)
   */
  tap: (duration = 25) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (err) {
        // Silently catch unsupported hardware or permissions policy blocks
      }
    }
  },

  /**
   * Distinct celebratory vibration pattern for major actions:
   * (e.g. creating a class, saving attendance, submitting examination marks, login success)
   */
  success: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        // [vibrate, pause, vibrate]
        navigator.vibrate([100, 50, 100]);
      } catch (err) {}
    }
  },

  /**
   * Subtle alert pulse pattern for behavioral warnings and notifications
   */
  warning: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch (err) {}
    }
  },

  /**
   * Distinct buzz pattern for validation errors or unauthorized attempts
   */
  error: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 75, 150]);
      } catch (err) {}
    }
  },
};

export default haptics;
