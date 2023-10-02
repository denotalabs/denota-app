import { Box, Button, Heading, Input, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const token = await response.json();

    if (token) {
      localStorage.setItem("token", token);
      router.push("/");
    } else {
      // Handle login error
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bg="brand.500"
    >
      <Box
        p={8}
        maxWidth="500px"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
        bg="white"
      >
        <Box textAlign="center">
          <Heading color="brand.200">Login</Heading>
        </Box>
        <Box my={4} textAlign="left">
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
              colorScheme="success"
              variant="solid"
              onClick={handleSubmit}
              width="full"
            >
              Login
            </Button>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
