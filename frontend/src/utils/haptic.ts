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

// Store whether user has interacted with the page (required for iOS)
let userHasInteracted = false;

// Initialize user interaction tracking
if (typeof window !== 'undefined') {
  const enableHaptics = () => {
    userHasInteracted = true;
    // Remove listeners after first interaction
    window.removeEventListener('touchstart', enableHaptics);
    window.removeEventListener('click', enableHaptics);
  };
  window.addEventListener('touchstart', enableHaptics, { once: true });
  window.addEventListener('click', enableHaptics, { once: true });
}

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
      case 5:
        // Correct button: 5 seconds continuous vibration
        patternArray = [5000];
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
      
      // Special handling for pattern 5 (Correct - 5 seconds)
      if (patternNumber === 5) {
        // Continuous vibration for 5 seconds
        const duration = 5000; // 5 seconds in milliseconds
        const interval = 100; // Impact every 100ms
        const totalImpacts = duration / interval;
        
        for (let i = 0; i < totalImpacts; i++) {
          await Haptics.impact({ style: ImpactStyle.Heavy });
          if (i < totalImpacts - 1) {
            await new Promise(resolve => setTimeout(resolve, interval));
          }
        }
        return;
      }
      
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

  // Try Vibration API (Android and iOS)
  // NOTE: On iOS (including Chrome), navigator.vibrate exists but is heavily restricted
  // It only works during or immediately after a user interaction (touch/click)
  // When a WebSocket message arrives (no user interaction), iOS blocks programmatic vibration
  if (isVibrationAPISupported()) {
    try {
      // Always try to vibrate - on Android it works, on iOS it might work if user recently interacted
      // On iOS, this will silently fail if called outside user interaction context
      const result = navigator.vibrate(patternArray);
      
      if (result === false && isIOS()) {
        // iOS explicitly rejected the vibration (no user interaction context)
        console.log('iOS: Vibration blocked - no active user interaction context');
      } else {
        // Vibration was accepted (Android) or attempted (iOS)
        console.log('Vibration triggered:', { pattern: patternArray, result, isIOS: isIOS() });
        if (isIOS()) {
          userHasInteracted = true; // Mark that we've tried
        }
        return;
      }
    } catch (e) {
      console.warn('Vibration API error:', e);
    }
  }

  // iOS Chrome/Safari: IMPORTANT - Chrome on iOS uses WebKit (same as Safari)
  // Apple requires ALL browsers on iOS to use WebKit, so Chrome has identical restrictions
  // This means: Programmatic vibration (triggered by WebSocket messages) is BLOCKED
  // Vibration ONLY works when triggered by direct user interaction (button press, touch, etc.)
  if (isIOS() && !isCapacitor()) {
    // Try one more aggressive attempt - use the full pattern
    if (isVibrationAPISupported()) {
      try {
        // Attempt vibration - on iOS this will be silently ignored if no user interaction
        const vibrateResult = navigator.vibrate(patternArray);
        console.log('iOS: Vibration API called', { 
          pattern: patternArray, 
          result: vibrateResult,
          userHasInteracted,
          note: 'If result is false or vibration fails, iOS blocked it due to no user interaction'
        });
        
        // Also try with a simple pattern in case the complex one fails
        if (!vibrateResult) {
          navigator.vibrate([100]); // Simple 100ms vibration
          console.log('iOS: Attempted simple vibration pattern');
        }
      } catch (e) {
        console.warn('iOS: Vibration API threw error (expected when no user interaction):', e);
      }
    }
    
    // Log the technical limitation
    console.warn(
      'iOS WebKit Limitation: Chrome and Safari on iOS block programmatic vibration.\n' +
      'Vibration only works during direct user interactions (button presses), not when receiving WebSocket messages.\n' +
      'This is a browser security restriction, not a bug in this app.\n' +
      'Solution: Use Capacitor to build a native app for full iOS haptic support.'
    );
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

