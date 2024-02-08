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
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import ModuleTerms from "../module/ModuleTerms";

interface Props extends ScreenProps {
  showTerms: boolean;
}

const ModuleSelectStep: React.FC<Props> = ({ showTerms }) => {
  const { next } = useStep();
  const { updateNotaFormValues, notaFormValues } = useNotaForm();

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
        <Card
          variant={notaFormValues.module === "direct" ? "filled" : "outline"}
        >
          <CardHeader>
            <Heading size="md"> Direct Pay</Heading>
          </CardHeader>
          <CardBody>
            <Text>Funds are released immediately upon payment</Text>
          </CardBody>
          <CardFooter>
            <Button
              onClick={() => {
                updateNotaFormValues({
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
        <Card
          variant={notaFormValues.module === "escrow" ? "filled" : "outline"}
        >
          <CardHeader>
            <Heading size="md">Reversible Release</Heading>
          </CardHeader>
          <CardBody>
            <Text>Funds are held in escrow until released by the payer </Text>
          </CardBody>
          <CardFooter>
            <Button
              onClick={() => {
                updateNotaFormValues({
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
        <Card
          variant={
            notaFormValues.module === "simpleCash" ? "filled" : "outline"
          }
        >
          <CardHeader>
            <Heading size="md">Simple Cash</Heading>
          </CardHeader>
          <CardBody>
            <Text>Funds are locked until cashed by the recipient</Text>
          </CardBody>
          <CardFooter>
            <Button
              onClick={() => {
                updateNotaFormValues({
                  module: "simpleCash",
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
        <Card
          variant={notaFormValues.module === "milestone" ? "filled" : "outline"}
        >
          <CardHeader>
            <Heading size="md"> Milestones</Heading>
          </CardHeader>
          <CardBody>
            <Text>Funds are released on completion of milestones </Text>
          </CardBody>
          <CardFooter>
            <Button
              isDisabled={true}
              onClick={() => {
                updateNotaFormValues({
                  module: "milestone",
                });
                if (!showTerms) {
                  next?.();
                }
              }}
            >
              {"Coming Soon"}
            </Button>
          </CardFooter>
        </Card>
      </SimpleGrid>
      {showTerms && notaFormValues.module && (
        <Formik
          initialValues={{
            inspection: notaFormValues.inspection
              ? Number(notaFormValues.inspection)
              : 604800,
            module: notaFormValues.module ?? "direct",
            dueDate: notaFormValues.dueDate ?? currentDate,
            auditor: notaFormValues.auditor ?? "",
            milestones: notaFormValues.milestones
              ? notaFormValues.milestones.split(",")
              : [notaFormValues.amount],
            axelarEnabled: notaFormValues.axelarEnabled ?? false,
          }}
          onSubmit={(values) => {
            updateNotaFormValues({
              milestones: values.milestones.join(","),
              dueDate: values.dueDate,
              auditor: values.auditor,
              axelarEnabled: values.axelarEnabled ? "true" : undefined,
            });
            next?.();
          }}
        >
          {(props) => (
            <Form>
              <ModuleTerms module={notaFormValues.module} />
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

export default ModuleSelectStep;
