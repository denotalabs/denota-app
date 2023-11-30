import { useCallback, useMemo } from "react";

type APIMode = "local" | "prod";

const useDenotaAPI = () => {
  const url = useMemo(
    () => localStorage.getItem("api_url") ?? "https://api.denota.xyz/",
    []
  );

  const setAPIMode = useCallback((mode: APIMode) => {
    switch (mode) {
      case "prod":
        localStorage.setItem("api_url", "https://api.denota.xyz/");
        break;
      case "local":
        localStorage.setItem("api_url", "http://127.0.0.1:3001/");
    }
  }, []);

  return { url, setAPIMode };
};

export default useDenotaAPI;
