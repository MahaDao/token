const MahaToken = artifacts.require('MahaToken')
const InvestorVesting = artifacts.require('InvestorVesting')

const day0 = (new Date("2020-12-17")).getTime() / 1000
const dec172021 = (new Date("2021-12-17")).getTime() / 1000
const dec172022 = (new Date("2022-12-17")).getTime() / 1000
const dec182030 = (new Date("2030-12-18")).getTime() / 1000
const jan172021 = (new Date("2021-01-17")).getTime() / 1000
const jan172022 = (new Date("2022-01-17")).getTime() / 1000
const months11 = 86400 * 30 * 11


contract('InvestorVesting', function (accounts) {
  beforeEach(async function () {
    this.token = await MahaToken.new()
    this.investorVesting = await InvestorVesting.new(accounts[1])

    // mint 10mn tokens
    await this.token.mint(accounts[0], 10000000)
  })

  it('should deploy properly with the right values', async function () {
    assert.notEqual(this.investorVesting, null)
    assert.equal(await this.token.totalSupply(), 10000000)
    assert.equal(await this.investorVesting.beneficiary(), accounts[1])
    assert.equal(await this.investorVesting.owner(), accounts[0])
    assert.equal((await this.investorVesting.start()), day0)
    assert.equal(await this.investorVesting.duration(), months11)
    assert.equal(await this.investorVesting.cliff(), day0)
    assert.equal(await this.investorVesting.revocable(), true)
  })


  describe('token unlocks should happen properly', function () {
    beforeEach(async function () {
      // send 67% of the supply
      this.token.transfer(this.investorVesting.address, 1733333)
    })

    it('ensure on day 0; 1,733,333 tokens have been deposited', async function () {
      assert.equal(await this.token.balanceOf(this.investorVesting.address), 1733333)
    })


    it('dec 17th 2020 - should give out 0 tokens', async function () {
      assert.equal(await this.investorVesting.vestedAmount(this.token.address, day0), 0)
    })


    it('jan 17th 2021 - should give out 58,949 tokens', async function () {
      assert.equal((await this.investorVesting.vestedAmount(this.token.address, jan172021)).toNumber(), 162828)
    })

    it('dec 17th 2021 - should give out 1,733,333 tokens', async function () {
      assert.equal((await this.investorVesting.vestedAmount(this.token.address, dec172021)).toNumber(), 1733333)
    })


  })


  it('should change the beneficiary properly', async function () {
    assert.notEqual(this.investorVesting, null)
    assert.equal(await this.investorVesting.beneficiary(), accounts[1])
    assert.equal(await this.investorVesting.owner(), accounts[0])
    assert.equal((await this.investorVesting.start()), day0)
    assert.equal(await this.investorVesting.duration(), months11)
    assert.equal(await this.investorVesting.cliff(), day0)
    assert.equal(await this.investorVesting.revocable(), true)
  })
})
