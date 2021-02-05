const MessageMaker = require('../lib/messageMaker');
const SnowflakeLib = require('../lib/snowflake');
const DateLib = require('../lib/date');

module.exports = {

	name: 'info',
	description: 'Informations sur le snowflake de la cible',

	interaction: true,
	security: {
		place: 'private',
	},

	options: [{
		name: 'snowflake', 
		description: "Informations d'un snowflake (id)",
		type: 1,
		options: [{
			name: 'snowflake',
			description: 'Informations du snowflake (id)',
			type: 4,
			required: true,
		}],
		execute: executeSnowflake
	},{
		name: 'user',
		description: "Date de création de l'utilisateur",
		type: 1,
		options: [{
			name: 'user',
			description: "Date de création d'un utilisateur",
			type: 6,
		}],
		execute: executeInfoUser,
	},{
		name: 'channel',
		description: "Date de création du salon",
		type: 1,
		options: [{
			name: 'channel',
			description: "Date de création d'un salon",
			type: 7,
		}],
		execute: executeInfoChannel,
	},{
		name: 'role',
		description: "Date de création d'un role",
		type: 1,
		options: [{
			name: 'role',
			description: "Date de création d'un role",
			type: 8,
			required: true,//il n'y a pas de role 'actuel'
		}],
		executeAttribute: executeInfoRole,
	},{
		name: 'guild',
		description: 'Date de création du serveur',
		type: 1,
		execute: executeInfoGuild,
	}]
}



function makeMessage(description) {
	return new MessageMaker.Embed('Info', description);
}

function getTargetName(target) {
	if(typeof target != 'object') return target;
	if(target.partial == false) return target;
	if(target.username) return target.username;
	return target;//sinon target.name éventuellement
}

function getBasicInfo(targetTitle, target) {
	const snowflake = new SnowflakeLib.Snowflake(target.id);
	const date = DateLib.getFrenchDate(snowflake.msecSinceEpoch);
	//si target est pas chargé ça affiche [object Object]
	
	const targetName = getTargetName(target);
	return makeMessage(
		`${target.name || target.username ? `Informations ${targetTitle} ${targetName}` : ''}
		Snowflake : ${target.id}
		créé ${date}`);
}

function getInfo(targetTitle, target) {
	const snowflake = new SnowflakeLib.Snowflake(target.id);
	const time = snowflake.msecSinceDiscord;

	var info = getBasicInfo(targetTitle, target);
	info.addField('Snowflake',
		`time : ${time} (${time.toString(2)})
		worker : ${snowflake.worker}
		pid : ${snowflake.pid}
		increment : ${snowflake.increment}
		(https://discord.js.org/#/docs/main/stable/typedef/Snowflake)`);
	return info;
}


async function executeInfoUser(cmdData, levelOptions) {
	const userId = levelOptions ? levelOptions.user || (levelOptions[0] && levelOptions[0].value) : undefined;

	const user = await cmdData.bot.users.fetch(userId || cmdData.author.id);
	if(!user) {
		return makeMessage(`L'utilisateur ${userId} est introuvable`);
	}

	return getBasicInfo("de l'utilisateur", user);
}
async function executeInfoChannel(cmdData, levelOptions) {
	const channelId = levelOptions ? levelOptions.channel || (levelOptions[0] && levelOptions[0].value) : undefined;

	const channel = await cmdData.guild.channels.resolve(channelId || cmdData.channel.id);
	if(!channel) {
		return makeMessage(`Le channel ${channelId} est introuvable`);
	}

	return getBasicInfo("du channel", channel).addField('',
		`Membres (minimum) : ${channel.members.array().length}`);
}
async function executeInfoRole(cmdData, levelOptions) {
	const roleId = levelOptions.role || (levelOptions[0] && levelOptions[0].value);

	const role = roleId ? await cmdData.guild.roles.fetch(roleId) : undefined;
	if(!role) {
		return makeMessage(`Le role ${roleId} est introuvable`);
	}

	return getBasicInfo("du role", role).addField('',
		`Membres (minimum) : ${role.members.array().length}`);
}
function executeInfoGuild(cmdData) {
	const guild = cmdData.guild;
	return getBasicInfo("du serveur", guild).addField('',
		`Membres : ${guild.memberCount}`);
}



function executeSnowflake(cmdData) {
	const option = cmdData.options ? cmdData.options[1] : undefined;//TODO: change this
	const snowflake = option ? option.value : undefined;
	if(snowflake == undefined) {
		return new MessageMaker.Embed('Snowflake', `Aucun snowflake
		(https://discord.js.org/#/docs/main/stable/typedef/Snowflake)`);
	}

	return getInfo('Snowflake', {id: snowflake});
}