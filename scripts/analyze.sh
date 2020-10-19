#!/usr/bin/env bash

CONTRACT_NAME=Crowdfunding

npm run flat

npx surya inheritance dist/$CONTRACT_NAME.dist.sol | dot -Tpng > analysis/inheritance-tree/$CONTRACT_NAME.png

npx surya graph dist/$CONTRACT_NAME.dist.sol | dot -Tpng > analysis/control-flow/$CONTRACT_NAME.png

npx surya mdreport analysis/description-table/$CONTRACT_NAME.md dist/$CONTRACT_NAME.dist.sol

npx sol2uml dist/$CONTRACT_NAME.dist.sol -o analysis/uml/$CONTRACT_NAME.svg
