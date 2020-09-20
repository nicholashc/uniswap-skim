# uniswap-skim

Scripts to scan all of the uniswapV2 contracts and search for mismatched balances/reserves.

## about

UniswapV2 has an interesting function called `skim(address)` that lets anyone claim a positive descrepency between the actual token balance in the contract and the reserve number stored in the Pair contract. 

These scripts scan all of the uniV2 contracts to look for those opportunties. Usually there are only a handful, but tokens with changing supplies like aTokens or rebase tokens like AMPL can create some chaos. Most of the skim balances are so small that they aren't worth the gas to call. But sometimes they are profitable. 

If you use this script from an EOA expect to be frontrun. There are an increasing number of bots searching for these opportunities.

## install

1. clone the repo
2. `cd` into the repo
3. run `npm i --save` to install the dependecies (web3 and axios)

## usage

1. there are two main scripts: 
  - `uniMarkets.js` scans for any newly deployed markets since the last known Pair and appends `logs/events.js` with any new markets
  - `skim.js` checks every market in `log/events.js` and looks for skim opportunties. It attempts to use the coingecko api to find a price for the value of the skimable tokens
2. `npm run update` will run `uniMarket.js` and update the logs to the latest block
3. `npm run skim` will search for skimmable opportuntities

## usage notes

1. the scripts are hardcoded to use a local node on port 8545 for both http and ws requests (praise turbogeth). If you are using different ports or infura, change this line
2. there is a "token blacklist" array that includes tokens that are self desctructed or not actually contracts, etc. This reduces overall errors.
3. there is a "whitelist" that correctly names tokens who didn't follow the ERC-20 standard and return a byte32 for their name. there is probabably a smarter way to deal with this edge case
4. if you run into problems updating `events.js` hardcode the path directory in `fs.writeFile()` in `uniMarkets.js`
5. `skim.js` defaults to return skimable values that are greater than $0.10 or "NaN", which means coingecko does not have a price for that token
6. `events.js` is current as of block _______ and there are _______ uniV2 Pairs

## disclaimers

I take no responsibility for any use, misuse, mistakes, or funds related to the use of this code. Use and adapt as you see fit. There is also a benevolant way to correct uniV2 balance/reserve descrepcencies by calling `sync()`. The choice is yours!
