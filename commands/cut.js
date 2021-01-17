const security = require('../Interaction/security.js');
const MessageMaker = require('../lib/messageMaker.js');


module.exports = {
	name: 'cut',
	description: 'Arrêter le bot avec une clé de vérification',
	interaction: false,
	isAllowedToUse(cmdData) { return security.isHightPrivilegeUser(cmdData.author.id); },
	private: true,

	options: [{
		name: 'clé',
		description: 'Arrête le bot avec son id de vérification',
		type: 4,
		required: false,

		execute(cmdData) {
			const idMsg = cmdData.optionsValue[0];
			if(cmdData.bot.localId != idMsg) return;//ne réagit pas

			const date = new Date().toUTCString();
			console.log(`Stoppé par ${cmdData.author.username} le ${date}`.red);
			setTimeout(function() {//arrêt dans 200 ms
				cmdData.bot.destroy();
			}, 200);
			return new MessageMaker.Embed('', `Stoppé par ${cmdData.author.username}`);
		}
	}],


	execute(cmdData) {
		var suffix = 'Unkown';
		if(process.env.HEROKU) {
			suffix = 'Heroku';
		}
		else if(process.env.COMPUTERNAME) {
			suffix = process.env.COMPUTERNAME;
		}
		return new MessageMaker.Embed('', `Pour éteindre ce bot ecrivez "!cut ${cmdData.bot.localId}" (bot sur ${suffix})`);
	}
}