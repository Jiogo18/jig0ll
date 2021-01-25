const MessageMaker = require('../lib/messageMaker.js');

const logChannels = {
	'313048977962565652': '801844472836784167',//serveur Jiogo #log-manger
	'626121178163183628': '672382487888003092'
};

module.exports = {


	name: 'mange',
	description: 'Donner un compte rendu de son repas inrp\nFormat: `!mange "Elizia" "des chocolats"`',
	interaction: false,//FUTUR discord accepte pas encore de mettre 2 type 3 à la suite (ref?)
	
	security: {
		place: 'public',
	},

	options: [{
		name: 'personne',
		type: 6,//user
		description: 'Qui mange ?',
		required: true,

		options: [{
			name: 'quoi',
			type: 3,
			description: 'Manger quoi ?',

			execute(cmdData) {
				const guildId = cmdData.guild.id;
				//le channel dans la liste logChannels ou le channel d'où le message est envoyé
				const channelLog = logChannels[guildId] ? cmdData.bot.channels.fetch(logChannels[guildId]) : undefined;


				const sujet = cmdData.optionsValue[0];
				const aliment = cmdData.optionsValue[1];
				const channelSource = cmdData.channel;
				const strDansChannel = (channelSource && channelSource.name) ? ` dans ${channelSource}` : ''
				const retour = new MessageMaker.Embed('', `Aujourd'hui ${sujet} a mangé ${aliment}${strDansChannel}`);
				if(channelLog) {
					channelLog.send(retour.getForMessage());
				}
				else {
					return retour;//répond au message
				}
				return new MessageMaker.Embed('', "Commande effectuée, bon appétit");
			}
		}],

		execute() { return new MessageMaker.Message(module.exports.description); }
	}]
}