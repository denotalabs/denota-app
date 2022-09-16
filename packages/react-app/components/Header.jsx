import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://cheq.finance" target="_blank" rel="noopener noreferrer">
      <PageHeader
        // className="site-page-header"
        title="Cheq Protocol"
        subTitle="Trust Enabled Crypto Payments"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
