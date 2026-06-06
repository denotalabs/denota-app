import { CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { ReactNode } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconBg?: string;
  children: ReactNode;
  footer?: ReactNode;
}

function SlideOver({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconBg = "brand.400",
  children,
  footer,
}: Props) {
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay bg="blackAlpha.700" />
      <DrawerContent bg="brand.100" maxW="440px">
        <DrawerHeader borderBottomWidth="1px" borderColor="brand.400" py={6}>
          <Flex align="flex-start" justify="space-between">
            <Flex align="center" gap={3}>
              {icon && (
                <Box
                  bg={iconBg}
                  color="brand.200"
                  borderRadius="xl"
                  w={10}
                  h={10}
                  display="grid"
                  placeItems="center"
                >
                  {icon}
                </Box>
              )}
              <Box>
                <Heading size="md">{title}</Heading>
                {subtitle && (
                  <Text fontSize="sm" color="gray.400" mt={0.5}>
                    {subtitle}
                  </Text>
                )}
              </Box>
            </Flex>
            <IconButton
              aria-label="Close"
              icon={<CloseIcon />}
              variant="ghost"
              size="sm"
              onClick={onClose}
            />
          </Flex>
        </DrawerHeader>
        <DrawerBody py={5}>{children}</DrawerBody>
        {footer && (
          <DrawerFooter borderTopWidth="1px" borderColor="brand.400" py={5}>
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default SlideOver;
