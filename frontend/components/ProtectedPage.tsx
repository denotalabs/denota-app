import {
  Box,
  Button,
  Heading,
  Input,
  useToast,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { ReactNode, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
}

export default function ProtectedPage({ children }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState<undefined | boolean>(undefined);

  const [buttonLoading, setButtonLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
    } else {
      // TODO: check token expiry
      setIsLoggedIn(true);
    }
  }, []);

  const handleSubmit = async () => {
    setButtonLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:3000/signin",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const token = await response.data;

      if (token) {
        localStorage.setItem("token", token);
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
  };

  if (isLoggedIn === undefined) {
    return <></>;
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
          <Box textAlign="center">
            <Heading color="brand.200">Denota</Heading>
          </Box>
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
