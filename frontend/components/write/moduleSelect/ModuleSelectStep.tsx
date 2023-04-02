import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useMemo } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import useDemoMode from "../../../hooks/useDemoMode";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import ModuleTerms from "../module/ModuleTerms";

interface Props extends ScreenProps {
  showTerms: boolean;
}

const CheqModuleSelectStep: React.FC<Props> = ({ showTerms }) => {
  const isDemoMode = useDemoMode();

  const { next } = useStep();
  const { appendFormData, formData } = useNotaForm();

  const currentDate = useMemo(() => {
    const d = new Date();
    const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000);

    return today.toISOString().slice(0, 10);
  }, []);

  return (
    <Box w="100%" p={4}>
      <SimpleGrid
        spacing={4}
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
        mb={4}
      >
        <Card variant={formData.module === "direct" ? "filled" : "outline"}>
          <CardHeader>
            <Heading size="md"> Direct Pay</Heading>
          </CardHeader>
          <CardBody>
            <Text>Funds are released immediately upon payment</Text>
          </CardBody>
          <CardFooter>
            <Button
              onClick={() => {
                appendFormData({
                  module: "direct",
                });
                if (!showTerms) {
                  next?.();
                }
              }}
            >
              Select
            </Button>
          </CardFooter>
        </Card>
        <Card variant={formData.module === "escrow" ? "filled" : "outline"}>
          <CardHeader>
            <Heading size="md">Escrow</Heading>
          </CardHeader>
          <CardBody>
            <Text>Funds are held in escrow until released by the payer </Text>
          </CardBody>
          <CardFooter>
            <Button
              onClick={() => {
                appendFormData({
                  module: "escrow",
                });
                if (!showTerms) {
                  next?.();
                }
              }}
            >
              Select
            </Button>
          </CardFooter>
        </Card>
        <Card variant={formData.module === "milestone" ? "filled" : "outline"}>
          <CardHeader>
            <Heading size="md"> Milestones</Heading>
          </CardHeader>
          <CardBody>
            <Text>Funds are released on completion of milestones </Text>
          </CardBody>
          <CardFooter>
            <Button
              isDisabled={!isDemoMode}
              onClick={() => {
                appendFormData({
                  module: "milestone",
                });
                if (!showTerms) {
                  next?.();
                }
              }}
            >
              {isDemoMode ? "Select" : "Coming Soon"}
            </Button>
          </CardFooter>
        </Card>
      </SimpleGrid>
      {showTerms && formData.module && (
        <Formik
          initialValues={{
            inspection: formData.inspection
              ? Number(formData.inspection)
              : 604800,
            module: formData.module ?? "direct",
            dueDate: formData.dueDate ?? currentDate,
            auditor: formData.auditor ?? "",
            milestones: formData.milestones
              ? formData.milestones.split(",")
              : [formData.amount],
          }}
          onSubmit={(values) => {
            appendFormData({
              milestones: values.milestones.join(","),
              dueDate: values.dueDate,
              auditor: values.auditor,
            });
            next?.();
          }}
        >
          {(props) => (
            <Form>
              <ModuleTerms
                module={formData.module}
                isInvoice={formData.mode === "invoice"}
              />
              <RoundedButton
                isDisabled={props.errors.milestones !== undefined}
                type="submit"
              >
                {"Next"}
              </RoundedButton>
            </Form>
          )}
        </Formik>
      )}
    </Box>
  );
};

export default CheqModuleSelectStep;
