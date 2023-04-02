import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { MdSearch } from "react-icons/md";

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (address: string, name: string) => void;
}

const AddressBookModal = ({
  isOpen,
  onClose,
  onSelectContact,
}: AddressBookModalProps) => {
  const [searchText, setSearchText] = useState("");

  const mockAddressBookData = [
    { name: "Alice", address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
    { name: "Amir Ali (Blockchain Consultant)", address: "0x2f40F73644f8C99A39c28ccD057998b352F4A4D4" },
    { name: "Dai Nguyen (Solidity Developer)", address: "0x0f0D7Bc00f1272045D5C81E3a5D5BC5b57Be0667" },
    { name: "Juanita Perez (Smart Contract Developer)", address: "0x52C9b1c3b3a6dd287C7dE0c0f87B303CA4696b37" },
    { name: "Katarina Ivanova (Crypto Investor)", address: "0x4ABaa7ACc2a012d5AF5c139f2C8f711C1FBb13D7" },
    { name: "Luna Patel (Crypto Journalist)", address: "0xC74A1d9Db9c8a2A0A5eD72A53c123A18De8cFE5B" },
    { name: "Moinul Ahmed (Blockchain Developer)", address: "0x6c1b6FEbF6f0A6C161013dCDDc8fA9369BfB064E" },
    { name: "Santiago Garcia (Smart Contract Auditor)", address: "0x8C42eF2b481E6b0211A365CdC6B82c6AEC69Afb7" },
    { name: "Sophie Lee (DeFi Product Manager)", address: "0x89f9b16B8396F1bF92cDd30760c6C98D826EfD27" },
    { name: "Zohaib Lunda (MakerDAO Contributor)", address: "0x176c17C81AeF19E7692a648b01f6a30C6D823157" },
  ];

  const handleSearchTextChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchText(event.target.value);
  };

  const filteredContacts = mockAddressBookData.filter((contact) =>
    contact.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bgColor={"brand.600"}>
        <ModalHeader>Address Book</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <InputGroup mb={4}>
            <InputLeftElement>
              <MdSearch />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Search contacts"
              value={searchText}
              onChange={handleSearchTextChange}
            />
          </InputGroup>
          <Box maxH="300px" overflowY="auto">
            <VStack spacing={4}>
              {filteredContacts.map((contact, index) => (
                <Box
                  key={index}
                  w="100%"
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => {
                    onSelectContact(contact.address, contact.name);
                    onClose();
                  }}
                >
                  <Text fontWeight="bold">{contact.name}</Text>
                  <Text>{contact.address}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button bg={"brand.400"} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddressBookModal;
