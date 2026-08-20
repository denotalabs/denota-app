import {
  Box,
  Collapse,
  Flex,
  HStack,
  IconButton,
  Link,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import { FiMenu } from "react-icons/fi";
import { SocialIcon } from "react-social-icons";
// import ChainSwitcher from "./ChainSwitcher";
import WalletInfo from "./WalletInfo";

interface LinkItemProps {
  name: string;
  href: string;
  isExternal: boolean;
}

const LinkItems: Array<LinkItemProps> = [
  { name: "Send", href: "/send", isExternal: false },
  { name: "Dashboard", href: "/dashboard", isExternal: false },
  // { name: "About", href: "/about", isExternal: false },
  // {
  //   name: "Docs",
  //   href: "https://denota.gitbook.io/denota-sdk/",
  //   isExternal: true,
  // },
];

export default function Navbar({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Box
        flexShrink={0}
        position="sticky"
        top={0}
        zIndex={10}
        bg={bg}
        borderBottom="1px"
        borderBottomColor={borderColor}
      >
        <Flex
          as="nav"
          minH={{ base: "52px", md: "64px" }}
          h={{ base: "52px", md: "64px" }}
          px={{ base: 3, md: 6 }}
          align="center"
          justify="space-between"
        >
          <IconButton
            display={{ base: "flex", md: "none" }}
            variant="outline"
            size="sm"
            onClick={isOpen ? onClose : onOpen}
            aria-label="open menu"
            icon={<FiMenu />}
            flexShrink={0}
            alignSelf="center"
          />

          <HStack
            spacing={{ base: 0, md: 8 }}
            align="center"
            flex={{ base: 1, md: "initial" }}
            justify={{ base: "center", md: "flex-start" }}
            mx={{ base: 2, md: 0 }}
          >
            <HStack
              as="button"
              type="button"
              spacing={2}
              align="center"
              cursor="pointer"
              bg="transparent"
              border="none"
              p={0}
              onClick={() => router.push("/")}
              aria-label="Denota home"
            >
              <Image
                src="/logos/DenotaGoata.svg"
                alt="denota goat"
                width={42}
                height={42}
                unoptimized={true}
              />
              <VStack
                spacing={0}
                align="flex-start"
                display={{ base: "none", sm: "flex" }}
              >
                <Image
                  src="/logos/denota-logo-text.svg"
                  alt="denota logo text"
                  width={80}
                  height={16}
                  unoptimized={true}
                />
                <Text fontSize="xs" lineHeight="shorter">
                  BETA
                </Text>
              </VStack>
            </HStack>

            <HStack spacing={1} display={{ base: "none", md: "flex" }}>
              {LinkItems.map((link) => (
                <NavItem key={link.name} onClose={onClose} {...link} />
              ))}
            </HStack>
          </HStack>

          <HStack spacing={{ base: 2, md: 4 }} flexShrink={0} align="center">
            <HStack display={{ base: "none", lg: "flex" }}>
              <SocialIcons />
            </HStack>
            {/* <ChainSwitcher /> */}
            <WalletInfo />
          </HStack>
        </Flex>

        <Collapse in={isOpen} animateOpacity>
          <Box
            display={{ base: "block", md: "none" }}
            px={4}
            py={4}
            borderTop="1px"
            borderTopColor={borderColor}
          >
            <MobileMenuContent onClose={onClose} />
          </Box>
        </Collapse>
      </Box>

      <Box flex="1" display="flex" flexDirection="column" w="100%">
        {children}
      </Box>
    </Box>
  );
}

const MobileMenuContent = ({ onClose }: { onClose: () => void }) => {
  return (
    <Box>
      <VStack align="stretch" spacing={2}>
        {LinkItems.map((link) => (
          <NavItem key={link.name} onClose={onClose} {...link} isMobile />
        ))}
      </VStack>
      <HStack mt={4} justify="center">
        <SocialIcons />
      </HStack>
    </Box>
  );
};

const SocialIcons = () => {
  return (
    <HStack>
      <SocialIcon
        fgColor="white"
        bgColor="transparent"
        url="https://twitter.com/almarazETH"
        style={{ height: 26, width: 26 }}
        target="_blank"
      />
      {/* <Link href="https://discord.gg/DpXr3MsX" isExternal={true}>
        <Center h="26px" w="26px">
          <Icon fontSize="15" as={SiDiscord} />
        </Center>
      </Link> */}
      <SocialIcon
        fgColor="white"
        bgColor="transparent"
        url="https://www.linkedin.com/in/alejandro-a-almaraz/"
        style={{ height: 26, width: 26 }}
        target="_blank"
      />
    </HStack>
  );
};

interface NavItemProps extends LinkItemProps {
  onClose?: () => void;
  isMobile?: boolean;
}

const NavItem = ({
  name,
  href,
  isExternal,
  onClose,
  isMobile,
}: NavItemProps) => {
  const router = useRouter();

  const isSelected = useMemo(() => {
    return router.pathname === href;
  }, [href, router.pathname]);

  return (
    <Link
      style={{ textDecoration: "none" }}
      onClick={
        isExternal
          ? undefined
          : () => {
            router.push(href, undefined, { shallow: true });
            onClose?.();
          }
      }
      href={isExternal ? href : undefined}
      isExternal={isExternal}
    >
      <Text
        px={isMobile ? 4 : 3}
        py={isMobile ? 2 : 1.5}
        borderRadius="md"
        fontSize={isMobile ? "lg" : "md"}
        fontWeight={isSelected ? "semibold" : "medium"}
        cursor="pointer"
        w={isMobile ? "full" : undefined}
        _hover={{
          bg: "brand.500",
          color: "white",
        }}
        bgColor={isSelected ? "brand.400" : undefined}
        color={isSelected ? "white" : undefined}
      >
        {name}
      </Text>
    </Link>
  );
};
