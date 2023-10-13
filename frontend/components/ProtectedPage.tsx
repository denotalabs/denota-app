import {
  Box,
  Button,
  Center,
  Input,
  Spinner,
  useToast,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import Image from "next/image";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
}

export default function ProtectedPage({ children }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState<undefined | boolean>(undefined);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const toast = useToast();
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
        setIsLoggedIn((prev) => false);
      } else {
        refreshAccessToken();
      }
    }
  }, [refreshAccessToken]);

  const handleSubmit = useCallback(async () => {
    setButtonLoading(true);

    try {
      const response = await axios.post(
        "https://denota.klymr.me/signin",
        { email, password },
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
        toast({
          title: "Login error",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Login error",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setButtonLoading(false);
  }, [email, password, setTokenData, toast]);

  if (isLoggedIn === undefined) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isLoggedIn === false) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <Box
          p={8}
          maxWidth="500px"
          borderWidth={1}
          borderRadius={8}
          boxShadow="lg"
          bg="brand.100"
        >
          <Center>
            <Image
              src="/logos/denota-logo-text.svg"
              alt="denota logo text"
              width={100}
              height={20}
              unoptimized={true}
            />
          </Center>
          <Box my={4} textAlign="left">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <VStack spacing={4}>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="lg"
                  focusBorderColor="notaPurple.100"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="lg"
                  focusBorderColor="notaPurple.100"
                />
                <Button
                  color="white"
                  type="submit"
                  width="full"
                  isLoading={buttonLoading}
                >
                  Login
                </Button>
              </VStack>
            </form>
          </Box>
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
}
