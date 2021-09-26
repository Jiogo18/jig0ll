import { Collection, Guild, User } from 'discord.js';
import { CommandLevelOptions, ReceivedCommand } from '../../bot/command/received.js';
import { EmbedMaker } from '../../lib/messageMaker.js';

export default {
	name: 'invit',
	description: 'Tests sur les invitations',

	security: {
		place: 'public',
		interaction: true,
		wip: true,
	},

	options: [
		{
			name: 'list',
			type: 1,
			description: 'Liste des invitations du serveur',

			options: [
				{
					name: 'guild',
					description: 'Serveur ciblé',
					type: 3,
				},
			],

			/**
			 * '!invit list <guildid|guildname>'
			 * @param {ReceivedCommand} cmdData
			 * @param {CommandLevelOptions} levelOptions
			 */
			async executeAttribute(cmdData, levelOptions) {
				const guild_id = levelOptions.getArgumentValue('guild', 0);
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
			execute: cmdData => list(cmdData.guild),
		},
		{
			name: 'per_user',
			description: 'Compte les membres invités par chaque utilisateur',
			type: 1,

			options: [
				{
					name: 'guild',
					description: 'Serveur ciblé',
					type: 3,
				},
			],

			/**
			 * '!invit per_user <guildid|guildname>'
			 * @param {ReceivedCommand} cmdData
			 * @param {CommandLevelOptions} levelOptions
			 */
			async executeAttribute(cmdData, levelOptions) {
				const guild_id = levelOptions.getArgumentValue('guild', 0);
				if (!guild_id) return this.execute(cmdData);

				const guild = await cmdData.bot.guilds.fetch(guild_id);
				if (!guild) return makeError(`Impossible de trouver le serveur '${guild_id}'`);

				return displayCountPerUser(guild);
			},

			/**
			 * !invit per_user
			 * @param {ReceivedCommand} cmdData
			 */
			execute: async cmdData => displayCountPerUser(await cmdData.context.getGuild()),
		},
	],
};

function makeMessage(description) {
	return new EmbedMaker('Invitations', description);
}
function makeError(description) {
	return EmbedMaker.Error('Invitations', description);
}

/**
 * Liste les intéraction du serveur
 * @param {Guild} guild
 */
async function list(guild) {
	if (!guild) return makeError('Vous devez être dans un serveur pour éxecuter ceci');
	var invites;

	try {
		invites = await guild.invites.fetch();
	} catch (error) {
		process.consoleLogger.commandError('/invit list ${guild.id}', error);
		return makeError('Impossible de récupérer les invitations du serveur, la permission `Ggérer le serveur` doit être activée');
	}

	var invitesDesc = invites.map(
		i =>
			`code:${i.code}, memberCount:${i.memberCount}, uses:${i.uses}, maxUses:${i.maxUses}, inviter:${i.inviter?.username}, createTimestamp:${i.createdTimestamp}`
	);

	if (invites.size == 0) {
		return makeMessage(`No invits in ${guild.name}`);
	}
	return makeMessage([`Fetched ${invites.size} invites in ${guild.name} : `, ...invitesDesc].join('\n'));
}

/**
 * Get invites of the guild
 * @param {Guild} guild
 */
export async function getInvites(guild) {
	if (!guild) throw 'Vous devez être dans un serveur pour exécuter ceci';

	try {
		return await guild.invites.fetch();
	} catch (error) {
		process.consoleLogger.commandError(`/invit per_user ${guild.id}`, error);
		throw 'Impossible de récupérer les invitations du serveur, la permission `Gérer le serveur` doit être activée';
	}
}

/**
 * Count and sort the number of uses of invitations with the user who created the invite
 * @param {[{user: User, uses: number}]} invites
 */
export async function countInvitesPerUserSorted(invites) {
	if (!invites) return;

	/**
	 * Addition de toutes les invitations
	 * @type {Collection<User,number>}
	 */
	const per_user = new Collection();
	invites.forEach(i => {
		const user = i.inviter;
		per_user.set(user, i.uses + (per_user.get(user) || 0));
	});

	/**
	 * Toutes les invitations triées
	 * @type {[{user: User, uses: number}]}
	 */
	var invitesSorted = [];
	per_user.filter((v, k) => k != null).forEach((uses, user) => invitesSorted.push({ user, uses }));
	invitesSorted = invitesSorted.sort((a, b) => a.uses - b.uses);

	return invitesSorted;
}

/**
 * Create a readable array of invites infos
 * @param {[{user: User, uses: number}]} invites The invites to display
 * @param {Guild} currentGuild
 */
export async function embedInvitesList(invites, currentGuild) {
	/**
	 * @type {Collection<string,GiuldMember>}
	 */
	const membersInGuild = await currentGuild?.members.fetch(invites.map(({ user }) => user)).catch(process.consoleLogger.error);

	return invites.map(({ user, uses }) => {
		var userInGuild = user?.id && (membersInGuild?.has(user?.id) || currentGuild?.members.cache.get(user?.id));

		const username = user && ((userInGuild ? user.toString?.() : undefined) || user.username || user.id);
		return `${username} a invité ${uses} personnes`;
	});
}

/**
 * Display a list with the number of uses of invitations for each user
 * @param {Guild} guild
 */
async function displayCountPerUser(guild) {
	var invitesSorted;
	try {
		const invites = await getInvites(guild);
		invitesSorted = await countInvitesPerUserSorted(invites);
		if (!invitesSorted?.length) {
			return makeMessage(`Il n'y a pas d'invitations dans ${guild.name}`);
		}
	} catch (error) {
		process.consoleLogger.commandError(`/invit per_user ${guild.id}`, error);
		return makeError(error);
	}

	const countDesc = await embedInvitesList(invitesSorted, guild);
	return makeMessage([`Il y a ${invitesSorted.length} invitations dans ${guild.name} : `, ...countDesc].join('\n'));
}
