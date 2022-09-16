const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("My Dapp", function () {
  let myContract;

  describe("Cheq", function () {
    it("Should deploy Cheq", async function () {
      const YourContract = await ethers.getContractFactory("Cheq");

      myContract = await YourContract.deploy();
    });
  });
});
