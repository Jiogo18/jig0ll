const MessageMaker = require('../lib/messageMaker.js');
const libDate = require('../lib/date.js');

function resetLocalId() {
	const nb = Math.floor(Math.random() * 1000);//id à 3 chiffres
	process.localId = nb==0 ? 1 : nb;
}
resetLocalId();
function getLocalId() { return process.localId; }
function isLocalId(idMsg) {
	if(idMsg == 0) return true;//cible tout le monde
	return getLocalId() == idMsg;
}


function getBotLocation() {
	if(process.env.HEROKU) {
		return 'Heroku';
	}
	else if(process.env.COMPUTERNAME) {
		return process.env.COMPUTERNAME;
	}
	return 'Unkown'
}

function getSessionTime(start) { return libDate.getDurationTime(Date.now() - start); }



function getInfo(bot) {
	const idLocal = `Id local du bot : ${getLocalId()}`;
	const retour = new MessageMaker.Embed('Informations sur bot', idLocal);

	retour.addField('Guilds', `Connecté sur ${bot.guilds.cache.array().length} serveurs`, true);
	retour.addField('Session', `Démarré sur ${getBotLocation()}\ndepuis ${getSessionTime(bot.startedTime)}`, true);

	return retour;
}



function idVerificator(name, description, funcExec) {
	return {
		name: name,
		type: 1,
		description: description,
		options: [{
			name: 'id',
			description: description,
			required: true,
			type: 4,
			execute(cmdData) {
				const length = cmdData.optionsValue.length;
				if(!isLocalId(cmdData.options[length-1].value)) return;//ne réagit pas

				return funcExec(cmdData);
			}
		}],
		execute() { return new MessageMaker.Embed('', `${description}\nid de ce bot : ${getLocalId()} (bot sur ${getBotLocation()})`); }
	}
}


module.exports = {

	name: 'bot',
	description: "Commandes pour gérer le bot",
	interaction: true,
	security: {
		place: 'private',
	},

	options: [{
		name: 'info',
		description: "Informations sur le bot",
		type: 1,

		execute(cmdData) { return getInfo(cmdData.bot); }
	},
		idVerificator('cut', 'Arrête le bot', cmdData => {
			
			module.exports.stop(cmdData.bot, cmdData.author.username);
			return new MessageMaker.Embed('', `Stoppé par ${cmdData.author.username}`);
		}),
	
		idVerificator('reset_id', "Change l'id du bot (id global: 0)", () => {
			resetLocalId();
			return new MessageMaker.Embed('', `La nouvelle id du bot sur ${getBotLocation()} est ${getLocalId()}`);
		}),
	],

	stop(bot, source) {
		process.stopped = true;
		console.warn(`Stoppé par ${source} le ${new Date().toUTCString()}`.red);
		setTimeout(function() {
			bot.destroy();
		}, 200);//arrêt dans 200 ms par sécurité
	}
}