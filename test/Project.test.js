const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC20Mock = artifacts.require('ERC20Mock');
const Project = artifacts.require('Project');

contract('Project', function ([tokenHolder, creator, operator, beneficiary, thirdParty]) {
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
        Project.new(ZERO_ADDRESS, beneficiary, this.releaseTime),
        'Project: token is the zero address',
      );
    });

    it('rejects an empty beneficiary', async function () {
      await expectRevert(
        Project.new(this.token.address, ZERO_ADDRESS, this.releaseTime),
        'Project: beneficiary is the zero address',
      );
    });

    it('rejects a release time in the past', async function () {
      const pastReleaseTime = (await time.latest()).sub(time.duration.years(1));
      await expectRevert(
        Project.new(this.token.address, beneficiary, pastReleaseTime),
        'Project: release time is before current time',
      );
    });

    context('once deployed', function () {
      beforeEach(async function () {
        this.contract = await Project.new(
          this.token.address,
          beneficiary,
          this.releaseTime,
          { from: creator },
        );

        await this.token.transfer(this.contract.address, amount, { from: tokenHolder });
      });

      it('can get state', async function () {
        expect(await this.contract.token()).to.equal(this.token.address);
        expect(await this.contract.beneficiary()).to.equal(beneficiary);
        expect(await this.contract.releaseTime()).to.be.bignumber.equal(this.releaseTime);
      });

      it('cannot be released before time limit', async function () {
        await expectRevert(this.contract.release(), 'Project: current time is before release time');
      });

      it('cannot be released just before time limit', async function () {
        await time.increaseTo(this.releaseTime.sub(time.duration.seconds(3)));
        await expectRevert(this.contract.release(), 'Project: current time is before release time');
      });

      it('can be released just after limit', async function () {
        await time.increaseTo(this.releaseTime.add(time.duration.seconds(1)));
        await this.contract.release();
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      });

      it('can be released after time limit', async function () {
        await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
        await this.contract.release();
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      });

      it('cannot be released twice', async function () {
        await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
        await this.contract.release();
        await expectRevert(this.contract.release(), 'Project: no tokens to release');
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      });
    });
  });
});
