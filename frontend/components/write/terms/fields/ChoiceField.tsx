import { Box, Select, Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { useLayoutEffect, useRef, useState } from "react";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { FormInputWrap } from "../../../designSystem/form/FormInputWrap";
import { SegmentedControl } from "../../../designSystem/form/SegmentedControl";
import { formTheme } from "../../../designSystem/form/formTheme";
import { FieldLabel } from "./FieldChrome";

export interface ChoiceOption<V extends string> {
  value: V;
  label: string;
  /** One line shown under the group while this option is selected. */
  description?: string;
  /** Maturity label, e.g. "Coming soon". Selectable, but marks a dead end. */
  tag?: string | null;
  /** Greyed out and not selectable. */
  disabled?: boolean;
}

interface Props<K extends keyof PaymentTermsValues, V extends string> {
  name: K;
  label: string;
  tooltip?: string;
  options: ChoiceOption<V>[];
  /**
   * `auto` becomes a dropdown when the bar cannot fit on one row.
   * `segments` always uses a segmented control.
   */
  layout?: "auto" | "segments";
  /** Called after the value changes, for dependent-field resets. */
  onChange?: (value: V) => void;
}

function optionSignature<V extends string>(options: ChoiceOption<V>[]): string {
  return options
    .map((option) => `${option.value}:${option.label}:${option.tag ?? ""}`)
    .join("|");
}

function optionSelectLabel<V extends string>(option: ChoiceOption<V>): string {
  return option.tag ? `${option.label} (${option.tag})` : option.label;
}

/**
 * A question with segmented answers. By default, if the bar cannot fit on one
 * row it becomes a dropdown. Pass `layout="segments"` to keep a segmented
 * control. Only the selected answer's description shows.
 */
export function ChoiceField<
  K extends keyof PaymentTermsValues,
  V extends PaymentTermsValues[K] & string
>({ name, label, tooltip, options, layout = "auto", onChange }: Props<K, V>) {
  const { values, setFieldValue } = useFormikContext<PaymentTermsValues>();
  const current = values[name] as V;
  const selected = options.find((option) => option.value === current);
  const id = `terms-${String(name)}`;
  const alwaysSegments = layout === "segments";

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(true);
  const signature = optionSignature(options);

  useLayoutEffect(() => {
    if (alwaysSegments) {
      return;
    }
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) {
      return;
    }

    const update = () => {
      if (container.clientWidth === 0) {
        return;
      }
      setFits(measure.scrollWidth <= container.clientWidth + 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [alwaysSegments, signature]);

  const handleChange = (value: V) => {
    if (value === current) {
      return;
    }
    if (options.find((option) => option.value === value)?.disabled) {
      return;
    }
    setFieldValue(name, value);
    onChange?.(value);
  };

  const showSegments = alwaysSegments || fits;

  return (
    <Box>
      <FieldLabel htmlFor={showSegments ? undefined : id} tooltip={tooltip}>
        {label}
      </FieldLabel>
      <Box ref={containerRef} position="relative" w="100%">
        {alwaysSegments ? null : (
          <Box
            position="absolute"
            overflow="hidden"
            w={0}
            h={0}
            pointerEvents="none"
            aria-hidden
          >
            <Box ref={measureRef} w="max-content">
              <SegmentedControl
                name={`${String(name)}-measure`}
                value={current}
                options={options}
                onChange={() => undefined}
                layout="intrinsic"
                inert
              />
            </Box>
          </Box>
        )}
        {showSegments ? (
          <SegmentedControl
            name={String(name)}
            value={current}
            options={options}
            onChange={handleChange}
            aria-label={label}
          />
        ) : (
          <FormInputWrap>
            <Select
              id={id}
              value={current}
              aria-label={label}
              variant="unstyled"
              flex={1}
              minW={0}
              w="100%"
              h={{ base: "54px", md: "48px" }}
              fontSize={{ base: "16px", md: "15px" }}
              fontWeight={600}
              color={formTheme.text}
              iconSize="16px"
              onChange={(event) => handleChange(event.target.value as V)}
            >
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {optionSelectLabel(option)}
                </option>
              ))}
            </Select>
          </FormInputWrap>
        )}
      </Box>
      {selected?.description ? (
        <Text
          mt={2}
          fontSize="13px"
          lineHeight={1.5}
          color={formTheme.mutedLight}
        >
          {selected.description}
        </Text>
      ) : null}
    </Box>
  );
}
