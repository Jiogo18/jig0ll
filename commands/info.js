const MessageMaker = require('../lib/messageMaker');
const SnowflakeLib = require('../lib/snowflake');
const DateLib = require('../lib/date');

function makeMessage(description) {
	return new MessageMaker.Embed('Info', description);
}

function getInfo(targetTitle, target) {
	const snowflake = new SnowflakeLib.Snowflake(target.id);
	const time = snowflake.msecSinceDiscord;
	const date = DateLib.getFrenchDate(snowflake.msecSinceEpoch);
	//si target est pas chargé ça affiche [object Object]
	const targetName = target.partial != false ? target.username : target;
	const retour = makeMessage(
		`${target.name || target.username ? `Informations ${targetTitle} ${targetName}` : ''}
		Snowflake : ${target.id}
		timestamp : ${snowflake.secSinceEpoch}
		créé ${date}`);
	
	retour.addField('Snowflake',
		`time : ${time} (${time.toString(2)})
		worker : ${snowflake.worker}
		pid : ${snowflake.pid}
		increment : ${snowflake.increment}
		(https://discord.js.org/#/docs/main/stable/typedef/Snowflake)`);
	return retour;
}


module.exports = {

	name: 'info',
	description: 'Informations sur le snowflake de la cible',

	interaction: true,
	security: {
		place: 'private',
		wip: true,
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
		execute: executeInfoChannel,
	},{
		name: 'guild',
		description: 'Date de création du serveur',
		type: 1,
		execute: executeInfoGuild,
	}]
}






function executeInfoUser(cmdData) {
	const option = cmdData.options ? cmdData.options[1] : undefined;//TODO: change this (en "localOption")
	const userId = option ? option.value : undefined;

	const user = userId ? cmdData.bot.users.cache.get(userId) : cmdData.author;
	if(!user) {
		return makeMessage(`L'utilisateur ${userId} est introuvable`);
	}

	return getInfo("de l'utilisateur", user);
}
function executeInfoChannel(cmdData) {
	const option = cmdData.options ? cmdData.options[1] : undefined;//TODO: change this (en "localOption")
	const channelId = option ? option.value : undefined;

	const channel = channelId ? cmdData.guild.channels.cache.get(channelId) : cmdData.channel;
	if(!channel) {
		return makeMessage(`Le channel ${channelId} est introuvable`);
	}

	return getInfo("du channel", channel);
}
function executeInfoGuild(cmdData) {
	return getInfo("du serveur", cmdData.guild);
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