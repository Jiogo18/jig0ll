import { EmbedMaker } from '../../lib/messageMaker.js';
import { getDurationTime } from '../../lib/date.js';


export default {

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
	},{
		//TODO: selectionner l'id puis quoi faire avec un str à choix multiple
		...idVerificator('cut', 'Arrête le bot', cmdData => {
			stop(cmdData.bot, cmdData.author.username);
			return new EmbedMaker('', `Stoppé par ${cmdData.author.username}`);
		}),
	},{
		...idVerificator('reset_id', "Change l'id du bot (id global: 0)", () => {
			resetLocalId();
			return new EmbedMaker('', `La nouvelle id du bot sur ${getBotLocation()} est ${getLocalId()}`);
		}),
	}],
}



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

function getSessionTime(start) { return getDurationTime(Date.now() - start); }



function getInfo(bot) {
	const idLocal = `Id local du bot : ${getLocalId()}`;
	const retour = new EmbedMaker('Informations sur bot', idLocal);

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
		}],
		executeAttribute(cmdData, levelOptions) {
			if(!isLocalId(levelOptions[levelOptions.length-1].value)) {
				cmdData.needAnswer = false;
				return;//ne réagit pas
			}
			return funcExec(cmdData);
		},
		execute() { return new EmbedMaker('', `${description}\nid de ce bot : ${getLocalId()} (bot sur ${getBotLocation()})`); }
	}
}

export function stop(bot, source) {
	process.stopped = true;
	console.warn(`Stoppé par ${source} le ${new Date().toUTCString()}`.red);
	setTimeout(bot.destroy, 200);//arrêt dans 200 ms par sécurité
}
