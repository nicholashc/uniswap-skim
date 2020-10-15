const Web3 = require('web3');
const fs = require('fs');
const events = require('../logs/events.js');

const web3 = new Web3('ws://localhost:8546');

const factoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

const getPastLogs = async (address, fromBlock, toBlock) => {
	try {
		const response = await web3.eth.getPastLogs({
			fromBlock,
			toBlock,
			address
		});

		const updatedEvents = [...events];

		response.forEach(item => {
			updatedEvents.push(item);
			console.log(`🦄 pair #${updatedEvents.length} deployed in block #${item.blockNumber}`);
		});

		fs.writeFile('./logs/events.js', await `module.exports = ${JSON.stringify(updatedEvents)}`, error => {
			if (error) {
				console.log(error);
			}
		});
	} catch (error) {
		console.log(error);
	}

	setTimeout(() => {
		console.log('updated');
		process.exit();
	}, 2000);
};

getPastLogs(factoryAddress, events[events.length - 1].blockNumber + 1, 'latest');
