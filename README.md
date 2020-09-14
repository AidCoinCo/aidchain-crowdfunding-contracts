# AidChain Projects Smart Contracts

[![Build Status](https://travis-ci.org/AidCoinCo/aidchain-projects-contracts.svg?branch=master)](https://travis-ci.org/AidCoinCo/aidchain-projects-contracts)
[![Coverage Status](https://coveralls.io/repos/github/AidCoinCo/aidchain-projects-contracts/badge.svg)](https://coveralls.io/github/AidCoinCo/aidchain-projects-contracts)
[![MIT licensed](https://img.shields.io/github/license/AidCoinCo/aidchain-projects-contracts.svg)](https://github.com/AidCoinCo/aidchain-projects-contracts/blob/master/LICENSE)


AidChain Projects Smart Contracts


## Development

### Install dependencies

```bash
npm install
```

## Usage (using Truffle)

Open the Truffle console

```bash
npm run console
```

### Compile

```bash
npm run compile
```

### Test

```bash
npm run test
```

## Usage (using Buidler)

Open the Buidler console

```bash
npm run buidler:console
```

### Compile

```bash
npm run buidler:compile
```

### Test

```bash
npm run buidler:test
```

### Code Coverage

```bash
npm run coverage
```

## Linter

Use Solhint

```bash
npm run lint:sol
```

Use ESLint

```bash
npm run lint:js
```

Use ESLint and fix

```bash
npm run lint:fix
```

## Use web3 console in your browser (i.e. to use MetaMask)

By default it takes contracts compiled with Truffle.

To use Buidler compiled contracts change `./build/contracts` with `./artifacts` in `bs-config.json`

```bash
npm run dev
```

## Flattener

This allow to flatten the code into a single file

Edit `scripts/flat.sh` to add your contracts

```bash
npm run flat
```

## Analysis

Note: it is better to analyze the flattened code to have a bigger overview on the entire codebase. So run the flattener first.

### Describe

The `describe` command shows a summary of the contracts and methods in the files provided

```bash
surya describe dist/Project.dist.sol
```

### Dependencies

The `dependencies` command outputs the c3-linearization of a given contract's inheirtance graph. Contracts will be listed starting with most-derived, ie. if the same function is defined in more than one contract, the solidity compiler will use the definition in whichever contract is listed first.

```bash
surya dependencies Project dist/Project.dist.sol
```
### Generate Report

Edit `scripts/analyze.sh` to add your contracts

```bash
npm run analyze
```

The `inheritance` command outputs a DOT-formatted graph of the inheritance tree.

The `graph` command outputs a DOT-formatted graph of the control flow.

The `mdreport` command creates a markdown description report with tables comprising information about the system's files, contracts and their functions.

The `sol2uml` generates UML class diagram from Solidity contracts.

## License

Code released under the [MIT License](https://github.com/AidCoinCo/aidchain-projects-contracts/blob/master/LICENSE).
