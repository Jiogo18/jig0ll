import { EmbedMaker } from '../lib/messageMaker.js';
import { Snowflake } from '../lib/snowflake.js';
import { getFrenchDate } from '../lib/date.js';
import { Channel, Guild, Role, User } from 'discord.js';
import { ReceivedCommand } from '../bot/command/received.js';

const snowflakeLink = 'https://discord.js.org/#/docs/main/stable/typedef/Snowflake';

export default {
	name: 'info',
	description: 'Informations sur le snowflake de la cible',

	interaction: true,
	security: {
		place: 'private',
	},

	options: [
		{
			name: 'snowflake',
			description: "Informations d'un snowflake (id)",
			type: 1,
			options: [
				{
					name: 'snowflake',
					description: 'Informations du snowflake (id)',
					type: 4,
					required: true,
				},
			],
			execute: executeSnowflake,
		},
		{
			name: 'user',
			description: "Date de création de l'utilisateur",
			type: 1,
			options: [
				{
					name: 'user',
					description: "Date de création d'un utilisateur",
					type: 6,
				},
			],
			execute: executeInfoUser,
		},
		{
			name: 'channel',
			description: 'Date de création du salon',
			type: 1,
			options: [
				{
					name: 'channel',
					description: "Date de création d'un salon",
					type: 7,
				},
			],
			execute: executeInfoChannel,
		},
		{
			name: 'role',
			description: "Date de création d'un role",
			type: 1,
			options: [
				{
					name: 'role',
					description: "Date de création d'un role",
					type: 8,
					required: true, //il n'y a pas de role 'actuel'
				},
			],
			executeAttribute: executeInfoRole,
		},
		{
			name: 'guild',
			description: 'Date de création du serveur',
			type: 1,
			execute: executeInfoGuild,
		},
	],
};

/**
 * Make an embed message with `Info` as title
 * @param {string} description The content
 */
function makeMessage(description) {
	return new EmbedMaker('Info', description);
}
/**
 * Make an embed message with `Info` as title and a red color
 * @param {string} description The content
 */
function makeError(description) {
	return new EmbedMaker('Info', description, { color: 'red' });
}

/**
 * Get a mention/name of the target
 * @param {string|Guild|Channel|User|Role} target The target
 * @returns {string} A mention or a name to identify the target
 */
function getTargetName(target) {
	if (typeof target != 'object') return target;
	if (target.partial == false) return target;
	if (target.username) return target.username;
	return target; //sinon target.name éventuellement
}

/**
 * Get basic informations for the target
 * @param {string} targetTitle The type of the target
 * @param {string|Guild|Channel|User|Role} target The target
 */
function getBasicInfo(targetTitle, target) {
	const snowflake = new Snowflake(target.id);
	const date = getFrenchDate(snowflake.msecSinceEpoch);
	//si target est pas chargé ça affiche [object Object]

	const targetName = getTargetName(target);
	return makeMessage(
		`${target.name || target.username ? `Informations ${targetTitle} ${targetName}` : ''}
		Snowflake : ${target.id}
		Créé ${date}`
	);
}

/**
 * Get inforamtions about the target and his snowflake
 * @param {string} targetTitle The type of the target
 * @param {string|Guild|Channel|User|Role} target The target
 */
function getInfo(targetTitle, target) {
	const snowflake = new Snowflake(target.id);
	const time = snowflake.msecSinceDiscord;

	var info = getBasicInfo(targetTitle, target);
	info.addField(
		'Snowflake',
		`time : ${time} (${time.toString(2)})
		worker : ${snowflake.worker}
		pid : ${snowflake.pid}
		increment : ${snowflake.increment}
		(${snowflakeLink})`
	);
	return info;
}

/**
 * `info user` was called
 * @param {ReceivedCommand} cmdData
 * @param {*} levelOptions
 * @returns informations about the user targeted or the user who executed this command
 */
async function executeInfoUser(cmdData, levelOptions) {
	var userId = levelOptions ? levelOptions.user || (levelOptions[0] && levelOptions[0].value) : undefined;

	if (userId.match(/<@&(\d+)>/)) {
		return makeError(`Mention invalide, essayez de retapper la mention.`);
	}

	const matchMention = userId.match(/<@!?(\d+)>/);
	if (matchMention) userId = matchMention[1];
	console.debug(matchMention, userId);

	const user = await cmdData.bot.users.fetch(userId || cmdData.author.id);
	if (!user) {
		return makeMessage(`L'utilisateur ${userId} est introuvable`);
	}

	return getBasicInfo("de l'utilisateur", user);
}
/**
 * `info channel` was called
 * @param {ReceivedCommand} cmdData
 * @param {*} levelOptions
 * @returns informations about the channel targeted or the channel where this command is executed
 */
async function executeInfoChannel(cmdData, levelOptions) {
	const channelId = levelOptions ? levelOptions.channel || (levelOptions[0] && levelOptions[0].value) : undefined;

	const channel = await cmdData.guild.channels.resolve(channelId || cmdData.channel.id);
	if (!channel) {
		return makeMessage(`Le channel ${channelId} est introuvable`);
	}

	return getBasicInfo('du channel', channel).addField('', `Membres (minimum) : ${channel.members.array().length}`);
}
/**
 * `info role` was called
 * @param {ReceivedCommand} cmdData
 * @param {*} levelOptions
 * @returns informations about the role targeted
 */
async function executeInfoRole(cmdData, levelOptions) {
	const roleId = levelOptions.role || (levelOptions[0] && levelOptions[0].value);

	const role = roleId ? await cmdData.guild.roles.fetch(roleId) : undefined;
	if (!role) {
		return makeMessage(`Le role ${roleId} est introuvable`);
	}

	return getBasicInfo('du role', role).addField('', `Membres (minimum) : ${role.members.array().length}`);
}
/**
 * `info guild` was called
 * @param {ReceivedCommand} cmdData
 * @param {*} levelOptions
 * @returns informations about the guild
 */
function executeInfoGuild(cmdData) {
	const guild = cmdData.guild;
	return getBasicInfo('du serveur', guild).addField('', `Membres : ${guild.memberCount}`);
}

/**
 * `info snowflake` was called
 * @param {ReceivedCommand} cmdData
 * @returns informations about the snowflake
 */
function executeSnowflake(cmdData) {
	const option = cmdData.options ? cmdData.options[1] : undefined; //TODO: change this
	const snowflake = option ? option.value : undefined;
	if (snowflake == undefined) {
		return new EmbedMaker(
			'Snowflake',
			`Aucun snowflake
		(${snowflakeLink})`
		);
	}

	return getInfo('Snowflake', { id: snowflake });
}
