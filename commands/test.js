import { Guild } from 'discord.js';
import { EmbedMaker } from '../lib/messageMaker.js';

export default {
	name: 'test',
	description: 'Commandes de test (limitées)',

	interaction: false,
	security: {
		place: 'private',
		wip: true,
	},

	options: [{
		name: 'idtime',
		description: 'Renvoie les id de nouveaux channels ("/test idtime (nb)")',
		type: 1,
		options: [{
			name: 'number',
			description: 'Renvoie les id de nouveaux channels ("/test idtime (nb)")',
			type: 4,
			
		}],
		async executeAttribute(cmdData, levelOptions) {
			return await embedIdTime(cmdData.guild, levelOptions[0].value);
		},
		async execute(cmdData) {
			return await embedIdTime(cmdData.guild, 1);
		}
	}]
}


/**
 * @param {Guild} guild - Guilde cible
 * @param {number} nb - Nombre de channels à créer
 */
async function embedIdTime(guild, nb) {
	const data = await idTime(guild, nb);

	const decription = [`${data.length} channel${data.length==1 ? ' créé' : 's créés'}`];
	var retour = new EmbedMaker('test idTime', decription);
	for(let i=0; i<data.length; i++) {
		const channelInfo = data[i];
		retour.addField(`Channel ${i+1} :`,
			`ID : ${channelInfo.id}
			Timestamp : ${channelInfo.createdTimestamp}
			Créé le : ${channelInfo.createdAt}`);
	}
	return retour;
}
/**
 * @param {Guild} guild - Guilde cible
 * @param {number} nb - Nombre de channels à créer
 * @returns {Object[]} - Informations sur de nouveaux channels
 */
async function idTime(guild, nb) {
	if(typeof nb != 'number') nb = parseInt(nb);
	if(nb < 1) nb = 1;
	if(nb > 10) nb = 10;
	console.log(`Création de ${nb} channels`);

	const channels = [];
	const channelsInfo = [];
	for(let i=0; i<nb; i++) {
		channels.push(guild.channels.create('temp'+i+1, 'text', [], 'commande @Jig0ll')
			.then(channel => {
				channelsInfo.push({
					id: channel.id,
					createdTimestamp: channel.createdTimestamp,
					createdAt: channel.createdAt,
				});
				channel.delete();
			})
			.catch(console.error));
	}
	await Promise.all(channels);
	return channelsInfo;
}