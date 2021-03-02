import { Guild, TextChannel } from 'discord.js';
import { ReceivedCommand } from '../../bot/command/received.js';
import { EmbedMaker } from '../../lib/messageMaker.js';

export default {
	name: 'test',
	description: 'Commandes de test (limitées)',

	interaction: false,
	security: {
		place: 'private',
		wip: true,
	},

	options: [
		{
			name: 'idtime',
			description: 'Renvoie les id de nouveaux channels ("/test idtime (nb)")',
			type: 1,
			options: [
				{
					name: 'number',
					description: 'Renvoie les id de nouveaux channels ("/test idtime (nb)")',
					type: 4,
				},
			],
			/**
			 * Executed with option
			 * @param {ReceivedCommand} cmdData
			 * @param {[{name:string,value:string}]} levelOptions
			 */
			executeAttribute(cmdData, levelOptions) {
				return embedIdTime(cmdData.guild, levelOptions.number || levelOptions[0].value);
			},
			/**
			 * Executed when there is no valid option
			 * @param {ReceivedCommand} cmdData
			 */
			execute: cmdData => embedIdTime(cmdData.guild, 1),
		},
	],
};

/**
 * Get embed informations on temporary channels
 * @param {Guild} guild Guilde cible
 * @param {number} nb Nombre de channels à créer
 */
async function embedIdTime(guild, nb) {
	const data = await idTime(guild, nb);

	const decription = [`${data.length} channel${data.length == 1 ? ' créé' : 's créés'}`];
	var retour = new EmbedMaker('test idTime', decription);
	data.forEach((channel, i) => {
		retour.addField(
			`Channel ${i + 1} :`,
			`ID : ${channel.id}
			Timestamp : ${channel.createdTimestamp}
			Créé le : ${channel.createdAt}`
		);
	});
	return retour;
}
/**
 * Create channels and delete them to get informations
 * @param {Guild} guild Guild targeted
 * @param {number} nb Number of channel to create
 * @returns {Promise<[TextChannel]>} Informations on the new channels
 */
async function idTime(guild, nb) {
	if (typeof nb != 'number') nb = parseInt(nb);
	if (nb < 1) nb = 1;
	if (nb > 10) nb = 10;
	console.log(`Création de ${nb} channels`);

	const channels = [];
	const channelsInfo = [];
	for (let i = 0; i < nb; i++) {
		channels.push(
			guild.channels
				.create('temp' + i + 1, 'text', [], 'commande @Jig0ll')
				.then(channel => {
					channelsInfo.push(channel); // le channel est delete mais on le garde temporairement
					channel.delete();
				})
				.catch(console.error)
		);
	}
	await Promise.all(channels);
	return channelsInfo;
}
