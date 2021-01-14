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

		execute(context, application) {
			if(context.isInteraction && context.commandSource)
				application.interaction.sendAnswer(context.commandSource, 'Done');
			else if(context.isMessage && context.channel.send)
				context.channel.send(`Done`);
			return;
		}
	}]
};