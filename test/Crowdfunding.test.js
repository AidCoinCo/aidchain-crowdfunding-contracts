const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC20Mock = artifacts.require('ERC20Mock');
const Crowdfunding = artifacts.require('Crowdfunding');

contract('Crowdfunding', function ([tokenHolder, admin, operator, beneficiary, recovery, thirdParty]) {
  const OPERATOR_ROLE = web3.utils.soliditySha3('OPERATOR');

  const name = 'TestToken';
  const symbol = 'TEST';
  const amount = new BN(100);

  context('creating valid contract', function () {
    beforeEach(async function () {
      this.releaseTime = (await time.latest()).add(time.duration.years(1));
      this.releasePercent = new BN(70);
      this.expectedAmount = amount.mul(this.releasePercent).div(new BN(100));

      this.token = await ERC20Mock.new(name, symbol, tokenHolder, amount, { from: tokenHolder });
    });

    it('rejects an empty token', async function () {
      await expectRevert(
        Crowdfunding.new(ZERO_ADDRESS, beneficiary, recovery, this.releaseTime, this.releasePercent),
        'Crowdfunding: token is the zero address',
      );
    });

    it('rejects an empty beneficiary', async function () {
      await expectRevert(
        Crowdfunding.new(this.token.address, ZERO_ADDRESS, recovery, this.releaseTime, this.releasePercent),
        'Crowdfunding: beneficiary is the zero address',
      );
    });

    it('rejects an empty recovery', async function () {
      await expectRevert(
        Crowdfunding.new(this.token.address, beneficiary, ZERO_ADDRESS, this.releaseTime, this.releasePercent),
        'Crowdfunding: recovery is the zero address',
      );
    });

    it('rejects a release time in the past', async function () {
      const pastReleaseTime = (await time.latest()).sub(time.duration.years(1));
      await expectRevert(
        Crowdfunding.new(this.token.address, beneficiary, recovery, pastReleaseTime, this.releasePercent),
        'Crowdfunding: release time is before current time',
      );
    });

    it('rejects invalid percent', async function () {
      await expectRevert(
        Crowdfunding.new(this.token.address, beneficiary, recovery, this.releaseTime, 200),
        'Crowdfunding: release percent is more than 100',
      );
    });

    context('once deployed', function () {
      beforeEach(async function () {
        this.contract = await Crowdfunding.new(
          this.token.address,
          beneficiary,
          recovery,
          this.releaseTime,
          this.releasePercent,
          { from: admin },
        );

        await this.contract.grantRole(OPERATOR_ROLE, operator, { from: admin });
      });

      it('can get state', async function () {
        expect(await this.contract.token()).to.equal(this.token.address);
        expect(await this.contract.beneficiary()).to.equal(beneficiary);
        expect(await this.contract.recovery()).to.equal(recovery);
        expect(await this.contract.releaseTime()).to.be.bignumber.equal(this.releaseTime);
        expect(await this.contract.releasePercent()).to.be.bignumber.equal(this.releasePercent);
        expect(await this.contract.released()).to.be.equal(false);
      });

      context('with tokens', function () {
        beforeEach(async function () {
          await this.token.transfer(this.contract.address, amount, { from: tokenHolder });
        });

        describe('if caller has the OPERATOR role', function () {
          context('check release', function () {
            it('cannot be released before time limit', async function () {
              await expectRevert(
                this.contract.release({ from: operator }),
                'Crowdfunding: current time is before release time',
              );
            });

            it('cannot be released just before time limit', async function () {
              await time.increaseTo(this.releaseTime.sub(time.duration.seconds(3)));
              await expectRevert(
                this.contract.release({ from: operator }),
                'Crowdfunding: current time is before release time',
              );
            });

            it('can be released just after limit', async function () {
              await time.increaseTo(this.releaseTime.add(time.duration.seconds(1)));
              await this.contract.release({ from: operator });

              expect(await this.contract.released()).to.be.equal(true);
              expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(this.expectedAmount);
            });

            it('can be released after time limit', async function () {
              await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
              await this.contract.release({ from: operator });

              expect(await this.contract.released()).to.be.equal(true);
              expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(this.expectedAmount);
            });

            it('cannot be released twice', async function () {
              await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
              await this.contract.release({ from: operator });
              await expectRevert(this.contract.release({ from: operator }), 'Crowdfunding: already released');
              expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(this.expectedAmount);
            });

            context('check recover', function () {
              describe('if not released', function () {
                it('cannot be recovered', async function () {
                  await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
                  await expectRevert(
                    this.contract.recover(this.token.address, { from: operator }),
                    'Crowdfunding: not already released',
                  );
                });
              });

              describe('if released', function () {
                beforeEach(async function () {
                  await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
                  await this.contract.release({ from: operator });
                });

                it('can be recovered', async function () {
                  await this.contract.recover(this.token.address, { from: operator });
                  expect(await this.token.balanceOf(recovery)).to.be.bignumber.equal(amount.sub(this.expectedAmount));
                });

                describe('if recovered', function () {
                  it('cannot be unlocked', async function () {
                    await this.contract.recover(this.token.address, { from: operator });
                    await expectRevert(
                      this.contract.unlock({ from: operator }),
                      'Crowdfunding: no tokens to unlock',
                    );
                  });
                });
              });
            });

            context('check unlock', function () {
              describe('if not released', function () {
                it('cannot be unlocked', async function () {
                  await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
                  await expectRevert(
                    this.contract.unlock({ from: operator }),
                    'Crowdfunding: not already released',
                  );
                });
              });

              describe('if released', function () {
                beforeEach(async function () {
                  await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
                  await this.contract.release({ from: operator });
                });

                it('can be unlocked', async function () {
                  await this.contract.unlock({ from: operator });
                  expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
                });

                describe('if unlocked', function () {
                  it('cannot be recovered', async function () {
                    await this.contract.unlock({ from: operator });
                    await expectRevert(
                      this.contract.recover(this.token.address, { from: operator }),
                      'Crowdfunding: no tokens to recover',
                    );
                  });
                });
              });
            });
          });
        });

        describe('if caller has not the OPERATOR role', function () {
          context('check release', function () {
            it('cannot be ever released', async function () {
              await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
              await expectRevert(
                this.contract.release({ from: thirdParty }),
                'Roles: caller does not have the OPERATOR role',
              );
            });

            context('check recover', function () {
              describe('if released', function () {
                beforeEach(async function () {
                  await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
                  await this.contract.release({ from: operator });
                });

                it('cannot be ever recovered', async function () {
                  await expectRevert(
                    this.contract.recover(this.token.address, { from: thirdParty }),
                    'Roles: caller does not have the OPERATOR role',
                  );
                });
              });
            });

            context('check unlock', function () {
              describe('if released', function () {
                beforeEach(async function () {
                  await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
                  await this.contract.release({ from: operator });
                });

                it('cannot be ever unlocked', async function () {
                  await expectRevert(
                    this.contract.unlock({ from: thirdParty }),
                    'Roles: caller does not have the OPERATOR role',
                  );
                });
              });
            });
          });
        });
      });

      context('without tokens', function () {
        describe('if caller has the OPERATOR role', function () {
          it('cannot be released', async function () {
            await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
            await expectRevert(this.contract.release({ from: operator }), 'Crowdfunding: no tokens to release');
          });
        });
      });
    });
  });
});
