import { Field } from "formik";
import { FormControl, FormErrorMessage, Input, Select } from "@chakra-ui/react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useHandshakes } from "../../hooks/useHandshakes";

interface Props {
  fieldName: string;
  placeholder: string;
}

function AuditorField({ fieldName, placeholder }: Props) {
  const blockchainState = useBlockchainData();
  // const handshakeData = useHandshakes(true);

  let auditorSelect: any; // Validate merchant address, pull their handshakes, compare handshakes and yield intersection
  if (!blockchainState) {
    auditorSelect = (
      <Field
        name={fieldName}
        // validate={validateAddress}
      >
        {({ field, form: { errors, touched } }: any) => (
          <FormControl isInvalid={errors.name && touched.name}>
            <Select {...field} placeholder={placeholder}></Select>
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>
        )}
      </Field>
    );
  } else {
    // if (!handshakeData) {
    auditorSelect = (
      <Field
        name={fieldName}
        // validate={validateAddress}
      >
        {({ field, form: { errors, touched } }: any) => (
          <FormControl isInvalid={errors.name && touched.name}>
            <Select {...field} placeholder={placeholder}>
              <option value={blockchainState.account}>
                {blockchainState.account.slice(0, 10)}..
              </option>
            </Select>
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>
        )}
      </Field>
    );
  }

  return auditorSelect;
}

export default AuditorField;

// else {
//   auditorSelect = (
//     <div>
//       <Select>
//         <option id="reviewer" value={blockchainState.account}>
//           {blockchainState.account.slice(0, 10)}..
//         </option>
//         {/* {handshakeData["completed"].map((handshake: any) => {
//           <option id="reviewer" value={handshake}>
//             {handshake}
//           </option>; */}
//         })}
//       </Select>
//     </div>
// );
// }
