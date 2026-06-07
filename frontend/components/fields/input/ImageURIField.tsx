import MetadataUriField from "./MetadataUriField";

interface Props {
  fieldName: string;
  placeholder: string;
}

export default function ImageURIField({ fieldName, placeholder }: Props) {
  return (
    <MetadataUriField fieldName={fieldName} placeholder={placeholder} />
  );
}
