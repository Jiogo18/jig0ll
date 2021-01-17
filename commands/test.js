const MessageMaker = require('../Interaction/messageMaker.js');


module.exports = {
	name: 'test',
	description: 'Tests diverses',
	interaction: true,
	private: true,

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
	}]
};