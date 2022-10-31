import { Field } from "formik";
import { FormControl, FormErrorMessage, Input } from "@chakra-ui/react";
// import { ethers } from "ethers";
// import { useState } from "react";

interface Props {
  fieldName: string;
  placeholder: string;
}

function AccountField({ fieldName, placeholder }: Props) {
  // const url = "https://eth-mainnet.gateway.pokt.network/v1/5f3453978e354ab992c4da79"
  // const provider = new ethers.providers.JsonRpcProvider(url);

  // const [useMerchant, useSetMerchant] = useState("")

  // function validateAddress(value: string) {
  //   if (value.slice(-4)==".eth"){
  //     // provider.resolveName(value).then((address)=>{
  //     //   if (address){
  //     //     console.log(address, "true")
  //     //     return
  //     //   } else{
  //     //     console.log(address, "false")
  //     //     return "Invalid Address"
  //     //   }
  //     // })
  //     useSetMerchant("")
  //     return "Not Supported Yet"
  //   } else{
  //     if (ethers.utils.isAddress(value)){
  //       useSetMerchant(value)
  //       return
  //     } else{
  //       useSetMerchant("")
  //       return "Invalid Address"
  //     }
  //   }
  // }
  return (
    <Field
      name={fieldName}
      // validate={validateAddress}
    >
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.name && touched.name}>
          <Input {...field} placeholder={placeholder} />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default AccountField;
