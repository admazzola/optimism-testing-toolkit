/**
 * @type import('hardhat/config').HardhatUserConfig
 */

 require("@eth-optimism/hardhat-ovm")

module.exports = {
    ovm: {
        solcVersion: '0.5.16' // Your version goes here.
    }
}