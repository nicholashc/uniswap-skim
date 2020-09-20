# uniswap-skim

Scripts to scan all of the uniswapV2 contracts and search for mismatched balances/reserves.

## about

UniswapV2 has an interesting function called [`skim(address)`](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol#L190-L195) that lets anyone claim a positive discrepancy between the actual token balance in the contract and the reserve number stored in the Pair contract. 

These scripts scan all of the uniV2 contracts to look for those opportunities. Usually there are only a handful, but tokens with changing supplies like aTokens or rebase tokens like AMPL can create some chaos. Most of the skim balances are so small that they aren't worth the gas to call. But sometimes they are profitable. 

If you use this script from an EOA expect to be frontrun. There are an increasing number of bots searching for these opportunities.

## install

1. clone the repo
2. `cd` into the repo
3. run `npm i` to install the dependencies (web3 and axios)

## usage

1. there are two main scripts: 
  - `uniMarkets.js` scans for any newly deployed markets since the last known Pair and appends `logs/events.js` with any new markets
  - `skim.js` checks every market in `log/events.js` and looks for skim opportunities. It attempts to use the coingecko api to find a price for the value of the skim-able tokens
2. `npm run update` will run `uniMarket.js` and update the logs to the latest block
3. `npm run skim` will search for skim-able opportunities

## usage notes

1. the scripts are hardcoded to use a local node on port 8545 for both http and ws requests (praise turbogeth). If you are using different ports or infura, change this line
2. there is a "token blacklist" array that includes tokens that are self-destructed or not actually contracts, etc. This reduces overall errors.
3. there is a "whitelist" that correctly names tokens who didn't follow the ERC-20 standard and return a byte32 for their name. there is probably a smarter way to deal with this edge case
4. if you run into problems updating `events.js` hardcode the path directory in `fs.writeFile()` in `uniMarkets.js`
5. `skim.js` defaults to return skim-able values that are greater than $0.10 or "NaN", which means coingecko does not have a price for that token. change those in the code if you want different parameters
6. `events.js` is current as of block 10897528 and there are 9777 uniV2 Pairs
7. `skim.js` can take a few minutes to run as more and more markets are added

## example output

```
$ uniswap-skim npm run update

> uniswap-skim@1.0.0 update /yourDirectory/uniswap-skim
> node ./scripts/uniMarkets.js

9742 10896099
9743 10896192
9744 10896201
9745 10896233
9746 10896241
9747 10896287
9748 10896328
9749 10896370
9750 10896393
9751 10896406
9752 10896535
9753 10896619
9754 10896624
9755 10896627
9756 10896652
9757 10896684
9758 10896691
9759 10896710
9760 10896736
9761 10896778
9762 10896834
9763 10896862
9764 10896889
9765 10896902
9766 10896921
9767 10896956
9768 10896960
9769 10896979
9770 10897001
9771 10897237
9772 10897239
9773 10897302
9774 10897491
```

```
$ uniswap-skim npm run skim

> uniswap-skim@1.0.0 skim /yourDirectory/uniswap-skim
> node ./scripts/skim.js

{
  "pairAddress": "0x243e8c1a5f67f042800571a0667bfd26ddb94fa4",
  "token0": {
    "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "name": "Wrapped Ether",
    "decimals": "18",
    "balance": "0.568343703003059029",
    "reserve": "0.568343703003059029",
    "imbalance": false
  },
  "token1": {
    "address": "0xd29fa4b8cc936a68bb560b19eed969ebfdbaa565",
    "name": "Ace Wins",
    "decimals": "10",
    "balance": "259,085.9413577280",
    "reserve": "253,591.7648822625",
    "imbalance": {
      "diff": "5,494.1764754655",
      "price": 0.00461814,
      "value": "NaN"
    }
  }
},
{
  "pairAddress": "0xa163bc0f3e37374288566f99f5ab313ea2b3410b",
  "token0": {
    "address": "0x328c4c80bc7aca0834db37e6600a6c49e12da4de",
    "name": "Aave Interest bearing SNX",
    "decimals": "18",
    "balance": "1,001.541332754973076103",
    "reserve": "1,001.098402393891231926",
    "imbalance": {
      "diff": "0.442930361081790460",
      "price": 4.42,
      "value": "1.96"
    }
  },
  "token1": {
    "address": "0x78a685e0762096ed0f98107212e98f8c35a9d1d8",
    "name": "Bloc",
    "decimals": "10",
    "balance": "1.6980857933",
    "reserve": "1.6980857933",
    "imbalance": false
  }
},
```

## disclaimers

I take no responsibility for any use, misuse, mistakes, or funds lost or received related to the use of this code. Use and adapt as you see fit. There is also a benevolent way to correct uniV2 balance/reserve discrepancies by calling [`sync()`](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol#L198-L200). Good or evil. The choice is yours!
