import {
  Box,
  Button,
  Divider,
  Flex,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { Check, ChevronDown, Coins, Plus, Search } from "lucide-react";
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

const PANEL_MAX_H = "300px";
const FULL_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const HEX_PREFIX = /^0x[a-fA-F0-9]*$/;
const CAUTION_COPY =
  "Anyone can create a token, including fakes. Verify the address before sending.";

/** One-tap shortcut chips shown above the list. */
const QUICK_PICK_CURRENCIES: NotaCurrency[] = ["USDC", "WETH", "USDT"];

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

/** A symbol that is really just a shortened 0x address (no known ticker). */
function isAddressLikeSymbol(symbol: string): boolean {
  return symbol.startsWith("0x");
}

interface Props {
  value: string;
  onChange: (token: string) => void;
}

/**
 * Token pill (icon + ticker + chevron) that opens a centered "Select a
 * token" modal. Sized to sit flush beside the amount input at equal height.
 */
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

  // Lowercase address -> currency key for the write-supported assets.
  const supportedCurrencyByAddress = useMemo(() => {
    const map = new Map<string, NotaCurrency>();
    SUPPORTED_CURRENCIES.forEach((currency) => {
      const listed = bySymbol.get(
        normalizeSymbol(tokenListSymbolForCurrency(currency))
      );
      if (listed?.address) {
        map.set(listed.address.toLowerCase(), currency);
      }
    });
    return map;
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

  const quickPickTokens = useMemo(
    () =>
      QUICK_PICK_CURRENCIES.map(
        (currency) =>
          bySymbol.get(
            normalizeSymbol(tokenListSymbolForCurrency(currency))
          ) ?? fallbackToken(currency)
      ).filter((token): token is TokenInfo => Boolean(token)),
    [bySymbol]
  );

  const toFormValue = useCallback(
    (token: TokenInfo) => {
      if (!token.address) {
        return token.symbol;
      }
      const currency = supportedCurrencyByAddress.get(
        token.address.toLowerCase()
      );
      if (currency) {
        return currency;
      }
      try {
        return ethers.utils.getAddress(token.address);
      } catch {
        return token.address;
      }
    },
    [supportedCurrencyByAddress]
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

  const isSameAsSelected = useCallback(
    (token: TokenInfo) =>
      !!selected &&
      (token.address
        ? selected.address.toLowerCase() === token.address.toLowerCase()
        : normalizeSymbol(selected.symbol) === normalizeSymbol(token.symbol)),
    [selected]
  );

  const selectToken = useCallback(
    (token: TokenInfo) => {
      // Reselecting the current token just closes the modal with no change.
      if (!isSameAsSelected(token)) {
        onChange(toFormValue(token));
      }
      handleClose();
    },
    [handleClose, isSameAsSelected, onChange, toFormValue]
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
      // Invalid input never reaches the pill; the previous selection stays.
      if (generation === importGeneration.current) {
        setImportError(result.error);
        setIsImporting(false);
      }
      return;
    }
    if (!supportedCurrencyByAddress.has(result.token.address.toLowerCase())) {
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
    supportedCurrencyByAddress,
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
    }
  };

  const checksumError =
    showImportRow && queryKind === "full-address" && !checksumValid
      ? "Invalid address checksum"
      : queryKind === "invalid-address"
        ? "Enter a valid 40-character address"
        : null;
  const inlineError = importError || checksumError;

  // Pill label: known ticker, or a truncated address for symbol-less tokens.
  const pillSymbol = selected?.symbol ?? "";
  const pillIsGeneric = !selected || isAddressLikeSymbol(pillSymbol);
  const pillLabel = selected
    ? isAddressLikeSymbol(pillSymbol) && selected.address
      ? truncateAddress(selected.address)
      : pillSymbol
    : ethers.utils.isAddress(value)
      ? truncateAddress(value)
      : "Select";

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        h="auto"
        minH={{ base: "56px", md: "50px" }}
        maxW="180px"
        borderRadius="16px"
        border="1px solid"
        borderColor={formTheme.borderDefault}
        bg="brand.400"
        px={3}
        gap={2}
        flexShrink={0}
        justifyContent="center"
        alignItems="center"
        fontWeight={700}
        transition="border-color 0.15s ease"
        _hover={{ borderColor: "notaPurple.100", bg: "brand.400" }}
        _active={{ bg: "brand.400" }}
        pointerEvents={isImporting ? "none" : "auto"}
        aria-label={
          isImporting
            ? "Resolving token"
            : selected
              ? `Change token, currently ${pillLabel}`
              : "Select token"
        }
      >
        {isImporting ? (
          <Spinner size="sm" color={formTheme.primary} />
        ) : (
          <>
            {selected && !pillIsGeneric ? (
              <TokenIcon
                token={selected}
                imported={selectedImported}
                size="26px"
              />
            ) : (
              <Flex
                w="26px"
                h="26px"
                minW="26px"
                borderRadius="full"
                align="center"
                justify="center"
                flexShrink={0}
                bg="brand.300"
                color={formTheme.muted}
              >
                <Coins size={14} />
              </Flex>
            )}
            <Text
              fontSize={{ base: "16px", md: "15px" }}
              fontWeight={700}
              color="white"
              maxW="104px"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {pillLabel}
            </Text>
            <Box display="flex" color={formTheme.muted} flexShrink={0}>
              <ChevronDown size={16} />
            </Box>
          </>
        )}
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        isCentered
        initialFocusRef={inputRef}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent
          bg="brand.400"
          border="1px solid"
          borderColor="brand.500"
          borderRadius="16px"
          mx={4}
          maxW="420px"
          color={formTheme.text}
        >
          <ModalHeader
            fontSize="17px"
            fontWeight={700}
            color={formTheme.textDark}
            pb={2}
          >
            Select a token
          </ModalHeader>
          <ModalCloseButton color={formTheme.muted} />
          <ModalBody px={3} pt={0} pb={3}>
            <Flex
              align="center"
              gap={2}
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
                  itemCount > 0
                    ? `${optionIdBase}-${highlightedIndex}`
                    : undefined
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
                px={1}
                pt={2}
                fontSize="13px"
                color={formTheme.error}
                fontWeight={500}
              >
                {inlineError}
              </Text>
            ) : null}
            {showImportRow ? (
              <Text
                px={1}
                pt={2}
                fontSize="12.5px"
                color={formTheme.mutedFaded}
                fontWeight={500}
                lineHeight="1.4"
              >
                {CAUTION_COPY}
              </Text>
            ) : (
              <Flex gap={2} mt={3} flexWrap="wrap">
                {quickPickTokens.map((token) => {
                  const active = isSameAsSelected(token);
                  return (
                    <Button
                      key={token.address || token.symbol}
                      type="button"
                      size="sm"
                      h="34px"
                      px={2.5}
                      gap={1.5}
                      borderRadius="full"
                      border="1px solid"
                      borderColor={
                        active ? formTheme.selectedBorder : "brand.500"
                      }
                      bg={active ? formTheme.selectedBgMuted : "brand.600"}
                      color={formTheme.textDark}
                      fontSize="13px"
                      fontWeight={700}
                      _hover={{ borderColor: "notaPurple.100" }}
                      _active={{ bg: "brand.600" }}
                      onClick={() => selectToken(token)}
                    >
                      <TokenIcon token={token} size="18px" />
                      {token.symbol}
                    </Button>
                  );
                })}
              </Flex>
            )}
            <Divider my={3} borderColor="brand.500" />
            <Box
              ref={listRef}
              id={`${optionIdBase}-list`}
              role="listbox"
              maxH={PANEL_MAX_H}
              overflowY="auto"
              mx={-1}
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
                      selected={isSameAsSelected(token)}
                      onHighlight={setHighlightedIndex}
                      onSelect={() => selectToken(token)}
                    />
                  );
                })
              )}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
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
      fontSize={size === "30px" ? "15px" : "12px"}
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
      borderRadius="10px"
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
      {token.address && !selected ? (
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
      {selected ? (
        <Box color={formTheme.selectedBorder} flexShrink={0} display="flex">
          <Check size={18} strokeWidth={3} />
        </Box>
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
      opacity={enabled || isImporting ? 1 : 0.55}
      borderRadius="10px"
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
          {isImporting ? "Resolving token..." : "Import token"}
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
