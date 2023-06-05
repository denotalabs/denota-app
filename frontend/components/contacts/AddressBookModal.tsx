import {
  Box,
  Button,
  Flex,
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
import { MdContacts, MdSearch } from "react-icons/md";

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
    { name: "Alice", address: "0x45203ac010BfcFA28f0C3eB63B3984f6012cddaf" },
    {
      name: "Amir Ali (Blockchain Consultant)",
      address: "0x91663f613945C9F90CC2b74328Db44441D993172",
    },
    {
      name: "Dai Nguyen (Solidity Developer)",
      address: "0xBAEc7Dd8a88a7A7f0c513269311ac1D9FcE7fbED",
    },
    {
      name: "Juanita Perez (Smart Contract Developer)",
      address: "0x4304aE586D81aCEe9dDbD06E0a0072b0F983B6Dd",
    },
    {
      name: "Katarina Ivanova (Crypto Investor)",
      address: "0xf5576Ce68309Bda80005ddfcC8d3f2Cd6A2dA0C7",
    },
    {
      name: "Luna Patel (Crypto Journalist)",
      address: "0x8a91C6eA9afF17E300e61d8ddc121488041b700a",
    },
    {
      name: "Moinul Ahmed (Blockchain Developer)",
      address: "0x6A6D1198E3291Ff30f9A4484623e2C23CCcC265D",
    },
    {
      name: "Rafi",
      address: "0x167813E0D6958BCF30a1cEbEE53aE0C57677c963",
    },
    {
      name: "Santiago Garcia (Smart Contract Auditor)",
      address: "0x603e8d7C59a88162A665581028430F5F598e3893",
    },
    {
      name: "Sophie Lee (DeFi Product Manager)",
      address: "0x3367aabd758F0a3A00B6845C9Cb162C2A90edD25",
    },
    {
      name: "Zohaib Lunda (MakerDAO Contributor)",
      address: "0x309326c866F3Fc07CBb26A7BC87D04328D8a5A04",
    },
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
        <ModalHeader>
          <Flex alignItems={"center"}>
            <MdContacts />
            <Text ml={3}>Address Book</Text>
          </Flex>
        </ModalHeader>
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
          <Box maxH="400px" overflowY="auto">
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
                  <Text size="sm">{contact.address}</Text>
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
