const MessageMaker = require('../Interaction/messageMaker');

module.exports = {
	name: 'ping',
	description: 'Pong!',
	interaction: true,
	public: true,
	wip: true,

	execute() {
		// return {
		// 	data: {
		// 		type: 1
		// 	}
		// }
		return new MessageMaker.Message(`Pong! ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', timeZoneName: 'short' })}`);
	},

	/*options: [{
		name: "a",
		description: "desc1",
		type: 1,// 1 is type SUB_COMMAND
		execute() { return 'Pong a!' }
	},{
		name: "b",
		description: "desc2",
		type: 1,
		execute() { return 'Pong b!' }
	}]*/
};