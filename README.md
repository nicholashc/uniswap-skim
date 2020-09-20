# uniswap-skim

Scripts to scan all of the [UniswapV2🦄](https://uniswap.org/) contracts on the Ethereum network and search for mismatched balances/reserves.

## about

UniswapV2 has an interesting function called [`skim(address)`](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol#L190-L195) that lets anyone claim a positive discrepancy between the actual token balance in the contract and the reserve number stored in the Pair contract. 

These scripts scan all of the uniV2🦄 contracts to look for those opportunities. Usually there are only a handful, but tokens with changing supplies like aTokens or rebase tokens like AMPL can create some chaos. Most of the skim balances are so small that they aren't worth the gas to call. But sometimes they are profitable. 

If you try to call skim from an EOA expect to be frontrun. There are an increasing number of bots searching for these opportunities. You may want to use something like the `Forwarder.sol` contract example or even something more sophisticated.

## install

1. clone the repo
2. `cd` into the repo
3. run `npm i` to install the dependencies (web3 and axios)

## usage

1. there are two main scripts: 
  - `uniMarkets.js` scans for any newly deployed markets since the last known Pair and appends `logs/events.js` with any new markets
  - `skim.js` checks every market in `log/events.js` and looks for skim opportunities. It attempts to use the coingecko api to find a price for the value of the skim-able tokens
2. from the root of the repo directory `npm run update` will run `uniMarket.js` and update the logs to the latest block
3. from the root of the repo directory `npm run skim` will search for skim-able opportunities

## usage notes

1. the scripts are hardcoded to use a local node on port 8545 for both http and ws requests (🙏 [turbogeth](https://github.com/ledgerwatch/turbo-geth)). If you are using different ports or infura, change this in the code
2. there is a "token blacklist" array that includes tokens that are self-destructed, not actually contracts, or totally non-standard ERC20. This reduces overall errors
3. there is a "whitelist" that correctly names tokens who didn't follow the ERC-20 standard and return a byte32 for their name (looking at you MKR). there is probably a smarter way to deal with this edge case than hardcoding but ¯\\_(ツ)_/¯
4. if you run into problems updating `events.js` hardcode the path directory in `fs.writeFile()` in `uniMarkets.js`
5. `skim.js` defaults to return skim-able values that are greater than $0.01 so you can see some results. you can change this by altering the variable `minDollarVal` in `skim.js`. Skim-able values are also returned when coingecko does not have a price for the token (but they have most)
6. `events.js` in this repo is current as of block 10898390 and there are 9791 uniV2🦄 Pairs
7. `skim.js` can take a few minutes to run as there are almost 10,000 pairs to search!
8. if `uniMarkets.js` returns no results it's possible that there were no new pairs were deployed since the last time you called the function
9. the script ignores cases where the reserve is higher than the balance, since that is not skim-able (this happens with rebase coins sometimes)

## example output

what your terminal should roughly look like after running `npm run update`

```
uniswap-skim npm run update

> uniswap-skim@1.0.0 update /yourDirectory/uniswap-skim
> node ./scripts/uniMarkets.js

🦄 pair #: 9786 deployed in block: 10898080
🦄 pair #: 9787 deployed in block: 10898182
🦄 pair #: 9788 deployed in block: 10898201
🦄 pair #: 9789 deployed in block: 10898327
🦄 pair #: 9790 deployed in block: 10898366
🦄 pair #: 9791 deployed in block: 10898390
```

what your terminal should roughly look like after running `npm run skim`

```
uniswap-skim npm run skim

> uniswap-skim@1.0.0 skim /yourDirectory/uniswap-skim
> node ./scripts/skim.js

{
  "pairAddress": "0x321d87e1757c8c9b57e7af5aa3fe13d2ae774445",
  "pairIndex": 9355,
  "token0": {
    "address": "0x29e240cfd7946ba20895a7a02edb25c210f9f324",
    "name": "yearn Aave Interest bearing LINK",
    "decimals": "18",
    "balance": "252,858.663596952206854028",
    "reserve": "252,858.663596952206854028",
    "imbalance": false
  },
  "token1": {
    "address": "0xa64bd6c70cb9051f6a9ba1f163fdc07e0dfb5f84",
    "name": "Aave Interest bearing LINK",
    "decimals": "18",
    "balance": "267,963.012522435165106136",
    "reserve": "267,962.996672942810947153",
    "imbalance": {
      "diff": "0.015849492360200192",
      "usdPrice": 10.35,
      "value": "$0.16🦄"
    }
  }
}
```

## disclaimers

I take no responsibility for any use, misuse, mistakes, or funds lost or received related to the use of this code. Use, modify, ignore as you see fit. There is also a benevolent way to correct uniV2🦄 balance/reserve discrepancies by calling [`sync()`](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol#L198-L200). 
😈 or 😇: the choice is yours!
