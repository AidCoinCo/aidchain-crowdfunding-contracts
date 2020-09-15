const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC20Mock = artifacts.require('ERC20Mock');
const Project = artifacts.require('Project');

contract('Project', function ([tokenHolder, admin, operator, beneficiary, recovery, thirdParty]) {
  const OPERATOR_ROLE = web3.utils.soliditySha3('OPERATOR');

  const name = 'TestToken';
  const symbol = 'TEST';
  const amount = new BN(100);

  context('creating valid contract', function () {
    beforeEach(async function () {
      this.releaseTime = (await time.latest()).add(time.duration.years(1));

      this.token = await ERC20Mock.new(name, symbol, tokenHolder, amount, { from: tokenHolder });
    });

    it('rejects an empty token', async function () {
      await expectRevert(
        Project.new(ZERO_ADDRESS, beneficiary, recovery, this.releaseTime),
        'Project: token is the zero address',
      );
    });

    it('rejects an empty beneficiary', async function () {
      await expectRevert(
        Project.new(this.token.address, ZERO_ADDRESS, recovery, this.releaseTime),
        'Project: beneficiary is the zero address',
      );
    });

    it('rejects an empty recovery', async function () {
      await expectRevert(
        Project.new(this.token.address, beneficiary, ZERO_ADDRESS, this.releaseTime),
        'Project: recovery is the zero address',
      );
    });

    it('rejects a release time in the past', async function () {
      const pastReleaseTime = (await time.latest()).sub(time.duration.years(1));
      await expectRevert(
        Project.new(this.token.address, beneficiary, recovery, pastReleaseTime),
        'Project: release time is before current time',
      );
    });

    context('once deployed', function () {
      beforeEach(async function () {
        this.contract = await Project.new(
          this.token.address,
          beneficiary,
          recovery,
          this.releaseTime,
          { from: admin },
        );
      });

      it('can get state', async function () {
        expect(await this.contract.token()).to.equal(this.token.address);
        expect(await this.contract.beneficiary()).to.equal(beneficiary);
        expect(await this.contract.recovery()).to.equal(recovery);
        expect(await this.contract.releaseTime()).to.be.bignumber.equal(this.releaseTime);
        expect(await this.contract.released()).to.be.equal(false);
      });

      context('with tokens', function () {
        beforeEach(async function () {
          await this.token.transfer(this.contract.address, amount, { from: tokenHolder });
        });

        describe('if caller has the OPERATOR role', function () {
          beforeEach(async function () {
            await this.contract.grantRole(OPERATOR_ROLE, operator, { from: admin });
          });

          it('cannot be released before time limit', async function () {
            await expectRevert(
              this.contract.release({ from: operator }),
              'Project: current time is before release time',
            );
          });

          it('cannot be released just before time limit', async function () {
            await time.increaseTo(this.releaseTime.sub(time.duration.seconds(3)));
            await expectRevert(
              this.contract.release({ from: operator }),
              'Project: current time is before release time',
            );
          });

          it('can be released just after limit', async function () {
            await time.increaseTo(this.releaseTime.add(time.duration.seconds(1)));
            await this.contract.release({ from: operator });

            expect(await this.contract.released()).to.be.equal(true);
            expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
          });

          it('can be released after time limit', async function () {
            await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
            await this.contract.release({ from: operator });

            expect(await this.contract.released()).to.be.equal(true);
            expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
          });

          it('cannot be released twice', async function () {
            await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
            await this.contract.release({ from: operator });
            await expectRevert(this.contract.release({ from: operator }), 'Project: already released');
            expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
          });
        });

        describe('if caller has not the OPERATOR role', function () {
          it('cannot be ever released', async function () {
            await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
            await expectRevert(
              this.contract.release({ from: thirdParty }),
              'Roles: caller does not have the OPERATOR role',
            );
          });
        });
      });

      context('without tokens', function () {
        describe('if caller has the OPERATOR role', function () {
          beforeEach(async function () {
            await this.contract.grantRole(OPERATOR_ROLE, operator, { from: admin });
          });

          it('cannot be released', async function () {
            await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
            await expectRevert(this.contract.release({ from: operator }), 'Project: no tokens to release');
          });
        });
      });
    });
  });
});
