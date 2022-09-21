import { useState } from "react";

import { Form } from "react-bootstrap";
import { Button, Input, Box, Flex } from "@chakra-ui/react";
import type { BlockchainData } from "../hooks/useBlockchainData";

interface Props {
  blockchainState: BlockchainData;
}
function AuditorsTab({ blockchainState }: Props) {
  const [userType2, setUserType2] = useState<any>("");
  const [userType3, setUserType3] = useState("");
  const [auditorAddress, setAuditorAddress] = useState("");
  const [userAddress, setUserAddress] = useState("");

  const userAuditors = (
    <Box
      p={6}
      maxW={"455px"}
      w={"full"}
      boxShadow="sm"
      rounded={"lg"}
      borderWidth="1px"
      borderRadius="lg"
      zIndex={1}
    >
      0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
    </Box>
  );

  // const userAuditors = blockchainState.acceptedUserAuditors.map((auditor) => (
  //   <li key={auditor}>{auditor.slice(2, 10)}...</li>
  // ));
  // const auditorUsers = blockchainState.acceptedAuditorUsers.map((user) => (
  //   <li key={user}>{user.slice(2, 10)}...</li>
  // ));
  return (
    <div>
      <br></br>
      Your Auditors:
      <br></br>
      <br></br>
      {userAuditors}
      <br></br>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          if (userType2.checked) {
            blockchainState.cheq?.acceptAuditor(auditorAddress, true);
          } else {
            blockchainState.cheq?.acceptAuditor(auditorAddress, false);
          }
        }}
      >
        <div key={`inline-${"radio"}`} className="mb-3">
          Add or Remove Auditor:<br></br>
          <br></br>
          <Form.Check
            ref={(input: any) => {
              setUserType2(input);
            }}
            defaultChecked={true}
            label="Add"
            value="1"
            name="group1"
            type={"radio"}
            id={`inline-${"radio"}-2`}
          />
          <Form.Check
            ref={(input: any) => {
              setUserType3(input);
            }}
            label="Remove"
            value="2"
            name="group1"
            type={"radio"}
            id={`inline-${"radio"}-3`}
          />
        </div>
        <br></br>
        <Flex>
          <Input
            id="auditorAddress"
            type="text"
            className="form-control form-control-md mt-2"
            placeholder="Address..."
            required
            onChange={(e) => {
              setAuditorAddress(e.target.value);
            }}
          />
        </Flex>
        <div>
          <Button mt={4} type="submit">
            {" "}
            {/*isLoading={props.isSubmitting}*/}
            Update
          </Button>
        </div>
      </Form>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          if (userType2.checked) {
            blockchainState.cheq?.acceptUser(userAddress, true);
          } else {
            blockchainState.cheq?.acceptUser(userAddress, false);
          }
        }}
      >
        <div key={`inline-${"radio"}`} className="mb-3">
          Add or Remove User:<br></br>
          <br></br>
          <Form.Check
            ref={(input: any) => {
              setUserType2(input);
            }}
            defaultChecked={true}
            label="Add"
            value="1"
            name="group1"
            type={"radio"}
            id={`inline-${"radio"}-2`}
          />
          <Form.Check
            ref={(input: any) => {
              setUserType3(input);
            }}
            label="Remove"
            value="2"
            name="group1"
            type={"radio"}
            id={`inline-${"radio"}-3`}
          />
        </div>
        <br></br>
        <Flex>
          <Input
            id="userAddress"
            type="text"
            className="form-control form-control-md mt-2"
            placeholder="Address..."
            required
            onChange={(e) => {
              setUserAddress(e.target.value);
            }}
          />
        </Flex>
        <div>
          <Button mt={4} type="submit">
            {" "}
            {/*isLoading={props.isSubmitting}*/}
            Update
          </Button>
        </div>
      </Form>
    </div>
  );
}
export default AuditorsTab;
