const Config = require('../Interaction/config.js');
const MessageMaker = require('../Interaction/messageMaker.js');

function getRandomId() {
	return Math.floor(Math.random() * 10000);//id à 4 chiffres
}

const id = getRandomId();


module.exports = {
	name: 'cut',
	description: 'Arrêter le bot avec une clé de vérification',
	interaction: false,
	isAllowedToUse(cmdData) { return [ Config.jiogo18 ].includes(cmdData.author.id); },
	private: true,
	wip: true,

	options: [{
		name: 'clé',
		description: 'Arrête le bot avec son id de vérification',
		type: 4,
		required: false,

		execute(cmdData) {
			const idMsg = cmdData.optionsValue[0];
			if(id == idMsg) {
				console.warn(`Demande d'arrêt par ${cmdData.author.username}`);
			}
			return new MessageMaker.Embed('', `Work in progress ${idMsg} ${id}`);
		}
	}],


	execute() {
		return new MessageMaker.Embed('', `Pour éteindre ce bot ecrivez "/cut ${id}"`);
	}
}