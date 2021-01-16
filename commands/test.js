const InteractionBase = require('../Interaction/base.js');
const MessageMaker = require('../Interaction/messageMaker.js');

var slashMgr = undefined
module.exports = {
	name: 'test',
	description: 'Tests diverses',
	interaction: true,
	public: false,
	wip: true,

	options: [{
		name: "empty_answer",
		description: "Test un retour vide lors de l'appel de l'intéraction",
		type: 1,

		execute(context) {
			context.sendAnswer(new MessageMaker.Message('Done'));
			return;
		}
	}]
};