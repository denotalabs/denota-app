const dCheque = artifacts.require("dCheque");

module.exports = async function(deployer) {
    await deployer.deploy(dCheque)
	//assign dCheque contract into variable to get it's address
    const dcheque = await dCheque.deployed()
    // deposit eth from consumer account
    // register auditor account
    // add consumer account to auditor's accepted accounts
    // add auditor's account to merchant accepted accounts
    // write check to merchant account
    // dcheque.methods
};