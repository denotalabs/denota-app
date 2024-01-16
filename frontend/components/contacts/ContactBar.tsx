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
import { useFormikContext } from "formik";
import React, { useState } from "react";
import { MdCheck, MdContacts, MdSearch } from "react-icons/md";

import { DetailsStepFormValues } from "../write/details/DetailsStep";
import AddressBookModal from "./AddressBookModal";
// import useENSResolver from "../../hooks/useENSResolver";
interface ContactBarProps {
  onSelectContact: (address: string) => void;
}

const ContactBar = ({ onSelectContact }: ContactBarProps) => {
  const { values } = useFormikContext<DetailsStepFormValues>();

  const [selectedAddress, setSelectedAddress] = useState(values.address);
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

  const projectId = process.env.NEXT_PUBLIC_INFURA_KEY;

  const handleSearch = async () => {
    // TODO refactor to use ENS Resolver hook, add search suggestions
    // TODO add Lens support as well
    try {
      const ensProvider = new ethers.providers.JsonRpcProvider(
        `https://mainnet.infura.io/v3/${projectId}`
      );

      let address: string;

      if (ethers.utils.isAddress(searchText)) {
        address = ethers.utils.getAddress(searchText);
      } else {
        const ensResolver = await ensProvider.getResolver(searchText);
        if (!ensResolver) {
          throw new Error("Could not resolve ENS name");
        }
        address = await ensResolver.getAddress();
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
      // Prevent form submission
      event.preventDefault();

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
            // TODO if ENS is selected show ENS info
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
