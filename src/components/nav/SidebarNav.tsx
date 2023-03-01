import {
  Box,
  BoxProps,
  Center,
  CloseButton,
  Drawer,
  DrawerContent,
  Flex,
  FlexProps,
  HStack,
  Icon,
  IconButton,
  Link,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useMemo } from "react";
import { IconType } from "react-icons";
import { FiMenu } from "react-icons/fi";
import {
  MdInfoOutline,
  MdOutlineDescription,
  MdOutlineDynamicFeed,
} from "react-icons/md";
import { SiDiscord } from "react-icons/si";
import { SocialIcon } from "react-social-icons";
import DesktopHeader from "./DesktopHeader";
import WalletInfo from "./WalletInfo";

interface LinkItemProps {
  name: string;
  icon: IconType;
  href: string;
  isExternal: boolean;
}
const LinkItems: Array<LinkItemProps> = [
  {
    name: "Dashboard",
    icon: MdOutlineDynamicFeed,
    href: "/",
    isExternal: false,
  },
  {
    name: "Documentation",
    icon: MdOutlineDescription,
    href: "https://cheq-finance.notion.site/What-is-Denota-Protocol-9c18517ed13b4644bc8c796d7427aa80",
    isExternal: true,
  },
  { name: "About", icon: MdInfoOutline, href: "#", isExternal: false },
];

interface SocialItemsProps {
  icon: IconType;
  href: string;
}

const socialItems: Array<SocialItemsProps> = [];

export default function SidebarNav({ children }: { children: ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh">
      <SidebarContent
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="xs"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav display={{ base: "flex", md: "none" }} onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} display={{ base: "none", md: "block" }}>
        {/* Show DesktopHeader component only in desktop/larger screen size */}
        <DesktopHeader />
      </Box>
      <Box ml={{ base: 0, md: 60 }}>{children}</Box>
    </Box>
  );
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  return (
    <Box
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <VStack h="full" justifyContent="space-between">
        <Box>
          <Flex
            pb={3}
            pt={6}
            alignItems="center"
            mx={{ base: 8, md: 0 }}
            justifyContent={{ base: "space-between", md: "center" }}
          >
            <Text
              noOfLines={1}
              fontSize="2xl"
              fontFamily="DM Sans"
              fontWeight="bold"
            >
              Denota Protocol
            </Text>
            <CloseButton
              display={{ base: "flex", md: "none" }}
              onClick={onClose}
            />
          </Flex>
          <VStack gap={3} alignItems="flex-start">
            {LinkItems.map((link) => (
              <NavItem key={link.name} {...link}>
                <Text fontSize="lg">{link.name}</Text>
              </NavItem>
            ))}
          </VStack>
        </Box>
        <HStack maxW="full" pb={5}>
          <SocialIcon
            fgColor="white"
            bgColor="transparent"
            url="https://twitter.com/DenotaLabs"
            style={{ height: 40, width: 40 }}
          />
          <Link
            style={{ textDecoration: "none" }}
            href="https://discord.gg/DpXr3MsX"
            isExternal={true}
          >
            <Center h="40px" w="40px">
              <Icon
                fontSize="25"
                _groupHover={{
                  color: "white",
                }}
                as={SiDiscord}
              />
            </Center>
          </Link>
          <SocialIcon
            fgColor="white"
            bgColor="transparent"
            url="https://www.linkedin.com/company/denota-labs/"
            style={{ height: 40, width: 40 }}
          />
        </HStack>
      </VStack>
    </Box>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  href: string;
  isExternal: boolean;
  children?: ReactNode;
}
const NavItem = ({
  icon,
  children,
  href,
  isExternal,
  ...rest
}: NavItemProps) => {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/send");
  }, [router]);

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
            }
      }
      href={isExternal ? href : undefined}
      isExternal={isExternal}
      _selected={{ bg: "teal.600" }}
      w="100%"
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: isSelected ? undefined : "brand.400",
          color: "white",
        }}
        bgColor={isSelected ? "brand.400" : undefined}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: "white",
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 24 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent="space-between"
      {...rest}
    >
      <IconButton
        variant="outline"
        onClick={onOpen}
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text fontSize="2xl" fontFamily="DM Sans" fontWeight="bold">
        Denota Protocol
      </Text>
      <WalletInfo />
    </Flex>
  );
};
