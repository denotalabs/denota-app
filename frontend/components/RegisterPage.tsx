import {
  Box,
  Button,
  Center,
  Input,
  Link,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import Image from "next/image";
import { SetStateAction, useCallback, useState } from "react";
import useDenotaAPI from "../hooks/useDenotaAPI";
import { ScreenProps, useStep } from "./designSystem/stepper/Stepper";

interface Props extends ScreenProps {
  setTokenData: (data: any) => void;
  setIsLoggedIn: (value: SetStateAction<boolean>) => void;
}

export default function RegisterPage({ setTokenData, setIsLoggedIn }: Props) {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setCode] = useState("");
  const [onrampName, setName] = useState("");
  const toast = useToast();
  const { back } = useStep();
  const { apiEndpoint } = useDenotaAPI();

  const handleSubmit = useCallback(async () => {
    setButtonLoading(true);

    try {
      const response = await axios.post(
        `${apiEndpoint}/register`,
        { email, password, inviteCode, onrampName },
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
  }, [
    email,
    inviteCode,
    onrampName,
    password,
    setIsLoggedIn,
    setTokenData,
    toast,
  ]);
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
              <Input
                type="name"
                placeholder="Onramp Name"
                value={onrampName}
                onChange={(e) => setName(e.target.value)}
                size="lg"
                focusBorderColor="notaPurple.100"
              />
              <Input
                type="code"
                placeholder="Invite Code"
                value={inviteCode}
                onChange={(e) => setCode(e.target.value)}
                size="lg"
                focusBorderColor="notaPurple.100"
              />
              <Button
                color="white"
                type="submit"
                width="full"
                isLoading={buttonLoading}
              >
                Register
              </Button>
            </VStack>
          </form>
        </Box>
      </Box>
      <Text py={2.5}>
        Already have an account?{" "}
        <Link color="teal.500" onClick={back}>
          Sign in
        </Link>
      </Text>
    </Box>
  );
}
