import { useCallback, useMemo, useReducer } from "react";

type APIMode = "local" | "prod";

const useDenotaAPI = () => {
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);

  const apiEndpoint = useMemo(
    () =>
      typeof window !== "undefined" && localStorage.getItem("api_url")
        ? localStorage.getItem("api_url")
        : "https://api.denota.xyz/",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [update]
  );

  const setAPIMode = useCallback((mode: APIMode) => {
    switch (mode) {
      case "prod":
        localStorage.setItem("api_url", "https://api.denota.xyz/");
        break;
      case "local":
        localStorage.setItem("api_url", "http://127.0.0.1:3001/");
    }
    // Force apiEndpoint to refresh
    forceUpdate();
  }, []);

  const apiMode: APIMode = useMemo(() => {
    switch (apiEndpoint) {
      case "https://api.denota.xyz/":
        return "prod";
      case "http://127.0.0.1:3001/":
        return "local";
    }
  }, [apiEndpoint]);

  return { apiEndpoint, setAPIMode, apiMode };
};

export default useDenotaAPI;
