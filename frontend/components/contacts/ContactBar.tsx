import {
  Box,
  Flex,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import React, { useState } from "react";
import { MdCheck, MdContacts, MdSearch } from "react-icons/md";

import AddressBookModal from "./AddressBookModal";

interface ContactBarProps {
  onSelectContact: (address: string) => void;
}

const ContactBar = ({ onSelectContact }: ContactBarProps) => {
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedName, setSelectedName] = useState("");

  const [searchText, setSearchText] = useState("");
  const [isAddressBookModalOpen, setIsAddressBookModalOpen] = useState(false);

  const handleSearchTextChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchText(event.target.value);
  };

  const handleSelectContact = (address: string, name: string) => {
    setSelectedAddress(address);
    setSelectedName(name);
    onSelectContact(address);
  };

  const handleSearch = async () => {
    try {
      //  TODO resolve on Polygon, Celo, etc
      //  pass in static URL for infura/etc for ETH and should resolve on ETH
      const provider = new ethers.providers.JsonRpcProvider(
        "https://cloudflare-eth.com"
      );

      let address: string;

      if (ethers.utils.isAddress(searchText)) {
        address = ethers.utils.getAddress(searchText);
      } else {
        const resolver = await provider.getResolver(searchText);
        if (!resolver) {
          throw new Error("Could not resolve ENS name");
        }
        address = await resolver.getAddress();
        if (address === ethers.constants.AddressZero) {
          throw new Error("ENS name does not have an associated address");
        }
      }

      console.log(`Resolved address: ${address}`);
      onSelectContact(address);
      setSelectedAddress(address);
      setSearchText("");
    } catch (error) {
      console.error("Error resolving address:", error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const toggleAddressBookModal = () => {
    setIsAddressBookModalOpen(!isAddressBookModalOpen);
  };

  return (
    <>
      <InputGroup>
        <InputLeftElement>
          <MdSearch />
        </InputLeftElement>
        <Input
          type="text"
          placeholder="Search addresses or ENS names"
          value={searchText}
          onChange={handleSearchTextChange}
          onKeyDown={handleKeyPress}
        />
        <InputRightElement>
          <IconButton
            aria-label="Address Book"
            icon={<MdContacts />}
            onClick={toggleAddressBookModal}
          />
        </InputRightElement>
      </InputGroup>
      <AddressBookModal
        isOpen={isAddressBookModalOpen}
        onClose={toggleAddressBookModal}
        onSelectContact={handleSelectContact}
      />
      {selectedAddress && (
        <Box
          mt={4}
          p={2}
          borderWidth={1}
          borderRadius="md"
          borderColor="success.100"
          textAlign="center"
        >
          <Flex>
            <Icon as={MdCheck} color="success.100" />
          </Flex>
          <Text fontWeight="bold">Recipient selected</Text>
          {selectedName !== "" ? (
            <Text>
              {selectedName} ({selectedAddress.slice(0, 6)}...
              {selectedAddress.slice(-4)})
            </Text>
          ) : (
            <Text>{selectedAddress}</Text>
          )}
        </Box>
      )}
    </>
  );
};

export default ContactBar;
