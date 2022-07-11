const dCheque = artifacts.require("dCheque");

module.exports = async function(deployer) {
    await deployer.deploy(dCheque)
    const dcheque = await dCheque.deployed()  // assign dCheque contract into variable to get it's address
    // deposit eth from consumer account
    // register auditor account
    // add consumer account to auditor's accepted accounts
    // add auditor's account to merchant accepted accounts
    // write check to merchant account
    // dcheque.methods
};