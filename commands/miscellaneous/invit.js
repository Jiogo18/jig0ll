import { Guild } from 'discord.js';
import { ReceivedCommand } from '../../bot/command/received.js';
import { EmbedMaker } from '../../lib/messageMaker.js';

export default {

	name: 'invit',
	description: 'Actions sur les invitations',
	interaction: true,
	
	security: {
		place: 'public',
		wip: true,
	},

	options: [{
		name: 'list',
		type: 1,
		description: 'Liste des invitations du serveur',

		options: [{
			name: 'guild',
			description: 'Serveur ciblé',
			type: 3,
		}],

		/**
		 * '!invit list <guildid|guildname>'
		 * @param {ReceivedCommand} cmdData 
		 * @param {[]} levelOptions
		 */
		async executeAttribute(cmdData, levelOptions) {
			const guild_id = levelOptions.guild || levelOptions[0]?.value;
			if (!guild_id) return this.execute(cmdData);

			const guilds = cmdData.bot.guilds.cache;
			const guild = guilds.get(guild_id) || guilds.find(guild => guild.name == guild_id);
			if (!guild) return makeError(`Impossible de trouver le serveur '${guild_id}'`);

			return list(guild);
		},
		/**
		 * '!invit list'
		 * @param {ReceivedCommand} cmdData 
		 */
		async execute(cmdData) { return list(cmdData.guild) },
	}],
}



function makeMessage(description) {
	return new EmbedMaker('Invitations', description);
}
function makeError(description) {
	return new EmbedMaker('Invitations', description,  { color: 'red' });
}



/**
 * Liste les intéraction du serveur
 * @param {Guild} guild 
 */
async function list(guild) {
	if (!guild) return makeError('Vous devez être dans un serveur pour éxecuter ceci');
	var invites;
	
	try {
		invites = await guild.fetchInvites();
	}
	catch (err) {
		console.error(`Error while getting invites of the guild ${guild.id}`.red, err);
		return makeError('Impossible de récupérer les invitations du serveur, la permission `Ggérer le serveur` doit être activée');
	}

	console.log(invites);

	var invitesDesc = invites.map(i => `code:${i.code}, memberCount:${i.memberCount}, uses:${i.uses}, maxUses:${i.maxUses}, inviter:${i.inviter.username}, createTimestamp:${i.createdTimestamp}`);


	return makeMessage([`Fetched ${invites.size} invites : `, ...invitesDesc].join('\n'));
}