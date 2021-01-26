const MessageMaker = require('../lib/messageMaker');


module.exports = {

	name: 'snowflake',
	description: 'Informations sur le snowflake de la cible',

	interaction: true,
	security: {
		place: 'private',
		wip: true,
	},



	options: [{
		name: 'timestamp',
		description: 'Date de création de la cible',
		type: 1,

		options: [{
			name: 'user',
			description: "Date de créaction de l'utilisateur",
			type: 6
		},{
			name: 'channel',
			description: "Date de créaction du channel",
			type: 7
		}],
	
		execute: executeTimeout
	}]
}




function executeTimeout(cmdData) {
	const option = cmdData.options ? cmdData.options[1] : undefined;//TODO: change this
	const targetId = option ? option.value : undefined;
	var retour = `l'ID ${targetId} n'a donné aucun résultat`;
	switch(option ? option.name : 'guild') {
		case undefined:
		case 'user':
			const users = cmdData.bot.users;
			const user = users.cache.get(targetId);
			if(user != undefined) {
				console.debug(user);
				retour = `Time stamp de l'utilisateur ${user} : ${user.createdTimestamp}
				${user.createdAt}`;
				break;
			}
			//sinon on va à default

		case 'channel':
			const channels = cmdData.guild.channels;//les channels de la guild
			const channel = channels.cache.get(targetId);//le channel demandé
			if(channel != undefined) {
				retour = `Time stamp du channel ${channel} : ${channel.createdTimestamp}
				${channel.createdAt}`;
				break;
			}

		default:
			const guild = cmdData.guild;//le channel demandé
			if(guild != undefined) {
				retour = `Timestamp de la guild ${guild} : ${guild.createdTimestamp}
				${guild.createdAt}`;
			}
			break;
	}
	return new MessageMaker.Embed('Timestamp', retour);
}