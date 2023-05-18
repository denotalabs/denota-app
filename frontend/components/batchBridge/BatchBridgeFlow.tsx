import Stepper from "../designSystem/stepper/Stepper";

interface Props {
  onClose?: () => void;
}

export function WriteNotaFlow({ onClose }: Props) {
  return (
    <Stepper onClose={onClose}>
      <></>
    </Stepper>
  );
}
