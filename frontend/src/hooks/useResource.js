import { useEffect, useRef, useState } from 'react';

export function useResource(loader, deps) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, status: 'loading', error: null }));
    loaderRef.current()
      .then((data) => {
        if (active) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (active) setState({ status: 'error', data: null, error });
      });
    return () => {
      active = false;
    };
  }, [...deps, version]);

  return {
    ...state,
    reload: () => setVersion((value) => value + 1),
  };
}
