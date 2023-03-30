import { Box, BoxProps } from "@chakra-ui/react";
import { motion, MotionProps, Transition } from "framer-motion";

type MotionBoxProps = Omit<BoxProps & MotionProps, "transition"> & {
  transition?: Transition;
};

export const MotionBox: React.FC<MotionBoxProps> = motion(Box);
