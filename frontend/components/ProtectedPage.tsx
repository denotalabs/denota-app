import { Center, Spinner } from "@chakra-ui/react";
import axios from "axios";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Stepper from "./designSystem/stepper/Stepper";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

interface Props {
  children: ReactNode;
}

export default function ProtectedPage({ children }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState<undefined | boolean>(undefined);
  const initialized = useRef(false);

  const setTokenData = useCallback((data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    const expiresAt = new Date().getTime() + data.expires_in * 1000;
    localStorage.setItem("expires_at", expiresAt.toString());
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const response = await axios.post(
        "https://denota.klymr.me/token/refresh",
        { refreshToken: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (data && data.access_token) {
        setTokenData(data);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoggedIn(false);
    }
  }, [setTokenData]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoggedIn(false);
      } else {
        refreshAccessToken();
      }
    }
  }, [refreshAccessToken]);

  if (isLoggedIn === undefined) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isLoggedIn === false) {
    return (
      <Stepper hideHeader={true}>
        <LoginPage
          setIsLoggedIn={setIsLoggedIn}
          setTokenData={setTokenData}
          screenKey="logIn"
          screenTitle=""
        />
        <RegisterPage
          setIsLoggedIn={setIsLoggedIn}
          setTokenData={setTokenData}
          screenKey="register"
          screenTitle=""
        />
      </Stepper>
    );
  }

  return <>{children}</>;
}
