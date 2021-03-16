const MahaToken = artifacts.require('MahaToken')


contract('MahaToken', function (accounts) {
  beforeEach(async function () {
    this.token = await MahaToken.new()
  })


  it('should deploy properly', async function () {
    const instance = await MahaToken.deployed()
    assert.notEqual(instance, null)
  })

  it('name, symbol and demicals should be set properly', async function () {
    assert.equal(await this.token.name(), 'MahaDAO')
    assert.equal(await this.token.symbol(), 'MAHA')
    assert.equal(await this.token.decimals(), 18)
  })
})
