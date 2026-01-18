import { useMemo } from 'react';
import { IMAGE_TRANSFORMS } from '../config/imageTransforms';

/**
 * useImageTransform Hook
 * 
 * Returns CSS class name(s) for custom image transformations.
 * Looks up the member identifier in the IMAGE_TRANSFORMS config.
 * 
 * @param {string} memberId - Member name or unique identifier
 * @returns {string} CSS class name(s) to apply, or empty string
 * 
 * Example:
 * const className = useImageTransform('Rodrigo Ramos');
 * // Returns: 'img-zoom-out' if configured, otherwise ''
 */
export function useImageTransform(memberId) {
  return useMemo(() => {
    if (!memberId || !IMAGE_TRANSFORMS[memberId]) {
      return '';
    }
    
    const transform = IMAGE_TRANSFORMS[memberId];
    
    // If it's an array of classes, join them
    if (Array.isArray(transform)) {
      return transform.join(' ');
    }
    
    // If it's a string class name, return it
    if (typeof transform === 'string') {
      return transform;
    }
    
    // If it's an object with 'className', use that
    if (transform.className) {
      return transform.className;
    }
    
    return '';
  }, [memberId]);
}
