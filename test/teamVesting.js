const MahaToken = artifacts.require('MahaToken')
const TeamVesting = artifacts.require('TeamVesting')

const day0 = 1639699200
const jan172022 = (new Date("2022-01-17")).getTime() / 1000
const dec172021 = (new Date("2021-12-17")).getTime() / 1000
const dec182024 = (new Date("2024-12-17")).getTime() / 1000
const threeYearsSeconds = 86400 * 365 * 3


contract('TeamVesting', function (accounts) {
  beforeEach(async function () {
    this.token = await MahaToken.new()
    this.teamVesting = await TeamVesting.new(accounts[1])

    // mint 10mn tokens
    await this.token.mint(accounts[0], 10000000)
  })

  it('should deploy properly with the right values', async function () {
    assert.notEqual(this.teamVesting, null)
    assert.equal(await this.token.totalSupply(), 10000000)
    assert.equal(await this.teamVesting.beneficiary(), accounts[1])
    assert.equal(await this.teamVesting.owner(), accounts[0])
    assert.equal((await this.teamVesting.start()), dec172021)
    assert.equal(await this.teamVesting.duration(), threeYearsSeconds)
    assert.equal(await this.teamVesting.cliff(), dec172021)
    assert.equal(await this.teamVesting.revocable(), true)
  })


  describe('token unlocks should happen properly', function () {
    beforeEach(async function () {
      // send 7% of the supply
      this.token.transfer(this.teamVesting.address, 700000)
    })

    it('ensure on day 0; 700,000 tokens have been deposited', async function () {
      assert.equal(await this.token.balanceOf(this.teamVesting.address), 700000)
    })


    it('dec 17th 2020 - should give out 0 tokens', async function () {
      assert.equal(await this.teamVesting.vestedAmount(this.token.address, day0), 0)
    })


    it('dec 16th 2021 - should give out 0 tokens', async function () {
      assert.equal(await this.teamVesting.vestedAmount(this.token.address, dec172021 - 86400), 0)
    })

    it('jan 18th 2022 - should give out 19,817 tokens', async function () {
      assert.equal(await this.teamVesting.vestedAmount(this.token.address, jan172022), 19817)
    })

    it('dec 18th 2024 - should give out 700,000 tokens', async function () {
      assert.equal(await this.teamVesting.vestedAmount(this.token.address, dec182024), 700000)
    })
  })


  it('should change the beneficiary properly', async function () {
    assert.notEqual(this.teamVesting, null)
    assert.equal(await this.teamVesting.beneficiary(), accounts[1])
    assert.equal(await this.teamVesting.owner(), accounts[0])
    assert.equal((await this.teamVesting.start()), dec172021)
    assert.equal(await this.teamVesting.duration(), threeYearsSeconds)
    assert.equal(await this.teamVesting.cliff(), dec172021)
    assert.equal(await this.teamVesting.revocable(), true)
  })
})
