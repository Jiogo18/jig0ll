import { CommandLevelOptions, ReceivedCommand } from '../../bot/command/received.js';
import { EmbedMaker } from '../../lib/messageMaker.js';

const logChannels = {
	'313048977962565652': '801844472836784167', //serveur Jiogo #log-manger
	'626121178163183628': '672382487888003092',
};

export default {
	name: 'mange',
	description: 'Donne un compte rendu de son repas inrp\nFormat: `!mange "Elizia" "des chocolats"`',

	security: {
		place: 'public',
		interaction: true,
	},

	options: [
		{
			name: 'qui',
			type: 3,
			description: 'Qui mange ?',
			required: true,
		},
		{
			name: 'quoi',
			type: 3,
			description: 'Manger quoi ?',
			required: true,
		},
	],

	/**
	 * Executed with option(s)
	 * @param {ReceivedCommand} cmdData
	 * @param {CommandLevelOptions} levelOptions
	 */
	async executeAttribute(cmdData, levelOptions) {
		if (levelOptions.length < 2) return new EmbedMaker('Mange', this.description); //n'a pas respecté les options

		const guild_id = cmdData.context.guild_id;
		//le channel dans la liste logChannels ou le channel d'où le message est envoyé
		const channelLog = logChannels[guild_id] ? cmdData.bot.channels.cache.get(logChannels[guild_id]) : undefined;

		const sujet = levelOptions.getArgumentValue('qui', 0);
		const aliment = levelOptions.getArgumentValue('quoi', 1);
		const channelSource = await cmdData.context.getChannel();
		const strDansChannel = channelSource?.name ? ` dans ${channelSource}` : '';
		const retour = new EmbedMaker('', `Aujourd'hui ${sujet} a mangé ${aliment}${strDansChannel}`);
		if (channelLog) {
			channelLog.send(retour.getForMessage());
			return new EmbedMaker('', 'Commande effectuée, bon appétit');
		} else {
			return retour; //répond au message
		}
	},
};
