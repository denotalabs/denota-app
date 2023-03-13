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
import { useNotaForm } from "../../../context/NotaFormProvider";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";

interface Props extends ScreenProps {
  isInvoice: boolean;
}

const CheqModuleSelectStep: React.FC<Props> = ({ isInvoice }) => {
  const { next, goToStep } = useStep();
  const { appendFormData } = useNotaForm();

  return (
    <Box w="100%" p={4}>
      <SimpleGrid
        spacing={4}
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
      >
        <Card>
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
                next?.();
              }}
            >
              Select
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="md"> Escrow</Heading>
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
                next?.();
              }}
            >
              Select
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="md"> Milestones</Heading>
          </CardHeader>
          <CardBody>
            <Text>Funds are released on completion of milestones </Text>
          </CardBody>
          <CardFooter>
            <Button isDisabled>Coming Soon</Button>
          </CardFooter>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default CheqModuleSelectStep;
