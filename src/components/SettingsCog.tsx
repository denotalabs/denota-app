import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode,
  FormControl,
  Switch,
  FormLabel,
} from "@chakra-ui/react";

import { SettingsIcon } from "@chakra-ui/icons";

export default function SettingsCog() {
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
                console.log("Activate auditor mode");
              }}
              isChecked={colorMode === "dark"}
              id="auditor-mode"
            />
          </FormControl>
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
