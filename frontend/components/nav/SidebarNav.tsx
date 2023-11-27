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
  Link,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import { IconType } from "react-icons";
import {
  MdOutlineAdd,
  MdOutlineDescription,
  MdOutlineDynamicFeed,
  MdOutlinePerson,
} from "react-icons/md";
import { SocialIcon } from "react-social-icons";

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
    name: "New Transaction",
    icon: MdOutlineAdd,
    href: "/send",
    isExternal: false,
  },
  {
    name: "Profile",
    icon: MdOutlinePerson,
    href: "/profile",
    isExternal: false,
  },
  {
    name: "Docs",
    icon: MdOutlineDescription,
    href: "https://denota.gitbook.io/denota-sdk/",
    isExternal: true,
  },
];

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
      <Box ml={{ base: 0, md: 60 }} pt={10}>
        {children}
      </Box>
    </Box>
  );
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  const isDemoMode = false;
  const filteredLinkItems = isDemoMode
    ? LinkItems
    : LinkItems.filter((link) => !["Social", "Contacts"].includes(link.name));
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
            <Box mt={3} mb={3}>
              <Image
                src="/logos/denota-logo-text.svg"
                alt="denota logo text"
                width={100}
                height={20}
                unoptimized={true}
              />
              <Center>
                <Text>ALPHA</Text>
              </Center>
            </Box>
            <CloseButton
              display={{ base: "flex", md: "none" }}
              onClick={onClose}
            />
          </Flex>
          <VStack gap={3} alignItems="flex-start">
            {filteredLinkItems.map((link) => (
              <NavItem key={link.name} onClose={onClose} {...link}>
                <Text fontSize="lg">{link.name}</Text>
              </NavItem>
            ))}
          </VStack>
        </Box>
        <SocialIcons />
      </VStack>
    </Box>
  );
};

const SocialIcons = () => {
  return (
    <HStack maxW="full" pb={5}>
      <SocialIcon
        fgColor="white"
        bgColor="transparent"
        url="https://twitter.com/DenotaLabs"
        style={{ height: 40, width: 40 }}
        target="_blank"
      />
      <SocialIcon
        fgColor="white"
        bgColor="transparent"
        url="https://www.linkedin.com/company/denota-labs/"
        style={{ height: 40, width: 40 }}
        target="_blank"
      />
    </HStack>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  href: string;
  isExternal: boolean;
  children?: ReactNode;
  onClose: () => void;
}
const NavItem = ({
  icon,
  children,
  href,
  isExternal,
  onClose,
  ...rest
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
              onClose();
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
          bg: "brand.500",
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
