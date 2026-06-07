import MetadataUriField from "./MetadataUriField";

interface Props {
  fieldName: string;
  placeholder: string;
}

export default function ExternalURIField({ fieldName, placeholder }: Props) {
  return (
    <MetadataUriField
      fieldName={fieldName}
      placeholder={placeholder}
      uploadValueKey="ipfsHash"
    />
  );
}
