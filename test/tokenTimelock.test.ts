import "@nomiclabs/hardhat-ethers"

import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Contract, ContractFactory, BigNumber, utils } from 'ethers'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

import { advanceTimeAndBlock } from './utilities'



chai.use(solidity)


describe('Timelock', async () => {
  const ROLE = '0x00'
  const MINTER_ROLE = 'MINTER_ROLE'
  const unlockTimestamp = Math.floor(Date.now() / 1000) + 60

  const { provider } = ethers

  let ant: SignerWithAddress
  let owner: SignerWithAddress

  let token: Contract
  let timelock: Contract

  const Token: ContractFactory = await ethers.getContractFactory('MahaToken')
  const Timelock: ContractFactory = await ethers.getContractFactory('Timelock')

  before('Provider & accounts setting', async () => {
    [owner, ant] = await ethers.getSigners()
  });

  it('Should give DEFAULT_ADMIN_ROLE to timelocks', async function () {
    token = await Token.connect(owner).deploy()
    timelock = await Timelock.connect(owner).deploy(token.address, unlockTimestamp)

    await token.connect(owner).grantRole(ROLE, timelock.address)

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
  })

  it('Should give DEFAULT_ADMIN_ROLE to timelocks and revoke for self', async function () {
    token = await Token.connect(owner).deploy()
    timelock = await Timelock.connect(owner).deploy(token.address, unlockTimestamp)

    await token.connect(owner).grantRole(ROLE, timelock.address)
    await token.connect(owner).revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)
    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
  })

  it('Should not allow giving DEFAULT_ADMIN_ROLE to timelock owner before unlockTimestamp', async function () {
    token = await Token.connect(owner).deploy()
    timelock = await Timelock.connect(owner).deploy(token.address, unlockTimestamp)

    await token.connect(owner).grantRole(ROLE, timelock.address)
    await token.connect(owner).revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)
    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)

    await expect(timelock.setAdminRole()).to.reverted
  })

  it('Should allow giving DEFAULT_ADMIN_ROLE to timelock owner after unlockTimestamp', async function () {
    token = await Token.connect(owner).deploy()
    timelock = await Timelock.connect(owner).deploy(token.address, unlockTimestamp)

    await token.grantRole(ROLE, timelock.address)
    await token.revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)

    await advanceTimeAndBlock(
      provider,
      unlockTimestamp - Math.floor(Date.now() / 1000) + 60
    )

    await timelock.setAdminRole()

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(true)
  })
})