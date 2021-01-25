const MessageMaker = require('../lib/messageMaker.js');

const done = new MessageMaker.Message('Done');

function sleep(milliseconds) {
	const start = Date.now();
	while (Date.now() - start < milliseconds);
}


module.exports = {
	name: 'debug',
	description: 'Tests diverses',
	interaction: true,

	security: {
		place: 'private',
	},

	options: [{
		name: "empty_answer",
		description: "Test un retour vide lors de l'appel de l'interaction",
		type: 1,

		execute(context) {
			context.sendAnswer(done);
			return;
		}
	},{
		name: 'error',
		description: "Fait une erreur lors de l'exécution",
		type: 1,
		execute() {
			throw `Erreur demandée par "/test error"`;
		}
	},{
		name: 'sleep',
		description: "Prend 5 secondes pour répondre",
		type: 1,
		execute() {
			sleep(5000);
			return done;
		}
	},{
		name: 'await',
		description: "Prend 5 secondes pour répondre",
		type: 1,
		async execute() {
			await new Promise(r => setTimeout(r, 5000));
			return done;
		}
	},{
		name: 'commandline',
		description: 'Command line',
		type: 2,
		options: [{
			name: 'long', description: 'A long command line', type: 1,
			execute() { return done; },
			options: [{
				name: 'very_long', description: 'A very long command line', type: 3,
				execute() { return done; }
			}]
		}]
	}]
};