module.exports = {
	name: 'ping',
	description: 'Pong!',
	security: 'wip',
	execute() {
		// return {
		// 	data: {
		// 		type: 1
		// 	}
		// }
		return `Pong! ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', timeZoneName: 'short' })}`;
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