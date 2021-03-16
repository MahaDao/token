import "@nomiclabs/hardhat-ethers"

import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Contract, ContractFactory, BigNumber, utils } from 'ethers'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

import { advanceTimeAndBlock, latestBlocktime } from './utilities'
import TimelockJSON from '../build/artifacts/contracts/Timelock.sol/Timelock.json'
import MahaTokenJSON from '../build/artifacts/contracts/MahaToken.sol/MahaToken.json'


chai.use(solidity)


describe('Timelock', async () => {
  const ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'
  const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
  const PAUSER_ROLE = '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a'

  const unlockTimestamp = Math.floor(Date.now() / 1000) + 60

  const { provider } = ethers

  let ant: SignerWithAddress
  let owner: SignerWithAddress

  let token: Contract
  let timelock: Contract

  const Token: ContractFactory = new ContractFactory(
    MahaTokenJSON.abi,
    MahaTokenJSON.bytecode
  )
  const Timelock: ContractFactory = new ContractFactory(
    TimelockJSON.abi,
    TimelockJSON.bytecode
  )

  before('Provider & accounts setting', async () => {
    [owner, ant] = await ethers.getSigners()
  })

  beforeEach('Provider & accounts setting', async () => {
    token = await Token.connect(owner).deploy()
    timelock = await Timelock.connect(owner).deploy(token.address, unlockTimestamp)
  })

  it('Should give DEFAULT_ADMIN_ROLE to timelocks', async function () {
    await token.connect(owner).grantRole(ROLE, timelock.address)

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
  })

  it('Should give DEFAULT_ADMIN_ROLE to timelocks and revoke for self', async function () {
    await token.connect(owner).grantRole(ROLE, timelock.address)
    await token.connect(owner).revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)
    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
  })

  it('Should not allow giving DEFAULT_ADMIN_ROLE to timelock owner before unlockTimestamp even if called by timelock owner', async function () {
    await token.connect(owner).grantRole(ROLE, timelock.address)
    await token.connect(owner).revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)
    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)

    await expect(timelock.connect(owner).setAdminRole())
      .to
      .revertedWith("Timelock: early minting not allowed")
  })

  it('Should not allow giving DEFAULT_ADMIN_ROLE to timelock owner before unlockTimestamp if not called by timelock owner', async function () {
    await token.connect(owner).grantRole(ROLE, timelock.address)
    await token.connect(owner).revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)
    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)

    await expect(timelock.connect(ant).setAdminRole())
      .to
      .revertedWith("Ownable: caller is not the owner")
  })

  it('Should allow giving DEFAULT_ADMIN_ROLE to timelock owner after unlockTimestamp if called only by timelock owner', async function () {
    await token.grantRole(ROLE, timelock.address)
    await token.revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)

    await advanceTimeAndBlock(
      provider,
      unlockTimestamp - Math.floor(Date.now() / 1000) + 60
    )

    await timelock.connect(owner).setAdminRole()

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(true)
  })

  it('Should not allow giving DEFAULT_ADMIN_ROLE to timelock owner after unlockTimestamp if not called by timelock owner', async function () {
    await token.grantRole(ROLE, timelock.address)
    await token.revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)

    await advanceTimeAndBlock(
      provider,
      unlockTimestamp - Math.floor(Date.now() / 1000) + 60
    )

    await expect(timelock.connect(ant).setAdminRole()).to.revertedWith("Ownable: caller is not the owner")

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)
  })

  it('Token contract owner should not be able to use DEFAULT_ADMIN_ROLE after starting timelock and revoking the DEFAULT_ADMIN_ROLE role for self', async function () {
    await token.grantRole(ROLE, timelock.address)
    await token.revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)

    await expect(token.connect(owner).grantRole(MINTER_ROLE, ant.address))
      .to
      .revertedWith('AccessControl: sender must be an admin to grant')

    expect(await token.hasRole(ROLE, ant.address)).to.eq(false)
    expect(await token.hasRole(MINTER_ROLE, ant.address)).to.eq(false)
    expect(await token.hasRole(PAUSER_ROLE, ant.address)).to.eq(false)
  })

  it('Token contract owner should be able to use DEFAULT_ADMIN_ROLE after end of timelock and after getting the DEFAULT_ADMIN_ROLE role for self', async function () {
    await token.grantRole(ROLE, timelock.address)
    await token.revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)

    await expect(token.connect(owner).grantRole(MINTER_ROLE, ant.address))
      .to
      .revertedWith('AccessControl: sender must be an admin to grant')

    expect(await token.hasRole(ROLE, ant.address)).to.eq(false)
    expect(await token.hasRole(MINTER_ROLE, ant.address)).to.eq(false)
    expect(await token.hasRole(PAUSER_ROLE, ant.address)).to.eq(false)

    await advanceTimeAndBlock(
      provider,
      unlockTimestamp - Math.floor(Date.now() / 1000) + 60
    )

    await timelock.connect(owner).setAdminRole()

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(true)

    await token.connect(owner).grantRole(MINTER_ROLE, ant.address)

    expect(await token.hasRole(ROLE, ant.address)).to.eq(false)
    expect(await token.hasRole(MINTER_ROLE, ant.address)).to.eq(true)
    expect(await token.hasRole(PAUSER_ROLE, ant.address)).to.eq(false)
  })

  it('Token contract owner should not be DEFAULT_ADMIN_ROLE during the timelock and be DEFAULT_ADMIN_ROLE after timelock', async function () {
    await token.grantRole(ROLE, timelock.address)
    await token.revokeRole(ROLE, owner.address)

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(false)

    await advanceTimeAndBlock(
      provider,
      unlockTimestamp - Math.floor(Date.now() / 1000) + 60
    )

    await timelock.connect(owner).setAdminRole()

    expect(await token.hasRole(ROLE, timelock.address)).to.eq(true)
    expect(await token.hasRole(ROLE, owner.address)).to.eq(true)
  })
})
