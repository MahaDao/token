const MahaToken = artifacts.require('MahaToken')
const CommunityVesting = artifacts.require('CommunityVesting')

const day0 = (new Date("2020-12-17")).getTime() / 1000
const dec172021 = (new Date("2021-12-17")).getTime() / 1000
const dec172022 = (new Date("2022-12-17")).getTime() / 1000
const dec182030 = (new Date("2030-12-18")).getTime() / 1000
const jan172021 = (new Date("2021-01-17")).getTime() / 1000
const jan172022 = (new Date("2022-01-17")).getTime() / 1000
const months119 = 86400 * 30 * 119


contract('CommunityVesting', function (accounts) {
  beforeEach(async function () {
    this.token = await MahaToken.new()
    this.communityVesting = await CommunityVesting.new(accounts[1])

    // mint 10mn tokens
    await this.token.mint(accounts[0], 10000000)
  })

  it('should deploy properly with the right values', async function () {
    assert.notEqual(this.communityVesting, null)
    assert.equal(await this.token.totalSupply(), 10000000)
    assert.equal(await this.communityVesting.beneficiary(), accounts[1])
    assert.equal(await this.communityVesting.owner(), accounts[0])
    assert.equal((await this.communityVesting.start()), day0)
    assert.equal(await this.communityVesting.duration(), months119)
    assert.equal(await this.communityVesting.cliff(), day0)
    assert.equal(await this.communityVesting.revocable(), true)
  })


  describe('token unlocks should happen properly', function () {
    beforeEach(async function () {
      // send 67% of the supply
      this.token.transfer(this.communityVesting.address, 6788668)
    })

    it('ensure on day 0; 6,788,668 tokens have been deposited', async function () {
      assert.equal(await this.token.balanceOf(this.communityVesting.address), 6788668)
    })


    it('dec 17th 2020 - should give out 0 tokens', async function () {
      assert.equal(await this.communityVesting.vestedAmount(this.token.address, day0), 0)
    })


    it('jan 17th 2021 - should give out 58,949 tokens', async function () {
      assert.equal((await this.communityVesting.vestedAmount(this.token.address, jan172021)).toNumber(), 58949)
    })

    it('dec 17th 2021 - should give out 694,079 tokens', async function () {
      assert.equal((await this.communityVesting.vestedAmount(this.token.address, dec172021)).toNumber(), 694079)
    })

    it('dec 17th 2022 - should give out 1,388,159 tokens', async function () {
      assert.equal((await this.communityVesting.vestedAmount(this.token.address, dec172022)).toNumber(), 1388159)
    })

    it('dec 18th 2030 - should give out 6,788,668 tokens', async function () {
      assert.equal((await this.communityVesting.vestedAmount(this.token.address, dec182030)).toNumber(), 6788668)
    })
  })


  it('should change the beneficiary properly', async function () {
    assert.notEqual(this.communityVesting, null)
    assert.equal(await this.communityVesting.beneficiary(), accounts[1])
    assert.equal(await this.communityVesting.owner(), accounts[0])
    assert.equal((await this.communityVesting.start()), day0)
    assert.equal(await this.communityVesting.duration(), months119)
    assert.equal(await this.communityVesting.cliff(), day0)
    assert.equal(await this.communityVesting.revocable(), true)
  })
})
