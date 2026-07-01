import { useEffect, useRef } from "react";

/**
 * Fires onSearch after the user has typed at least `minChars` characters
 * and stopped typing for `delay` ms. Also fires with "" to clear when input
 * is emptied.
 *
 * @param value   - Current input value
 * @param onSearch - Callback with the debounced search term
 * @param minChars - Minimum characters before triggering (default: 2)
 * @param delay    - Debounce delay in ms (default: 300)
 */
export function useAutoSearch(
  value: string,
  onSearch: (query: string) => void,
  minChars = 2,
  delay = 300,
) {
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    // Always clear immediately
    if (value.length === 0) {
      onSearchRef.current("");
      return;
    }

    // Don't fire until minimum character threshold
    if (value.length < minChars) return;

    const id = setTimeout(() => {
      onSearchRef.current(value);
    }, delay);

    return () => clearTimeout(id);
  }, [value, minChars, delay]);
}
