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
  CalendarClock,
  Check,
  DollarSign,
  HandCoins,
  Mail,
  Send,
  Sparkles,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/router";

const GREEN = "#4ADE80";
const RED = "#F87171";

const OLD_WAY = [
  {
    title: "Pay up front",
    body: "Money gone, work may not ship",
  },
  {
    title: "Wait and hope",
    body: "No date, no hold, no leverage",
  },
];

const WITH_DENOTA = [
  {
    title: "Money set aside first",
    body: "Both sides can see it is really there",
  },
  {
    title: "Rules written down",
    body: "Neither side goes first on faith",
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
    done: true,
  },
];

const TERMS: {
  title: string;
  body: string;
  use: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Hold until I claim",
    body: "Money sits until it is collected. Add an optional deadline, and unclaimed funds go back to the sender.",
    use: "Retainers, deposits, and pay me when I am ready",
    icon: HandCoins,
  },
  {
    title: "Pay in installments",
    body: "Funds are set aside up front and released in chunks on a schedule.",
    use: "Long projects and staged work",
    icon: CalendarClock,
  },
  {
    title: "Hold until someone signs off",
    body: "A person you both name can release it or send it back, anytime or only until an inspection date.",
    use: "New clients, custom work, private sales",
    icon: UserCheck,
  },
  {
    title: "Just send it",
    body: "Pay now, no hold. Optionally keep a receipt so there is still a record.",
    use: "Trusted people and small amounts",
    icon: Send,
  },
];

const NO_CRYPTO: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Sign in with email",
    body: "Nothing to install",
    icon: Mail,
  },
  {
    title: "Paid in US dollars",
    body: "Held in a stablecoin",
    icon: DollarSign,
  },
  {
    title: "Free during beta",
    body: "No platform cut",
    icon: Sparkles,
  },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <Heading
      as="h2"
      fontSize={{ base: "26px", md: "32px" }}
      fontWeight={700}
      letterSpacing="-0.03em"
      textAlign="center"
      mb={{ base: 8, md: 10 }}
    >
      {children}
    </Heading>
  );
}

function LandingPage() {
  const router = useRouter();

  return (
    <Box
      w="100%"
      maxW="880px"
      mx="auto"
      px={{ base: 5, md: 8 }}
      py={{ base: 10, md: 16 }}
      pb={{ base: 16, md: 24 }}
    >
      <VStack align="stretch" spacing={{ base: 16, md: 24 }}>
        <Box textAlign="center" maxW="720px" mx="auto">
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
            color="gray.600"
            lineHeight="tall"
          >
            Denota holds the money first, then releases it when your conditions
            are met. No wallet to set up, paid in US dollars, and free while we
            are in beta.
          </Text>
          <Flex
            mt={8}
            gap={3}
            justify="center"
            direction={{ base: "column", sm: "row" }}
          >
            <Button
              size="lg"
              bg="brand.200"
              color="brand.100"
              borderRadius="12px"
              px={8}
              _hover={{ bg: "black" }}
              onClick={() => router.push("/send")}
            >
              Create a payment
            </Button>
            <Button
              size="lg"
              variant="outline"
              borderColor="gray.900"
              color="gray.900"
              borderRadius="12px"
              px={8}
              _hover={{ bg: "gray.50" }}
              onClick={() => router.push("/dashboard")}
            >
              View dashboard
            </Button>
          </Flex>
        </Box>

        <Box>
          <Text
            fontSize="xs"
            fontWeight={700}
            letterSpacing="0.14em"
            textTransform="uppercase"
            color="gray.500"
            textAlign="center"
            mb={5}
          >
            The old way is trust or nothing
          </Text>
          <Flex
            direction={{ base: "column", md: "row" }}
            borderRadius="24px"
            overflow="hidden"
            border="1px solid"
            borderColor="gray.200"
            bg="brand.100"
          >
            <Box flex="1" px={{ base: 6, md: 8 }} py={{ base: 7, md: 8 }}>
              <Text
                fontSize="xs"
                fontWeight={700}
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="gray.400"
                mb={5}
              >
                The old way
              </Text>
              <VStack align="stretch" spacing={5}>
                {OLD_WAY.map(({ title, body }) => (
                  <Flex key={title} gap={3} align="flex-start">
                    <Box color={RED} mt="2px" flexShrink={0}>
                      <X size={18} strokeWidth={2.75} />
                    </Box>
                    <Box>
                      <Text fontWeight={700} fontSize="md">
                        {title}
                      </Text>
                      <Text
                        fontSize="sm"
                        color="gray.400"
                        textDecoration="line-through"
                        mt={0.5}
                      >
                        {body}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>
            <Box
              flex="1"
              px={{ base: 6, md: 8 }}
              py={{ base: 7, md: 8 }}
              bg="gray.50"
              borderTopWidth={{ base: "1px", md: 0 }}
              borderLeftWidth={{ base: 0, md: "1px" }}
              borderColor="gray.200"
            >
              <Text
                fontSize="xs"
                fontWeight={700}
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="gray.700"
                mb={5}
              >
                With Denota
              </Text>
              <VStack align="stretch" spacing={5}>
                {WITH_DENOTA.map(({ title, body }) => (
                  <Flex key={title} gap={3} align="flex-start">
                    <Box color={GREEN} mt="2px" flexShrink={0}>
                      <Check size={18} strokeWidth={2.75} />
                    </Box>
                    <Box>
                      <Text fontWeight={700} fontSize="md">
                        {title}
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={0.5}>
                        {body}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </Flex>
        </Box>

        <Box>
          <SectionTitle>How a payment works</SectionTitle>
          <Box maxW="560px" mx="auto">
            {STEPS.map(({ n, title, body, done }, i) => (
              <Flex key={n} gap={4}>
                <Flex direction="column" align="center" flexShrink={0} w="36px">
                  <Flex
                    w="36px"
                    h="36px"
                    borderRadius="full"
                    align="center"
                    justify="center"
                    bg={done ? GREEN : "notaPurple.100"}
                    color="white"
                    fontWeight={700}
                    fontSize="sm"
                  >
                    {done ? <Check size={18} strokeWidth={3} /> : n}
                  </Flex>
                  {i < STEPS.length - 1 ? (
                    <Box w="1px" flex="1" bg="gray.200" />
                  ) : null}
                </Flex>
                <Box pb={i < STEPS.length - 1 ? 8 : 0} pt="6px">
                  <Heading as="h3" size="sm" mb={1.5}>
                    {title}
                  </Heading>
                  <Text fontSize="sm" color="gray.600" lineHeight="tall">
                    {body}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Box>
        </Box>

        <Box>
          <SectionTitle>Terms that match the deal</SectionTitle>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {TERMS.map(({ title, body, use, icon: Icon }) => (
              <Box
                key={title}
                bg="brand.100"
                borderRadius="20px"
                p={6}
                border="1px solid"
                borderColor="gray.200"
              >
                <Box color="notaPurple.100" mb={4}>
                  <Icon size={22} strokeWidth={2.2} />
                </Box>
                <Heading as="h3" size="sm" mb={2}>
                  {title}
                </Heading>
                <Text fontSize="sm" color="gray.600" lineHeight="tall">
                  {body}
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.400"
                  mt={3}
                  fontStyle="italic"
                >
                  {use}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        <Box>
          <SectionTitle>No crypto headache</SectionTitle>
          <Flex
            direction={{ base: "column", md: "row" }}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="20px"
            bg="brand.100"
            overflow="hidden"
          >
            {NO_CRYPTO.map(({ title, body, icon: Icon }, i) => (
              <Flex
                key={title}
                flex="1"
                direction="column"
                align="center"
                textAlign="center"
                px={6}
                py={{ base: 6, md: 8 }}
                gap={3}
                borderRightWidth={{
                  base: 0,
                  md: i < NO_CRYPTO.length - 1 ? "1px" : 0,
                }}
                borderBottomWidth={{
                  base: i < NO_CRYPTO.length - 1 ? "1px" : 0,
                  md: 0,
                }}
                borderColor="gray.200"
              >
                <Box color="notaPurple.100">
                  <Icon size={22} strokeWidth={2.2} />
                </Box>
                <Heading as="h3" size="sm">
                  {title}
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  {body}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>

        <Box
          bg="brand.100"
          borderRadius="24px"
          p={{ base: 8, md: 12 }}
          textAlign="center"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="lg" letterSpacing="-0.02em" mb={3}>
            Hold the money. Write the terms. Do the deal.
          </Heading>
          <Text color="gray.600" maxW="480px" mx="auto" mb={8}>
            Stop choosing between trust-me-up-front and trust-me-later. Denota
            is in beta, with no platform cut on your invoice.
          </Text>
          <Button
            size="lg"
            bg="brand.200"
            color="brand.100"
            borderRadius="12px"
            px={8}
            _hover={{ bg: "black" }}
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
