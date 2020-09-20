const Web3 = require("web3");

const pairAbi = require("../abi/uniswapV2pairAbi.js");
const events = require("../logs/events.js");
const erc20abi = require("../abi/erc20abi.js");
const axios = require('axios').default;

const web3 = new Web3("ws://localhost:8545");

const {
  BN
} = web3.utils;

const createPairTopic =
  "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9";

let i = 0;
const minDollarVal = 0.01;

const getPairs = async (count) => {
  if (count < events.length) {
    if (events[count].topics[0] === createPairTopic) {
      const pairAdd = `0x${events[count].data.slice(26, 66)}`;
      const token0Add = `0x${events[count].topics[1].slice(26, 66)}`;
      const token1Add = `0x${events[count].topics[2].slice(26, 66)}`;
      try {
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
          `${getName(token0Add)}, bad ERC20 name` :
          await token0contract.methods.name().call();

        let name1 =
          getName(token1Add) != false ?
          `${getName(token1Add)}, bad ERC20 name` :
          await token1contract.methods.name().call();

        const reserves = await pairContract.methods
          .getReserves()
          .call();

        const res0 = await reserves[0];
        const res1 = await reserves[1];

        const bal0 = await token0contract.methods
          .balanceOf(pairAdd)
          .call();
        const bal1 = await token1contract.methods
          .balanceOf(pairAdd)
          .call();

        const dec0 = await token0contract.methods.decimals().call();
        const dec1 = await token1contract.methods.decimals().call();

        const balance0 = splitBN(bal0, dec0, true);
        const reserve0 = splitBN(res0, dec0, true);
        const balance1 = splitBN(bal1, dec1, true);
        const reserve1 = splitBN(res1, dec1, true);

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
              diff: splitBN(diff0.toString(), dec0, true),
              usdPrice: await getPrice(token0Add),
              value: await getValue(splitBN(diff0.toString(), dec0, false), await getPrice(token0Add))
            } : false
          },
          token1: {
            address: token1Add,
            name: name1,
            decimals: dec1,
            balance: balance1,
            reserve: reserve1,
            imbalance: diff1.toString() > 0 ? {
              diff: splitBN(diff1.toString(), dec1, true),
              usdPrice: await getPrice(token1Add),
              value: await getValue(splitBN(diff1.toString(), dec1, false), await getPrice(token1Add))
            } : false
          }
        };

        if (
          !tokenBlackList.includes(token0Add) &&
          !tokenBlackList.includes(token1Add)
        ) {
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
                pair.token0.imbalance.value = `\$${(pair.token0.imbalance.value).toLocaleString()}🦄`
              }
              if (pair.token1.imbalance.value) {
                pair.token1.imbalance.value = `\$${(pair.token1.imbalance.value).toLocaleString()}🦄`
              }
              console.log(`${JSON.stringify(pair, null, 2)},`);
            }
          }
        }
      } catch (e) {
        if (
          tokenBlackList.includes(
            `0x${events[count].topics[1].slice(26, 66)}`
          ) ||
          tokenBlackList.includes(
            `0x${events[count].topics[2].slice(26, 66)}`
          )
        ) {} else {
          console.log(
            `error in pair: 0x${events[count].data.slice(26, 66)}`
          );
        }
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

const splitBN = (num, dec, comma) => {

  if (num.indexOf('e') !== -1) {
    let exp = num.substring(num.length - 2, num.length)
    let first = num.substring(0, 1)
    let next = num.substring(3, (exp - dec + 3))
    let aboveZero = first.concat(next)
    let belowZero = num.substring(4, (num.length - 4))
    if (comma) {
      aboveZero = first.concat(",").concat(next);
      return `${aboveZero}.${belowZero.padEnd(dec, "0")}`;
    } else {
      return `$${aboveZero}.${belowZero.padEnd(dec, "0")}`;
    }
  } else {
    let aboveZero = num.length > dec ? num.substring(0, num.length - dec) : 0;
    let belowZero =
      num.length >= dec ? num.substring((num.length - dec), num.length) : num.padStart(dec, "0");
    if (comma) {
      return `${aboveZero.toLocaleString()}.${belowZero}`;
    } else {
      return `${aboveZero}.${belowZero}`;
    }
  }


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

const tokenBlackList = [
  "0x067f323c48ef16960d6e228b2af832e3f52ea3a3",
  "0x0c5453981e1212cd240d2b86c0c11594f3e4028c",
  "0x0cb24416e189406dbb8a1a3315549f9fdf50edd5",
  "0x103041af1784a9d2c2a84137067244d2f1743438",
  "0x169d73e2f4d1e54ce93ba5a55f1ecab745bbbafd",
  "0x20ec8f993f4b277af49c6635048fb244828452ce",
  "0x235c2f9bb90f6f57374937c05ba8b2f7efedf037",
  "0x48f3a4bdb86e09afdb0b26c71bb744a7fc57b1df",
  "0x5ba6052522f4745ed7af90ba383631f47dcb8fbe",
  "0x6b57ca5ac03a2549aafe8df29ca95cd22dcc634a",
  "0x6d8fdf6f1efcc17f2abe4ff9b51657157127b916",
  "0x7ad6df602fd87b1b0b0af11b0b82b1f6a327e1f9",
  "0x83123972111280ed31b326dcb92b6409b789a6f9",
  "0x97b883e9437a070d891cb5b07405953558f521f7",
  "0xa16ad0ee175cd5617249c0b50fa37bfc01fba31e",
  "0xa4d2255949b8d255cb62e3e8c37f43d1217e0546",
  "0xd61b9d3544be6da0e59a3d2f2cc36cb42d5b4235",
  "0xd670779338e6c089da12694d30935393e4489a22",
  "0xcd32c2d1fdbf9208c0833cb3f5fc9543c3d85f62",
  "0xc47828014f40322fc24d9c2340ef29d754d67cf4",
  "0xd670779338e6c089da12694d30935393e4489a22",
  "0xe0b7927c4af23765cb51314a0e0521a9645f0e2a",
  "0x103041af1784a9d2c2a84137067244d2f1743438",
  "0xeb9951021698b42e4399f9cbb6267aa35f82d59d",
  "0x9d3e3fe95128cb91d5b954ac85b2dfd0c9407c8b",
  "0x1e420ae1eeb9b20df18ad59eff6ec4aaa729bf69",
  "0x4e1f749d1e5af09f6cf27ca30f7e2a6597279a33",
  "0x675495e7db208069be3710c0924d0cfc4ae5bfca",
  "0x8b713aa0856e97fc2338bd707ea656b75f81552f",
  "0x9504a6a6c61d6a34ff800f92f6bc2ab494a00200",
  "0x1d7afc46d5aa01957027497d0c687e30a92129d4",
  "0x94564dcf383c3a6e48f8fd39553fba3711f8be88",
  "0x6e743b854bc937a794dd43e36b04cc6a13bfd063",
  "0xfb3ef7e93fc5141fdd26ee0e4f39f7ecaeede0a6",
  "0xda16399dbfcf5fd1bcd46066f7a17856c24fc7f3",
  "0xbc6e3cfde888e215bf7e425ee88cb133b1210be9"
];

const whitelist = [{
    address: "0xf1290473e210b2108a85237fbcd7b6eb42cc654f",
    name: "HEDG"
  },
  {
    address: "0xf03f8d65bafa598611c3495124093c56e8f638f0",
    name: "VIEW"
  },
  {
    address: "0xeb269732ab75a6fd61ea60b06fe994cd32a83549",
    name: "dForce (USDx)"
  },
  {
    address: "0xdf2c7238198ad8b389666574f2d8bc411a4b7428",
    name: "Mainframe"
  },
  {
    address: "0xdd974d5c2e2928dea5f71b9825b8b646686bd200",
    name: "Kyber"
  },
  {
    address: "0xce1412f2593bd6f17f91c7087ac9336f72a4bb30",
    name: "PASTA"
  },
  {
    address: "0xa7de087329bfcda5639247f96140f9dabe3deed1",
    name: "Statera"
  },
  {
    address: "0xa16001dd47f505b7b7c5639c710a52209e4e8904",
    name: "Alpha Fund"
  },
  {
    address: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
    name: "Maker"
  },
  {
    address: "0x9f284e1337a815fe77d2ff4ae46544645b20c5ff",
    name: "Darwinia Commitment Token (KTON)"
  },
  {
    address: "0x9469d013805bffb7d3debe5e7839237e535ec483",
    name: "Darwinia Network Native Token (RING)"
  },
  {
    address: "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
    name: "SAI"
  },
  {
    address: "0x4dfd148b532e934a2a26ea65689cf6268753e130",
    name: "governance token MonolithosDAO (MDT)"
  },
  {
    address: "0x4cd988afbad37289baaf53c13e98e2bd46aaea8c",
    name: "KEY"
  },
  {
    address: "0x431ad2ff6a9c365805ebad47ee021148d6f7dbe0",
    name: "dForce (DF)"
  },
  {
    address: "0x355c665e101b9da58704a8fddb5feef210ef20c0",
    name: "dForce (GOLDx)"
  },
  {
    address: "0x1f0d3048b3d49de0ed6169a443dbb049e6daa6ce",
    name: "BET99"
  },
  {
    address: "0x08a2e41fb99a7599725190b9c970ad3893fa33cf",
    name: "PASTA"
  },
  {
    address: "0xc7fd9ae2cf8542d71186877e21107e1f3a0b55ef",
    name: "y3d"
  },
  {
    address: "0xf48ae105dd2ff24e44a066a3c1e47db7fb751bc2",
    name: "BSB YAM Token (BSBYAM)"
  },
  {
    address: "0x4491f2e8b90be1d808707d7d1a8efa8fd2011d6c",
    name: "DegenMoney"
  },
  {
    address: "0x9043d4d51c9d2e31e3f169de4551e416970c27ef",
    name: "PrimeDai"
  },
  {
    address: "0xe54f9e6ab80ebc28515af8b8233c1aee6506a15e",
    name: "PASTA"
  },
  {
    address: "0x6b4c34daed57add9997767534cd5f2597cc2a45a",
    name: "y3d"
  },
  {
    address: "0x995de3d961b40ec6cdee0009059d48768ccbdd48",
    name: "ufc"
  },
  {
    address: "0x0d88ed6e74bbfd96b831231638b66c05571e824f",
    name: "AVT"
  }
];

getPairs(0);
