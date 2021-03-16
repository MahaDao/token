var Timelock = artifacts.require("TImelock")
var MahaToken = artifacts.require("MahaToken")


module.exports = async function (deployer) {
  const mahaToken = await MahaToken.deployed()

  const unlockTimestamp = Math.floor(Date.now() + 60 * 60)

  deployer.deploy(Timelock, mahaToken.address, unlockTimestamp)
};
