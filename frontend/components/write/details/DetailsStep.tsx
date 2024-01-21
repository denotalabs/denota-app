import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Box, Button, Collapse, useToast } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useUploadMetadata } from "../../../hooks/useUploadNote";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import MetadataBox from "../metadata/MetadataBox";
import AccountDetails from "./AccountDetails";
import PaymentDetails from "./PaymentDetails";

interface Props extends ScreenProps {
  isInvoice: boolean;
  showMetadata: boolean;
}

export type DetailsStepFormValues = {
  token: string;
  amount: string | undefined;
  address: string;
  mode: string;
};

const DetailsStep: React.FC<Props> = ({ isInvoice, showMetadata }) => {
  const { next } = useStep();
  const { notaFormValues, file, updateNotaFormValues, setFile } = useNotaForm();
  const { upload } = useUploadMetadata();

  let initialMode = notaFormValues.mode;

  if (initialMode === undefined) {
    initialMode = isInvoice ? "invoice" : "pay";
  }

  const [isOpen, setIsOpen] = useState(false);

  const toast = useToast();

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          token: notaFormValues.token ?? "USDC",
          amount: notaFormValues.amount ?? undefined,
          address: notaFormValues.address ?? "",
          mode: "pay",
          note: notaFormValues.note ?? "",
          email: notaFormValues.email ?? "",
          file: file,
          tags: notaFormValues.tags ?? "",
        }}
        onSubmit={async (values, actions) => {
          const hasMetadata = values.note || values.file || values.tags;
          if (showMetadata && hasMetadata) {
            actions.setSubmitting(true);

            const metadataChanged =
              notaFormValues.note !== values.note ||
              values.file?.name !== file?.name ||
              notaFormValues.tags !== values.tags;

            if (metadataChanged) {
              const result = await upload(
                values.file,
                values.note,
                values.tags
              );

              const { ipfsHash, imageUrl } = result;

              if (ipfsHash === undefined) {
                toast({
                  title: "Error uploading file",
                  status: "error",
                  duration: 3000,
                  isClosable: true,
                });
              } else {
                updateNotaFormValues({
                  ipfsHash,
                  imageUrl,
                });
              }
            }
          }

          updateNotaFormValues({
            note: values.note,
            email: values.email,
            tags: values.tags,
          });

          if (values.file) {
            setFile?.(values.file);
          }

          actions.setSubmitting(false);
          next?.();
        }}
      >
        {(props) => {
          const isValid =
            !props.errors.address &&
            !props.errors.amount &&
            props.values.address &&
            props.values.amount;
          return (
            <Form>
              <PaymentDetails
                token={props.values.token}
                mode={props.values.mode}
              />
              <AccountDetails
                onSelectContact={(address) => {
                  props.setFieldValue("address", address);
                }}
              />
              {showMetadata && (
                <>
                  <Button
                    mt={4}
                    rightIcon={isOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
                    onClick={() => setIsOpen(!isOpen)}
                    bg="transparent"
                    sx={{
                      "&:hover": {
                        bg: "transparent",
                      },
                    }}
                  >
                    Metadata Options
                  </Button>
                  <Collapse in={isOpen} animateOpacity>
                    <Box my={5}>
                      <MetadataBox />
                    </Box>
                  </Collapse>
                </>
              )}

              <RoundedButton
                mt={2}
                type="submit"
                isLoading={props.isSubmitting}
                isDisabled={!isValid}
              >
                {"Next"}
              </RoundedButton>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};

export default DetailsStep;
