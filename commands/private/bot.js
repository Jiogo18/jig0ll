import { EmbedMaker } from '../../lib/messageMaker.js';
import { getDurationTime } from '../../lib/date.js';
import DiscordBot from '../../bot/bot.js';
import { ReceivedCommand } from '../../bot/command/received.js';

export default {
	name: 'bot',
	description: 'Commandes pour gérer le bot',
	interaction: true,
	security: {
		place: 'private',
	},

	options: [
		{
			name: 'info',
			description: 'Informations sur le bot',
			type: 1,

			/**
			 * @param {ReceivedCommand} cmdData
			 */
			execute: cmdData => getInfo(cmdData.bot),
		},
		{
			//TODO: selectionner l'id puis quoi faire avec un str à choix multiple
			...idVerificator('cut', 'Arrête le bot', cmdData => {
				stop(cmdData.bot, cmdData.author.username);
				return new EmbedMaker('', `Stoppé par ${cmdData.author.username}`);
			}),
		},
		{
			...idVerificator('reset_id', "Change l'id du bot (id global: 0)", () => {
				resetLocalId();
				return new EmbedMaker('', `La nouvelle id du bot sur ${getBotLocation()} est ${getLocalId()}`);
			}),
		},
	],
};

/**
 * Reset the `local id` of the bot
 */
function resetLocalId() {
	const nb = Math.floor(Math.random() * 1000); //id à 3 chiffres
	process.localId = nb || 1; // 0 est un @a
}
resetLocalId();

/**
 * Get the `local id` of the bot
 * @returns {number}
 */
const getLocalId = _ => process.localId;

/**
 * Is it the id of this bot?
 * @param {number} idMsg
 * @returns {boolean} if `true` then this bot is targeted
 */
const isLocalId = idMsg => idMsg == 0 || getLocalId() == idMsg; //cible tous les bots ou ce bot

/**
 * Get a small description here the bot is
 */
function getBotLocation() {
	if (process.env.HEROKU) {
		return 'Heroku';
	} else if (process.env.COMPUTERNAME) {
		return process.env.COMPUTERNAME;
	}
	return 'Unkown';
}

/**
 * Get the session duraction of the bot
 */
const getSessionTime = start => getDurationTime(Date.now() - start);

/**
 * Get info on the bot
 * @param {DiscordBot} bot
 */
function getInfo(bot) {
	const idLocal = `Id local du bot : ${getLocalId()}`;
	const retour = new EmbedMaker('Informations sur bot', idLocal);

	retour.addField('Guilds', `Connecté sur ${bot.guilds.cache.size} serveurs`, true);
	retour.addField('Session', `Démarré sur ${getBotLocation()}\ndepuis ${getSessionTime(bot.startedTime)}`, true);

	return retour;
}

/**
 * Make an option with id verification
 * @deprecated TODO: Use a choice of option and ask the id then
 * @param {string} name Name of the option
 * @param {string} description Description of the option
 * @param {Function} funcExec Things to do if this bot is targeted
 */
function idVerificator(name, description, funcExec) {
	return {
		name: name,
		type: 1,
		description: description,
		options: [
			{
				name: 'id',
				description: description,
				required: true,
				type: 4,
			},
		],
		/**
		 * Executed with option(s)
		 * @param {ReceivedCommand} cmdData
		 * @param {*} levelOptions
		 */
		executeAttribute(cmdData, levelOptions) {
			if (!isLocalId(levelOptions[levelOptions.length - 1].value)) {
				cmdData.needAnswer = false;
				return; //ne réagit pas
			}
			return funcExec(cmdData);
		},
		/**
		 * Executed when there is no valid option
		 */
		execute() {
			return new EmbedMaker('', `${description}\nid de ce bot : ${getLocalId()} (bot sur ${getBotLocation()})`);
		},
	};
}

/**
 * Stop the bot
 * @deprecated TODO: use bot.stop() from DiscordBot
 * @param {DiscordBot} bot The bot
 * @param {string} source A name to identify the source
 */
export function stop(bot, source) {
	process.stopped = true;
	console.warn(`Stoppé par ${source} le ${new Date().toUTCString()}`.red);
	setTimeout(bot.destroy, 200); //arrêt dans 200 ms par sécurité
}
