require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    goerli: {
      url: 'https://eth-goerli.g.alchemy.com/v2/ZshCE5mAKP3KsR3oJ9A269SycASWndiQ',
      accounts: ['prk_your_account'],
    },
  },
};