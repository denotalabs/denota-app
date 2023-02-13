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
import { useStep } from "../../designSystem/stepper/Stepper";

interface Props {
  screenKey: string;
}

function CheqModuleSelectStep({ screenKey }: Props) {
  const { next, appendFormData, formData } = useStep();

  return (
    <Box w="100%" p={4}>
      <SimpleGrid spacing={4} templateColumns="1fr 1fr 1fr">
        <Card>
          <CardHeader>
            <Heading size="md"> Direct Pay</Heading>
          </CardHeader>
          <CardBody>
            <Text>Funds are released immeidately upon payment</Text>
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
            <Button
              onClick={() => {
                appendFormData({
                  module: "milestone",
                });
                next?.();
              }}
            >
              Select
            </Button>
          </CardFooter>
        </Card>
      </SimpleGrid>
    </Box>
  );
}

export default CheqModuleSelectStep;
