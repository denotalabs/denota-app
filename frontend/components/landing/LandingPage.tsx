import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Clock,
  DollarSign,
  FileCheck,
  Handshake,
  Mail,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/router";

const WORKS_FOR = [
  "Paying a freelancer before the work is done",
  "Buying from someone you have not met yet",
  "Releasing funds when a milestone lands",
  "Holding a deposit until both sides are happy",
  "Splitting a payment across stages of a project",
  "Paying out a bounty or reward once it is claimed",
];

const PROBLEM_ITEMS = [
  {
    title: "Pay up front and hope",
    body: "The money is gone and the work may never ship.",
    icon: Handshake,
    isFix: false,
  },
  {
    title: "Wait until it is done and hope",
    body: "“The check is coming,” with no date and no hold.",
    icon: Clock,
    isFix: false,
  },
  {
    title: "With Denota",
    body: "The money is set aside first and the rules are written down, so neither side has to go first on faith.",
    icon: Shield,
    isFix: true,
  },
];

const WHY_ITEMS = [
  {
    title: "The money is really there",
    body: "Funds are set aside before the work starts, and both sides can see it.",
    icon: Wallet,
  },
  {
    title: "A record you can point to",
    body: "There is a clear record that the payment was meant to happen, not a buried email thread.",
    icon: FileCheck,
  },
  {
    title: "Terms in plain language",
    body: "The app spells out who can release the money and when, in a sentence you can both read.",
    icon: Shield,
  },
];

const STEPS = [
  {
    n: "1",
    title: "Set the money aside",
    body: "The sender chooses the amount and the terms, or sends a link so the other side can.",
  },
  {
    n: "2",
    title: "Read the terms",
    body: "A short line says who gets paid, who can reverse it, and by when.",
  },
  {
    n: "3",
    title: "Do the deal",
    body: "Attach an invoice, contract, or proof of delivery so the paperwork lives with the payment.",
  },
  {
    n: "4",
    title: "Get paid on the terms",
    body: "You claim it, a trusted person releases it, or it pays out on a schedule.",
  },
];

const TERMS = [
  {
    title: "Hold until I claim",
    body: "Money sits until it is collected. Add an optional deadline, and unclaimed funds go back to the sender.",
    use: "Retainers, deposits, and “pay me when I am ready.”",
  },
  {
    title: "Hold until someone signs off",
    body: "A person you both name can release it or send it back, anytime or only until an inspection date.",
    use: "New clients, custom work, private sales, anything you would put in escrow.",
  },
  {
    title: "Pay in installments",
    body: "Funds are set aside up front and released in chunks on a schedule.",
    use: "Long projects and staged work.",
  },
  {
    title: "Just send it",
    body: "Pay now, no hold. Optionally keep a receipt so there is still a record.",
    use: "Trusted people and small amounts.",
  },
];

const NO_CRYPTO = [
  {
    title: "Sign in with your email",
    body: "Privy handles the wallet behind the scenes, so there is nothing to install.",
    icon: Mail,
  },
  {
    title: "Paid in US dollars",
    body: "Held in the stablecoin you choose. No guessing what your payment is worth tomorrow.",
    icon: DollarSign,
  },
  {
    title: "Free while we are in beta",
    body: "No platform cut on your invoice.",
    icon: Sparkles,
  },
];

function LandingPage() {
  const router = useRouter();

  return (
    <Box
      w="100%"
      maxW="960px"
      mx="auto"
      px={{ base: 5, md: 8 }}
      py={{ base: 10, md: 16 }}
      pb={{ base: 16, md: 24 }}
    >
      <VStack align="stretch" spacing={{ base: 14, md: 20 }}>
        <Box textAlign={{ base: "left", md: "center" }} maxW="720px" mx="auto">
          <Text
            fontSize="sm"
            fontWeight={700}
            letterSpacing="0.08em"
            textTransform="uppercase"
            color="brand.200"
            mb={3}
          >
            Payments with conditions
          </Text>
          <Heading
            as="h1"
            fontSize={{ base: "34px", md: "48px" }}
            lineHeight={1.15}
            letterSpacing="-0.03em"
            fontWeight={700}
          >
            Send money that unlocks on your terms
          </Heading>
          <Text
            mt={5}
            fontSize={{ base: "md", md: "lg" }}
            color="whiteAlpha.800"
            lineHeight="tall"
          >
            Denota holds the money first, then releases it when your conditions
            are met. No wallet to set up, paid in US dollars, and free while we
            are in beta.
          </Text>
          <Flex
            mt={8}
            gap={3}
            justify={{ base: "flex-start", md: "center" }}
            direction={{ base: "column", sm: "row" }}
          >
            <Button
              size="lg"
              bg="brand.200"
              color="white"
              borderRadius="12px"
              px={8}
              _hover={{ bg: "#4a73e0" }}
              onClick={() => router.push("/send")}
            >
              Create a payment
            </Button>
            <Button
              size="lg"
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              borderRadius="12px"
              px={8}
              _hover={{ bg: "whiteAlpha.100" }}
              onClick={() => router.push("/dashboard")}
            >
              View dashboard
            </Button>
          </Flex>
        </Box>

        {/* <Box>
          <Heading
            size="lg"
            mb={8}
            textAlign={{ base: "left", md: "center" }}
            letterSpacing="-0.02em"
          >
            One tool, many deals
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
            {WORKS_FOR.map((item) => (
              <Box
                key={item}
                bg="brand.100"
                borderRadius="20px"
                px={5}
                py={4}
                border="1px solid"
                borderColor="whiteAlpha.100"
              >
                <Text fontSize="sm" color="whiteAlpha.800" lineHeight="tall">
                  {item}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box> */}

        <Box>
          <Heading
            size="lg"
            mb={8}
            textAlign={{ base: "left", md: "center" }}
            letterSpacing="-0.02em"
          >
            The old way is trust or nothing
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {PROBLEM_ITEMS.map(({ title, body, icon: Icon, isFix }) => (
              <Box
                key={title}
                bg="brand.100"
                borderRadius="20px"
                p={6}
                border="1px solid"
                borderColor={isFix ? "brand.200" : "whiteAlpha.100"}
              >
                <Flex
                  w="36px"
                  h="36px"
                  borderRadius="10px"
                  align="center"
                  justify="center"
                  bg="brand.300"
                  color="brand.200"
                  mb={4}
                >
                  <Icon size={18} strokeWidth={2.4} />
                </Flex>
                <Heading size="sm" mb={2}>
                  {title}
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.700" lineHeight="tall">
                  {body}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        <Box>
          <Heading
            size="lg"
            mb={3}
            textAlign={{ base: "left", md: "center" }}
            letterSpacing="-0.02em"
          >
            Why Denota
          </Heading>
          <Text
            color="whiteAlpha.700"
            textAlign={{ base: "left", md: "center" }}
            maxW="560px"
            mx="auto"
            mb={8}
          >
            Trust, transparency, and clear terms, without a marketplace taking
            10 to 20% of your invoice.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {WHY_ITEMS.map(({ title, body, icon: Icon }) => (
              <Box
                key={title}
                bg="brand.100"
                borderRadius="20px"
                p={6}
                border="1px solid"
                borderColor="whiteAlpha.100"
              >
                <Flex
                  w="36px"
                  h="36px"
                  borderRadius="10px"
                  align="center"
                  justify="center"
                  bg="brand.300"
                  color="brand.200"
                  mb={4}
                >
                  <Icon size={18} strokeWidth={2.4} />
                </Flex>
                <Heading size="sm" mb={2}>
                  {title}
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.700" lineHeight="tall">
                  {body}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        <Box>
          <Heading
            size="lg"
            mb={8}
            textAlign={{ base: "left", md: "center" }}
            letterSpacing="-0.02em"
          >
            How a payment works
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {STEPS.map(({ n, title, body }) => (
              <Flex
                key={n}
                bg="brand.100"
                borderRadius="20px"
                p={6}
                gap={4}
                border="1px solid"
                borderColor="whiteAlpha.100"
              >
                <Text
                  fontWeight={700}
                  color="brand.200"
                  fontSize="lg"
                  lineHeight="1"
                  mt={1}
                >
                  {n}
                </Text>
                <Box>
                  <Heading size="sm" mb={2}>
                    {title}
                  </Heading>
                  <Text fontSize="sm" color="whiteAlpha.700" lineHeight="tall">
                    {body}
                  </Text>
                </Box>
              </Flex>
            ))}
          </SimpleGrid>
        </Box>

        <Box>
          <Heading
            size="lg"
            mb={8}
            textAlign={{ base: "left", md: "center" }}
            letterSpacing="-0.02em"
          >
            Terms that match the deal
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {TERMS.map(({ title, body, use }) => (
              <Box
                key={title}
                bg="brand.100"
                borderRadius="20px"
                p={6}
                border="1px solid"
                borderColor="whiteAlpha.100"
              >
                <Heading size="sm" mb={2}>
                  {title}
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.800" lineHeight="tall">
                  {body}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.600" mt={3} fontStyle="italic">
                  {use}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        <Box>
          <Heading
            size="lg"
            mb={8}
            textAlign={{ base: "left", md: "center" }}
            letterSpacing="-0.02em"
          >
            No crypto headache
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {NO_CRYPTO.map(({ title, body, icon: Icon }) => (
              <Box
                key={title}
                bg="brand.100"
                borderRadius="20px"
                p={6}
                border="1px solid"
                borderColor="whiteAlpha.100"
              >
                <Flex
                  w="36px"
                  h="36px"
                  borderRadius="10px"
                  align="center"
                  justify="center"
                  bg="brand.300"
                  color="brand.200"
                  mb={4}
                >
                  <Icon size={18} strokeWidth={2.4} />
                </Flex>
                <Heading size="sm" mb={2}>
                  {title}
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.700" lineHeight="tall">
                  {body}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        <Box
          bg="brand.100"
          borderRadius="24px"
          p={{ base: 8, md: 12 }}
          textAlign="center"
          border="1px solid"
          borderColor="whiteAlpha.100"
        >
          <Heading size="lg" letterSpacing="-0.02em" mb={3}>
            Hold the money. Write the terms. Do the deal.
          </Heading>
          <Text color="whiteAlpha.700" maxW="480px" mx="auto" mb={8}>
            Stop choosing between trust-me-up-front and trust-me-later. Denota
            is in beta, with no platform cut on your invoice.
          </Text>
          <Button
            size="lg"
            bg="brand.200"
            color="white"
            borderRadius="12px"
            px={8}
            _hover={{ bg: "#4a73e0" }}
            onClick={() => router.push("/send")}
          >
            Create a payment
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}

export default LandingPage;
