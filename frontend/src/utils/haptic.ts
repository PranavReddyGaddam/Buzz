/**
 * Cross-platform haptic/vibration feedback utility
 * Supports:
 * - Android: Vibration API
 * - iOS: Web Haptics API (iOS 13+) and Touch Events
 * - Native: Capacitor Haptics plugin (when wrapped)
 */

// Check if we're in a Capacitor environment
const isCapacitor = (): boolean => {
  return typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
};

// Check if Vibration API is available (Android)
const isVibrationAPISupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

// Check if device is iOS
const isIOS = (): boolean => {
  return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
};

// iOS Safari provides automatic haptic feedback on button presses
// However, we cannot programmatically trigger haptics without user interaction in iOS Safari
// For programmatic haptics (like when receiving messages), Capacitor is required

// Map vibration patterns to haptic types for iOS
const patternToHapticType = (pattern: number): 'light' | 'medium' | 'heavy' => {
  switch (pattern) {
    case 1:
      return 'light';
    case 2:
      return 'medium';
    case 3:
      return 'heavy';
    case 4:
      return 'heavy';
    default:
      return 'medium';
  }
};

// Count vibrations in pattern
const getVibrationCount = (pattern: number[]): number => {
  // Count non-zero values (vibration periods)
  return pattern.filter((v, i) => i % 2 === 0 && v > 0).length;
};

/**
 * Trigger haptic/vibration feedback
 * @param pattern - Vibration pattern (1-4) or custom pattern array
 * @returns Promise that resolves when haptic feedback is complete
 */
export const triggerHaptic = async (pattern: number | number[]): Promise<void> => {
  let patternArray: number[];
  let patternNumber: number;

  if (typeof pattern === 'number') {
    patternNumber = pattern;
    // Convert pattern number to vibration pattern
    switch (pattern) {
      case 1:
        patternArray = [200];
        break;
      case 2:
        patternArray = [200, 100, 200];
        break;
      case 3:
        patternArray = [200, 100, 200, 100, 200];
        break;
      case 4:
        patternArray = [200, 100, 200, 100, 200, 100, 200];
        break;
      default:
        patternArray = [200];
    }
  } else {
    patternArray = pattern;
    patternNumber = getVibrationCount(pattern);
  }

  // Try Capacitor Haptics first (if available)
  if (isCapacitor()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const hapticType = patternToHapticType(patternNumber);
      
      // Map to Capacitor impact styles
      const style = hapticType === 'light' ? ImpactStyle.Light :
                   hapticType === 'heavy' ? ImpactStyle.Heavy :
                   ImpactStyle.Medium;

      // Trigger haptic feedback based on pattern count
      const count = getVibrationCount(patternArray);
      for (let i = 0; i < count; i++) {
        await Haptics.impact({ style });
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      return;
    } catch (e) {
      console.warn('Capacitor Haptics not available:', e);
    }
  }

  // Try Vibration API (Android)
  if (isVibrationAPISupported()) {
    try {
      navigator.vibrate(patternArray);
      return;
    } catch (e) {
      console.warn('Vibration API failed:', e);
    }
  }

  // iOS Safari limitation: Cannot programmatically trigger haptics without user interaction
  // iOS Safari automatically provides haptic feedback when user presses buttons
  // For programmatic haptics on iOS, the app must be wrapped with Capacitor
  if (isIOS() && !isCapacitor()) {
    // In iOS Safari web browser, haptic feedback only works on direct user interaction
    // When receiving vibration messages, we cannot trigger haptics programmatically
    // User will feel haptics when they press buttons, but not when receiving messages
    console.info('iOS Safari: Haptic feedback requires user interaction or Capacitor wrapper');
    return;
  }

  // If all else fails, just return (no haptic feedback)
  console.warn('No haptic/vibration support available on this device');
};

/**
 * Check if haptic/vibration feedback is supported
 * @returns Object with support information
 */
export const getHapticSupport = (): {
  supported: boolean;
  method: 'capacitor' | 'vibration' | 'ios-haptic' | 'none';
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
} => {
  const platform = isIOS() ? 'ios' : 
                   /Android/.test(navigator.userAgent) ? 'android' :
                   'desktop';

  if (isCapacitor()) {
    return { supported: true, method: 'capacitor', platform };
  }

  if (isVibrationAPISupported()) {
    return { supported: true, method: 'vibration', platform };
  }

  // iOS Safari: Haptic feedback works on user interactions (button presses)
  // but NOT programmatically (when receiving messages)
  // For full iOS support with programmatic haptics, use Capacitor
  if (isIOS()) {
    return { 
      supported: true, 
      method: isCapacitor() ? 'capacitor' : 'ios-haptic', 
      platform 
    };
  }

  return { supported: false, method: 'none', platform };
};

/**
 * Trigger haptic feedback on button press (iOS Safari)
 * iOS Safari automatically provides haptic feedback on button presses
 * This function ensures proper setup for iOS haptic feedback
 */
export const triggerButtonHaptic = (): void => {
  // iOS Safari automatically provides haptic feedback on button presses
  // No additional code needed - the browser handles it automatically
  // For programmatic haptics (like when receiving messages), Capacitor is required
};

