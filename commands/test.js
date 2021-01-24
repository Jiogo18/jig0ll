const MessageMaker = require('../lib/messageMaker.js');


function sleep(milliseconds) {
	const start = Date.now();
	while (Date.now() - start < milliseconds);
}


module.exports = {
	name: 'test',
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
			context.sendAnswer(new MessageMaker.Message('Done'));
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
		description: "Prend 5 secondes à répondre",
		type: 1,
		execute() {
			sleep(5000);
			return new MessageMaker.Message('Done');
		}
	}]
};