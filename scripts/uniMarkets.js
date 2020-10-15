const Web3 = require("web3");
const fs = require("fs");
const events = require("../logs/events.js");
const factoryAbi = require("../abi/uniswapV2factoryAbi.js");

const web3 = new Web3("ws://localhost:8546");

const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const factoryContract = new web3.eth.Contract(factoryAbi, factoryAddress);
const createPairTopic =
  "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9";

const getPastLogs = async (address, fromBlock, toBlock) => {
  try {
    let res = await web3.eth.getPastLogs({
      fromBlock,
      toBlock,
      address
    });

    let updatedEvents = [...events];

    res.forEach((item) => {
      updatedEvents.push(item)
      console.log(`🦄 pair #${updatedEvents.length} deployed in block #${item.blockNumber}`)
    });

    fs.writeFile("./logs/events.js", await `module.exports = ${JSON.stringify(updatedEvents)}`, (e) => {
      if (e) {
        console.log(e)
      }
    });

  } catch (e) {
    console.log(e);
  }

  setTimeout(() => {
    console.log("updated");
    process.exit();
  }, 2000);
};

getPastLogs(factoryAddress, events[events.length - 1].blockNumber + 1, "latest");
