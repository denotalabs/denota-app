import React from "react";
import { useState } from "react";
import { Form } from "react-bootstrap";
import type { BlockchainData } from "../hooks/useBlockchainData";

interface Props {
  blockchainState: BlockchainData;
}
function AuditorsTab({ blockchainState }: Props) {
  const [userType2, setUserType2] = useState<any>("");
  const [userType3, setUserType3] = useState("");
  const [acceptedAddress, setAcceptedAddress] = useState("");

  const userAuditors = blockchainState.acceptedUserAuditors.map((auditor) => (
    <li key={auditor}>{auditor.slice(2, 10)}...</li>
  ));
  const auditorUsers = blockchainState.acceptedAuditorUsers.map((user) => (
    <li key={user}>{user.slice(2, 10)}...</li>
  ));

  return (
    <div>
      <br></br>
      You are a(n) _ and adding account for...
      <br></br>
      <br></br>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          if (userType2.checked) {
            // user accepts this auditor
            blockchainState.cheq?.acceptAuditor(acceptedAddress);
          } else {
            // auditor accepts this user
            blockchainState.cheq?.acceptUser(acceptedAddress);
            blockchainState.cheq?.setAllowedDuration(60 * 60 * 24 * 7);
          }
        }}
      >
        <div key={`inline-${"radio"}`} className="mb-3">
          <Form.Check
            ref={(input: any) => {
              setUserType2(input);
            }}
            defaultChecked={true}
            inline
            label="User"
            value="1"
            name="group1"
            type={"radio"}
            id={`inline-${"radio"}-2`}
          />
          <Form.Check
            ref={(input: any) => {
              setUserType3(input);
            }}
            inline
            label="Auditor"
            value="2"
            name="group1"
            type={"radio"}
            id={`inline-${"radio"}-3`}
          />
        </div>
        <input
          id="acceptedAddress"
          type="text"
          className="form-control form-control-md mt-2"
          placeholder="Address..."
          required
          onChange={(e) => {
            setAcceptedAddress(e.target.value);
          }}
        />
        <div>
          <button type="submit" className="btn btn-primary mt-3">
            Add Address
          </button>
        </div>
      </Form>
      <br></br>
      Your Auditors: {userAuditors}
      <br></br>
      Your Users: {auditorUsers}
    </div>
  );
}
export default AuditorsTab;
