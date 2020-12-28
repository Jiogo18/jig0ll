const InteractionBase = require('../Interaction/base.js');

var slashMgr = undefined
module.exports = {
	name: 'test',
	description: 'Tests diverses',
	security: 'private',

	options: [{
		name: "empty_answer",
		description: "Test un retour vide lors de l'appel de l'intéraction",
		type: 1,

		execute(interaction) {
			slashMgr.sendAnswer(interaction, 'Done');
			return;
		}
	}],

	setBot(bot) {
		slashMgr = InteractionBase ? new InteractionBase(bot) : undefined;
	}
};