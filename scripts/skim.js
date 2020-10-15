const Web3 = require("web3");

const pairAbi = require("../abi/uniswapV2pairAbi.js");
const events = require("../logs/events.js");
const erc20abi = require("../abi/erc20abi.js");
const tokenBlackList = require("./blacklist.js");
const whitelist = require("./whitelist.js");

const axios = require('axios').default;

const web3 = new Web3("ws://localhost:8546");

const createPairTopic = "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9";

let i = 0;
const minDollarVal = 0.01;

const getPairs = async (count) => {

  if (count < events.length) {

    if (events[count].topics[0] === createPairTopic) {

      const pairAdd = `0x${events[count].data.slice(26, 66)}`;
      const token0Add = `0x${events[count].topics[1].slice(26, 66)}`;
      const token1Add = `0x${events[count].topics[2].slice(26, 66)}`;

      let badToken = tokenBlackList.includes(token0Add) || tokenBlackList.includes(token1Add);

      try {

        if (!badToken) {

          let token0contract = await new web3.eth.Contract(
            erc20abi,
            token0Add
          );

          let token1contract = await new web3.eth.Contract(
            erc20abi,
            token1Add
          );

          let pairContract = await new web3.eth.Contract(
            pairAbi,
            pairAdd
          );

          let name0 =
            getName(token0Add) != false ?
            getName(token0Add) :
            await token0contract.methods.name().call();

          let name1 =
            getName(token1Add) != false ?
            getName(token1Add) :
            await token1contract.methods.name().call();

          const reserves = await pairContract.methods
            .getReserves()
            .call();

          const bal0 = await token0contract.methods
            .balanceOf(pairAdd)
            .call();

          const bal1 = await token1contract.methods
            .balanceOf(pairAdd)
            .call();

          const res0 = await reserves[0];
          const res1 = await reserves[1];

          const dec0 = await token0contract.methods.decimals().call();
          const dec1 = await token1contract.methods.decimals().call();

          const balance0 = splitBN(bal0, dec0);
          const reserve0 = splitBN(res0, dec0);
          const balance1 = splitBN(bal1, dec1);
          const reserve1 = splitBN(res1, dec1);

          const diff0 = bal0 - res0;
          const diff1 = bal1 - res1;

          const pair = {
            pairAddress: pairAdd,
            pairIndex: count,
            token0: {
              address: token0Add,
              name: name0,
              decimals: dec0,
              balance: balance0,
              reserve: reserve0,
              imbalance: diff0.toString() > 0 ? {
                diff: splitBN(diff0.toString(), dec0),
                usdPrice: await getPrice(token0Add),
                value: await getValue(splitBN(diff0.toString(), dec0), await getPrice(token0Add))
              } : false
            },
            token1: {
              address: token1Add,
              name: name1,
              decimals: dec1,
              balance: balance1,
              reserve: reserve1,
              imbalance: diff1.toString() > 0 ? {
                diff: splitBN(diff1.toString(), dec1),
                usdPrice: await getPrice(token1Add),
                value: await getValue(splitBN(diff1.toString(), dec1), await getPrice(token1Add))
              } : false
            }
          };

          if (
            pair.token0.imbalance !== false ||
            pair.token1.imbalance !== false
          ) {
            if (
              pair.token0.imbalance.value === "no coingecko price" ||
              pair.token1.imbalance.value === "no coingecko price"
            ) {
              console.log(`${JSON.stringify(pair, null, 2)},`);
            } else if (
              Number(pair.token0.imbalance.value) > minDollarVal ||
              Number(pair.token1.imbalance.value) > minDollarVal
            ) {
              if (pair.token0.imbalance.value) {
                pair.token0.imbalance.value = `$${(pair.token0.imbalance.value)} 🦄`
              }
              if (pair.token1.imbalance.value) {
                pair.token1.imbalance.value = `$${(pair.token1.imbalance.value)} 🦄`
              }
              console.log(`${JSON.stringify(pair, null, 2)},`);
            }
          }
        }
      } catch (e) {
        console.log(
          `error in pair: 0x${events[count].data.slice(26, 66)},

            ${e}`
        );
      }
    }
    i++;
    getPairs(i);
  } else {
    console.log("finsihed");
    process.exit();
  }
};

const getName = (address) => {
  if (whitelist.some((token) => token.address === address)) {
    let t = whitelist.find((token) => token.address === address);
    return t.name;
  } else {
    return false;
  }
};

const splitBN = (num, dec) => {

  let numConverted = num;

  if (num.indexOf('e') !== -1) {
    numConverted = (Number(num)).toLocaleString('fullwide', {
      useGrouping: false
    });
  }

  let aboveZero = numConverted.length > dec ? numConverted.substring(0, numConverted.length - dec) : 0;
  let belowZero = numConverted.length >= dec ? numConverted.substring(numConverted.length - dec, numConverted.length) : numConverted.padStart(dec, "0");

  return `${Number(aboveZero).toLocaleString()}.${belowZero}`

};

const getPrice = async (address) => {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${address}&vs_currencies=USD`);
    const strAdd = ` '${address}'`
    const price = await response.data[address]['usd'];
    return price;
  } catch (e) {
    return "no coingecko price";
  }
}

const getValue = (amount, price) => {
  if (price === "no coingecko price") {
    return price;
  } else {
    const amnt = typeof amount === "number" ? amount : Number(amount);
    const prc = typeof price === "number" ? price : Number(price);
    const value = Number(amnt * prc).toFixed(2);
    return value;
  }
}

getPairs(0);
