import { Select } from "@chakra-ui/react";

interface Props {
  fieldName: string;
  placeholder?: string;
}

//TODO - add search, etc
function ContactSelector({ fieldName, placeholder }: Props) {
  const contacts = [
    { id: 1, name: "Alice", address: "0x1234" },
    { id: 2, name: "Bob", address: "0x5678" },
    { id: 3, name: "Charlie", address: "0x9abc" },
  ];

  return (
    <Select name={fieldName} placeholder={placeholder}>
      {contacts.map((contact) => (
        <option key={contact.id} value={contact.address}>
          {contact.name}
        </option>
      ))}
    </Select>
  );
}

export default ContactSelector;
