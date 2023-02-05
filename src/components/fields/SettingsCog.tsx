import {
  Button,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  useColorMode,
} from "@chakra-ui/react";

import { SettingsIcon } from "@chakra-ui/icons";

interface Props {
  setIsUser: any; // Fix any
  isUser: boolean;
}

export default function SettingsCog({ setIsUser, isUser }: Props) {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Menu>
      <MenuButton
        as={Button}
        rounded={"full"}
        variant={"link"}
        cursor={"pointer"}
        minW={0}
      >
        <SettingsIcon />
      </MenuButton>
      <MenuList alignItems={"center"}>
        <MenuItem closeOnSelect={false}>
          <FormControl
            display="flex"
            alignItems="space-between"
            justifyContent="space-between"
          >
            <FormLabel htmlFor="testnet-mode" mb="0">
              Testnet Mode
            </FormLabel>
            <Switch isChecked disabled={true} id="testnet-mode" />
          </FormControl>
        </MenuItem>
        <MenuItem closeOnSelect={false}>
          <FormControl
            display="flex"
            alignItems="space-between"
            justifyContent="space-between"
          >
            <FormLabel htmlFor="dark-mode" mb="0">
              Dark Mode
            </FormLabel>
            <Switch
              onChange={() => {
                toggleColorMode();
              }}
              isChecked={colorMode === "dark"}
              id="dark-mode"
            />
          </FormControl>
        </MenuItem>
        <MenuItem closeOnSelect={false}>
          <FormControl
            display="flex"
            alignItems="space-between"
            justifyContent="space-between"
          >
            <FormLabel htmlFor="auditor-mode" mb="0">
              Auditor Mode
            </FormLabel>
            <Switch
              onChange={() => {
                setIsUser(!isUser);
              }}
              isChecked={isUser === false}
              id="auditor-mode"
            />
          </FormControl>
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
