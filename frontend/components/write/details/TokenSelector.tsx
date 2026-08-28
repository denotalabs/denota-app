import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { AlertTriangle, ChevronDown, Plus, Search } from "lucide-react";
import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { DEFAULT_CHAIN_ID } from "../../../context/config/chains";
import type { TokenInfo } from "../../../context/config/tokenList";
import {
  normalizeSymbol,
  useTokenList,
} from "../../../context/TokenListProvider";
import { useTokenBalance } from "../../../hooks/useTokenBalance";
import { truncateAddress } from "../../../utils/address";
import { fetchErc20Metadata } from "../../../utils/erc20Metadata";
import {
  currencyForSymbol,
  currencyGlyphs,
  displayNameForCurrency,
  NotaCurrency,
  SUPPORTED_CURRENCIES,
  tokenListSymbolForCurrency,
} from "../../designSystem/CurrencyIcon";
import { formTheme } from "../../designSystem/form/formTheme";

const PANEL_MAX_H = "260px";
const FULL_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const HEX_PREFIX = /^0x[a-fA-F0-9]*$/;
const CAUTION_COPY =
  "Anyone can create a token, including fakes. Verify the address before sending.";

type QueryKind =
  | "text"
  | "partial-address"
  | "full-address"
  | "invalid-address";

function classifyQuery(raw: string): QueryKind {
  const query = raw.trim();
  if (!query.startsWith("0x") || !HEX_PREFIX.test(query)) {
    return "text";
  }
  if (query.length < 42) {
    return "partial-address";
  }
  if (FULL_ADDRESS.test(query)) {
    return "full-address";
  }
  return "invalid-address";
}

function tokenFromValue(
  value: string,
  byAddress: Map<string, TokenInfo>,
  bySymbol: Map<string, TokenInfo>
): TokenInfo | undefined {
  if (!value) {
    return undefined;
  }
  if (ethers.utils.isAddress(value)) {
    return byAddress.get(value.toLowerCase());
  }
  return (
    bySymbol.get(
      normalizeSymbol(tokenListSymbolForCurrency(value as NotaCurrency))
    ) ?? bySymbol.get(normalizeSymbol(value))
  );
}

function fallbackToken(value: string): TokenInfo | undefined {
  const currency = value as NotaCurrency;
  if (
    !SUPPORTED_CURRENCIES.includes(currency) &&
    currency !== "ETH" &&
    currency !== "USDCE"
  ) {
    return undefined;
  }
  const label = displayNameForCurrency(currency);
  return {
    chainId: 0,
    address: "",
    name: label,
    symbol: label,
    decimals: 18,
  };
}

interface Props {
  value: string;
  onChange: (token: string) => void;
}

export function TokenSelector({ value, onChange }: Props) {
  const { blockchainState } = useBlockchainData();
  const chainId = blockchainState.chainIdNumber || DEFAULT_CHAIN_ID;
  const {
    tokens,
    byAddress,
    bySymbol,
    isLoading,
    importedAddresses,
    addCustomToken,
  } = useTokenList();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const importGeneration = useRef(0);
  const optionIdBase = useId();
  const balance = useTokenBalance(value);

  const supportedAddresses = useMemo(() => {
    const addresses = new Set<string>();
    SUPPORTED_CURRENCIES.forEach((currency) => {
      const listed = bySymbol.get(
        normalizeSymbol(tokenListSymbolForCurrency(currency))
      );
      if (listed?.address) {
        addresses.add(listed.address.toLowerCase());
      }
    });
    return addresses;
  }, [bySymbol]);

  // Only the write-supported assets and user-imported tokens — not the hosted list.
  const dropdownTokens = useMemo(() => {
    const result: TokenInfo[] = [];
    const seen = new Set<string>();

    SUPPORTED_CURRENCIES.forEach((currency) => {
      const listed = bySymbol.get(
        normalizeSymbol(tokenListSymbolForCurrency(currency))
      );
      if (listed?.address) {
        const key = listed.address.toLowerCase();
        seen.add(key);
        result.push(listed);
        return;
      }
      const fallback = fallbackToken(currency);
      if (fallback) {
        result.push(fallback);
      }
    });

    tokens.forEach((token) => {
      if (!importedAddresses.has(token.address.toLowerCase())) {
        return;
      }
      const key = token.address.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      result.push(token);
    });

    return result;
  }, [bySymbol, importedAddresses, tokens]);

  const toFormValue = useCallback(
    (token: TokenInfo) => {
      if (
        token.address &&
        supportedAddresses.has(token.address.toLowerCase())
      ) {
        const currency = SUPPORTED_CURRENCIES.find((item) => {
          const listed = bySymbol.get(
            normalizeSymbol(tokenListSymbolForCurrency(item))
          );
          return listed?.address.toLowerCase() === token.address.toLowerCase();
        });
        if (currency) {
          return currency;
        }
      }
      try {
        return ethers.utils.getAddress(token.address);
      } catch {
        return token.address;
      }
    },
    [bySymbol, supportedAddresses]
  );

  const selected =
    tokenFromValue(value, byAddress, bySymbol) ?? fallbackToken(value);
  const selectedImported = Boolean(
    selected?.address &&
    importedAddresses.has(selected.address.toLowerCase())
  );

  const queryKind = classifyQuery(query);
  const trimmedQuery = query.trim();
  const matchingKnown =
    queryKind === "full-address"
      ? dropdownTokens.find(
        (token) =>
          !!token.address &&
          token.address.toLowerCase() === trimmedQuery.toLowerCase()
      )
      : undefined;
  const showImportRow =
    (queryKind === "partial-address" ||
      queryKind === "full-address" ||
      queryKind === "invalid-address") &&
    !matchingKnown;
  const checksumValid =
    queryKind === "full-address" && ethers.utils.isAddress(trimmedQuery);
  const canImport = showImportRow && checksumValid && !isImporting;

  const visibleTokens = useMemo(() => {
    if (showImportRow) {
      return [];
    }
    if (matchingKnown) {
      return [matchingKnown];
    }

    const ranked = [...dropdownTokens];

    const q = trimmedQuery.toLowerCase();
    if (!q || queryKind !== "text") {
      return ranked;
    }

    const matched = ranked.filter(
      (token) =>
        token.symbol.toLowerCase().includes(q) ||
        token.name.toLowerCase().includes(q)
    );
    return matched.sort((a, b) => {
      const prefix = (token: TokenInfo) =>
        token.symbol.toLowerCase().startsWith(q) ? 0 : 1;
      const prefixDiff = prefix(a) - prefix(b);
      if (prefixDiff !== 0) {
        return prefixDiff;
      }
      return a.symbol.localeCompare(b.symbol);
    });
  }, [
    dropdownTokens,
    matchingKnown,
    queryKind,
    showImportRow,
    trimmedQuery,
  ]);

  const itemCount = showImportRow ? 1 : visibleTokens.length;

  useEffect(() => {
    setHighlightedIndex(0);
    setImportError(null);
  }, [query, showImportRow]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const option = listRef.current?.querySelector(
      `[data-index="${highlightedIndex}"]`
    );
    option?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, isOpen]);

  const handleClose = useCallback(() => {
    importGeneration.current += 1;
    setIsOpen(false);
    setQuery("");
    setHighlightedIndex(0);
    setImportError(null);
    setIsImporting(false);
  }, []);

  const selectToken = useCallback(
    (token: TokenInfo) => {
      onChange(toFormValue(token));
      handleClose();
    },
    [handleClose, onChange, toFormValue]
  );

  const importToken = useCallback(async () => {
    if (!canImport) {
      return;
    }
    setIsImporting(true);
    setImportError(null);
    const generation = importGeneration.current;
    const result = await fetchErc20Metadata(
      trimmedQuery,
      chainId,
      blockchainState.signer?.provider ?? null
    );
    if (result.ok === false) {
      if (generation === importGeneration.current) {
        setImportError(result.error);
        setIsImporting(false);
      }
      return;
    }
    if (!supportedAddresses.has(result.token.address.toLowerCase())) {
      addCustomToken(result.token);
    }
    onChange(toFormValue(result.token));
    if (generation !== importGeneration.current) {
      return;
    }
    setIsImporting(false);
    handleClose();
  }, [
    addCustomToken,
    blockchainState.signer,
    canImport,
    chainId,
    handleClose,
    onChange,
    supportedAddresses,
    toFormValue,
    trimmedQuery,
  ]);

  const selectHighlighted = useCallback(() => {
    if (showImportRow) {
      void importToken();
      return;
    }
    const token = visibleTokens[highlightedIndex];
    if (token) {
      selectToken(token);
    }
  }, [
    highlightedIndex,
    importToken,
    selectToken,
    showImportRow,
    visibleTokens,
  ]);

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        itemCount === 0 ? 0 : Math.min(index + 1, itemCount - 1)
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      selectHighlighted();
    } else if (event.key === "Escape") {
      event.preventDefault();
      handleClose();
    }
  };

  const formattedBalance =
    balance !== null
      ? Number(balance).toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })
      : null;

  const checksumError =
    showImportRow && queryKind === "full-address" && !checksumValid
      ? "Invalid address checksum"
      : queryKind === "invalid-address"
        ? "Enter a valid 40-character address"
        : null;
  const inlineError = importError || checksumError;

  return (
    <Box>
      <Popover
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={handleClose}
        placement="bottom-start"
        matchWidth
        gutter={6}
        initialFocusRef={inputRef}
        isLazy
      >
        <PopoverTrigger>
          <Button
            type="button"
            w="100%"
            h="auto"
            minH={{ base: "56px", md: "50px" }}
            borderRadius="16px"
            border="1px solid"
            borderColor={isOpen ? "notaPurple.100" : formTheme.borderDefault}
            bg="brand.600"
            px={{ base: 4, md: 3 }}
            py={2}
            justifyContent="space-between"
            alignItems="center"
            gap={3}
            fontWeight={600}
            _hover={{ borderColor: "notaPurple.100", bg: "brand.600" }}
            _active={{ bg: "brand.600" }}
            aria-label={
              selected
                ? `Selected token ${selected.symbol}`
                : "Select token"
            }
          >
            <Flex align="center" gap={3} minW={0} flex={1}>
              {selected ? (
                <TokenIcon token={selected} imported={selectedImported} />
              ) : (
                <Flex
                  w="30px"
                  h="30px"
                  borderRadius="full"
                  bg="brand.500"
                  flexShrink={0}
                />
              )}
              <Box minW={0} textAlign="left">
                <Text
                  fontSize={{ base: "16px", md: "15px" }}
                  fontWeight={700}
                  color={formTheme.textDark}
                  noOfLines={1}
                >
                  {selected?.symbol ?? "Select token"}
                </Text>
                {selected?.name && selected.name !== selected.symbol ? (
                  <Text
                    fontSize="12.5px"
                    color={formTheme.muted}
                    fontWeight={500}
                    noOfLines={1}
                  >
                    {selected.name}
                  </Text>
                ) : null}
              </Box>
            </Flex>
            <Flex align="center" gap={2} flexShrink={0}>
              {/* {formattedBalance ? (
                <Text
                  fontSize="12.5px"
                  color={formTheme.muted}
                  fontWeight={600}
                >
                  {100000000}
                </Text>
              ) : null} */}
              <Box
                display="flex"
                color={formTheme.muted}
                transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
                transition="transform 0.15s ease"
              >
                <ChevronDown size={18} />
              </Box>
            </Flex>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          w="100%"
          maxW="100%"
          bg="brand.400"
          border="1px solid"
          borderColor="brand.500"
          borderRadius="16px"
          overflow="hidden"
          _focus={{ outline: "none", boxShadow: "none" }}
          boxShadow="lg"
        >
          <Flex
            align="center"
            gap={2}
            mx={2}
            mt={2}
            mb={1}
            px={3}
            minH="44px"
            bg="brand.600"
            border="1px solid"
            borderColor="brand.500"
            borderRadius="12px"
          >
            <Box color={formTheme.muted} display="flex" flexShrink={0}>
              <Search size={16} />
            </Box>
            <Input
              ref={inputRef}
              variant="unstyled"
              flex={1}
              minW={0}
              h="44px"
              fontSize="15px"
              color={formTheme.text}
              placeholder="Search name or paste address"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={query}
              role="combobox"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls={`${optionIdBase}-list`}
              aria-activedescendant={
                itemCount > 0 ? `${optionIdBase}-${highlightedIndex}` : undefined
              }
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              sx={{
                "&::placeholder": { color: formTheme.placeholder },
              }}
            />
          </Flex>
          {inlineError ? (
            <Text
              px={4}
              pt={1}
              pb={1}
              fontSize="13px"
              color={formTheme.error}
              fontWeight={500}
            >
              {inlineError}
            </Text>
          ) : null}
          <Box
            ref={listRef}
            id={`${optionIdBase}-list`}
            role="listbox"
            maxH={PANEL_MAX_H}
            overflowY="auto"
            py={1}
          >
            {isLoading && tokens.length === 0 && !showImportRow ? (
              <Flex align="center" justify="center" gap={2} py={6}>
                <Spinner size="sm" color={formTheme.primary} />
                <Text fontSize="sm" color={formTheme.muted}>
                  Loading tokens...
                </Text>
              </Flex>
            ) : showImportRow ? (
              <ImportRow
                id={`${optionIdBase}-0`}
                highlighted={highlightedIndex === 0}
                canImport={canImport}
                isImporting={isImporting}
                address={checksumValid ? trimmedQuery : undefined}
                onSelect={() => {
                  void importToken();
                }}
              />
            ) : visibleTokens.length === 0 ? (
              <Text
                px={4}
                py={5}
                fontSize="sm"
                color={formTheme.muted}
                textAlign="center"
              >
                No tokens found
              </Text>
            ) : (
              visibleTokens.map((token, index) => {
                const imported = importedAddresses.has(
                  token.address.toLowerCase()
                );
                return (
                  <TokenRow
                    key={token.address || token.symbol}
                    id={`${optionIdBase}-${index}`}
                    index={index}
                    token={token}
                    imported={imported}
                    highlighted={index === highlightedIndex}
                    selected={
                      !!selected?.address &&
                      selected.address.toLowerCase() ===
                      token.address.toLowerCase()
                    }
                    onHighlight={setHighlightedIndex}
                    onSelect={() => selectToken(token)}
                  />
                );
              })
            )}
          </Box>
        </PopoverContent>
      </Popover>
      {selectedImported && selected?.address ? (
        <Flex
          mt={2.5}
          gap={2.5}
          align="flex-start"
          px={3}
          py={2.5}
          borderRadius="12px"
          border="1px solid"
          borderColor="brand.500"
          bg="brand.600"
        >
          <Box color={formTheme.primary} mt="1px" flexShrink={0}>
            <AlertTriangle size={15} />
          </Box>
          <Box minW={0}>
            <Text
              fontSize="12.5px"
              color={formTheme.mutedLight}
              fontWeight={500}
              lineHeight="1.4"
            >
              {CAUTION_COPY}
            </Text>
            <Text
              mt={1}
              fontSize="12px"
              color={formTheme.muted}
              fontWeight={600}
              fontFamily="mono"
            >
              {truncateAddress(selected.address)}
            </Text>
          </Box>
        </Flex>
      ) : null}
    </Box>
  );
}

function TokenIcon({
  token,
  imported,
  size = "30px",
}: {
  token: TokenInfo;
  imported?: boolean;
  size?: string;
}) {
  const [failed, setFailed] = useState(false);
  const currency = currencyForSymbol(normalizeSymbol(token.symbol));
  const logoURI = !failed && !imported ? token.logoURI : undefined;
  const glyph = !imported ? currencyGlyphs[currency] : undefined;

  if (logoURI) {
    return (
      <Image
        src={logoURI}
        alt=""
        boxSize={size}
        minW={size}
        borderRadius="full"
        objectFit="cover"
        flexShrink={0}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Flex
      w={size}
      h={size}
      minW={size}
      borderRadius="full"
      align="center"
      justify="center"
      fontSize={size === "30px" ? "15px" : "13px"}
      fontWeight={700}
      flexShrink={0}
      bg={glyph?.color ?? "brand.200"}
      color={glyph?.dark ? "#111" : "white"}
    >
      {glyph?.glyph ?? (token.symbol || "?").charAt(0).toUpperCase()}
    </Flex>
  );
}

function TokenRow({
  id,
  index,
  token,
  imported,
  highlighted,
  selected,
  onHighlight,
  onSelect,
}: {
  id: string;
  index: number;
  token: TokenInfo;
  imported: boolean;
  highlighted: boolean;
  selected: boolean;
  onHighlight: (index: number) => void;
  onSelect: () => void;
}) {
  return (
    <Flex
      id={id}
      data-index={index}
      role="option"
      aria-selected={selected}
      align="center"
      gap={3}
      px={3}
      py={2}
      minH="48px"
      cursor="pointer"
      bg={highlighted ? "brand.300" : "transparent"}
      _hover={{ bg: "brand.300" }}
      onMouseEnter={() => onHighlight(index)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
    >
      <TokenIcon token={token} imported={imported} />
      <Box minW={0} flex={1}>
        <Flex align="center" gap={1.5}>
          <Text
            fontSize="15px"
            fontWeight={700}
            color={formTheme.textDark}
            noOfLines={1}
          >
            {token.symbol}
          </Text>
          {imported ? (
            <Text
              fontSize="11px"
              fontWeight={600}
              color={formTheme.muted}
              flexShrink={0}
            >
              Unverified
            </Text>
          ) : null}
        </Flex>
        <Text
          fontSize="12.5px"
          color={formTheme.muted}
          fontWeight={500}
          noOfLines={1}
        >
          {token.name}
        </Text>
      </Box>
      {token.address ? (
        <Text
          fontSize="12px"
          color={formTheme.mutedFaded}
          fontWeight={600}
          fontFamily="mono"
          flexShrink={0}
        >
          {truncateAddress(token.address)}
        </Text>
      ) : null}
    </Flex>
  );
}

function ImportRow({
  id,
  highlighted,
  canImport,
  isImporting,
  address,
  onSelect,
}: {
  id: string;
  highlighted: boolean;
  canImport: boolean;
  isImporting: boolean;
  address?: string;
  onSelect: () => void;
}) {
  const enabled = canImport && !isImporting;
  return (
    <Flex
      id={id}
      data-index={0}
      role="option"
      aria-selected={false}
      aria-disabled={!enabled}
      align="center"
      gap={3}
      px={3}
      py={2.5}
      minH="52px"
      cursor={enabled ? "pointer" : "not-allowed"}
      opacity={enabled ? 1 : 0.55}
      bg={highlighted && enabled ? "brand.300" : "transparent"}
      _hover={enabled ? { bg: "brand.300" } : undefined}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        if (enabled) {
          onSelect();
        }
      }}
    >
      <Flex
        w="30px"
        h="30px"
        borderRadius="full"
        align="center"
        justify="center"
        flexShrink={0}
        bg="brand.300"
        color={formTheme.primary}
      >
        {isImporting ? <Spinner size="sm" /> : <Plus size={16} />}
      </Flex>
      <Box minW={0} flex={1}>
        <Text
          fontSize="15px"
          fontWeight={700}
          color={formTheme.textDark}
          noOfLines={1}
        >
          Import token
        </Text>
        <Text
          fontSize="12.5px"
          color={formTheme.muted}
          fontWeight={500}
          noOfLines={1}
        >
          {address
            ? truncateAddress(address)
            : "Enter a full address"}
        </Text>
      </Box>
      {enabled ? (
        <Text
          fontSize="13px"
          fontWeight={700}
          color={formTheme.primary}
          flexShrink={0}
        >
          Import
        </Text>
      ) : null}
    </Flex>
  );
}
