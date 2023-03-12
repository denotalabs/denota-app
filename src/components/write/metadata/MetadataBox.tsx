import { Flex } from "@chakra-ui/react";

import RoundedBox from "../../designSystem/RoundedBox";
import EmailField from "../../fields/input/EmailField";
import NoteField from "../../fields/input/NoteField";
import TagsField from "../../fields/input/TagsField";
import FileControl from "./FileUpload";

interface Props {
  isInvoice: boolean;
  token: string;
  mode: string;
}

function DetailsBox() {
  // const { values } = useFormikContext<MetadataStepFormValues>();
  // const { appendFormData } = useNotaForm();

  // // useEffect(() => {
  // //   const { token, amount, address, mode } = values;
  // //   appendFormData({ token, amount: amount?.toString() ?? "", address, mode });
  // // }, [appendFormData, values]);

  return (
    <RoundedBox padding={4}>
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
        <EmailField fieldName="email" placeholder="" />
        <TagsField fieldName="tags" placeholder="" />
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <NoteField fieldName="note" />
        </Flex>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <FileControl name="file" />
        </Flex>
      </Flex>
    </RoundedBox>
  );
}

export default DetailsBox;
