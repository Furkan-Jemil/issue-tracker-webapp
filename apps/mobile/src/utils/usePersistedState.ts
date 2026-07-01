import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function usePersistedState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then((val) => {
      if (val !== null) {
        setState(JSON.parse(val));
      }
      loadedRef.current = true;
      setLoaded(true);
    });
  }, [key]);

  const setPersisted = useCallback((v: React.SetStateAction<T>) => {
    setState((prev) => {
      const next = typeof v === 'function' ? (v as (prev: T) => T)(prev) : v;
      AsyncStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return [state, setPersisted, loaded];
}
