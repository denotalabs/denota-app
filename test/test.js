// import { ether, ETHER_ADDRESS, EVM_REVERT, wait } from './helpers'

// const dCheque = artifacts.require('./dCheque')

// require('chai')
//   .use(require('chai-as-promised'))
//   .should()

// contract('dCheque', ([deployer, user]) => {
//   let dcheque
//   beforeEach(async () => {
//     dcheque = await dCheque.new()
//   })

//   describe('testing contract...', () => {
//     describe('success', () => {
//       it('checking name', async () => {
//         expect(await dcheque.name()).to.be.eq('Decentralized Bank Currency')
//       })

//       it('checking dcheque symbol', async () => {
//         expect(await dcheque.symbol()).to.be.eq('DBC')
//       })

//       it('checking dcheque initial total supply', async () => {
//         expect(Number(await dcheque.totalSupply())).to.eq(0)
//       })


//     describe('failure', () => {
//       it('passing minter role should be rejected', async () => {
//         await dcheque.passMinterRole(user, {from: deployer}).should.be.rejectedWith(EVM_REVERT)
//       })

//       it('dcheque minting should be rejected', async () => {
//         await dcheque.mint(user, '1', {from: deployer}).should.be.rejectedWith(EVM_REVERT) //unauthorized minter
//       })
//     })
//   })

//   describe('testing deposit...', () => {
//     let balance

//     describe('success', () => {
//       beforeEach(async () => {
//         await dcheque.deposit({value: 10**16, from: user}) //0.01 ETH
//       })

//       it('balance should increase', async () => {
//         expect(Number(await dcheque.etherBalanceOf(user))).to.eq(10**16)
//       })

//       it('deposit time should > 0', async () => {
//         expect(Number(await dcheque.depositStart(user))).to.be.above(0)
//       })

//       it('deposit status should eq true', async () => {
//         expect(await dcheque.isDeposited(user)).to.eq(true)
//       })
//     })

//     describe('failure', () => {
//       it('depositing should be rejected', async () => {
//         await dcheque.deposit({value: 10**15, from: user}).should.be.rejectedWith(EVM_REVERT) //to small amount
//       })
//     })
//   })

//   describe('testing withdraw...', () => {
//     let balance

//     describe('success', () => {

//       beforeEach(async () => {
//         await dcheque.deposit({value: 10**16, from: user}) //0.01 ETH

//         await wait(2) //accruing interest

//         balance = await web3.eth.getBalance(user)
//         await dcheque.withdraw({from: user})
//       })

//       it('balances should decrease', async () => {
//         expect(Number(await web3.eth.getBalance(dcheque.address))).to.eq(0)
//         expect(Number(await dcheque.etherBalanceOf(user))).to.eq(0)
//       })

//       it('user should receive ether back', async () => {
//         expect(Number(await web3.eth.getBalance(user))).to.be.above(Number(balance))
//       })

//       it('user should receive proper amount of interest', async () => {
//         //time synchronization problem make us check the 1-3s range for 2s deposit time
//         balance = Number(await dcheque.balanceOf(user))
//         expect(balance).to.be.above(0)
//         expect(balance%interestPerSecond).to.eq(0)
//         expect(balance).to.be.below(interestPerSecond*4)
//       })

//       it('depositer data should be reseted', async () => {
//         expect(Number(await dcheque.depositStart(user))).to.eq(0)
//         expect(Number(await dcheque.etherBalanceOf(user))).to.eq(0)
//         expect(await dcheque.isDeposited(user)).to.eq(false)
//       })
//     })

//     describe('failure', () => {
//       it('withdrawing should be rejected', async () =>{
//         await dcheque.deposit({value: 10**16, from: user}) //0.01 ETH
//         await dcheque.withdraw({from: deployer}).should.be.rejectedWith(EVM_REVERT) //wrong user
//       })
//     })
//   })
// })