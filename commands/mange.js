import MessageMaker from '../lib/messageMaker.js';
import Snowflake from '../lib/snowflake.js';

const logChannels = {
	'313048977962565652': '801844472836784167',//serveur Jiogo #log-manger
	'626121178163183628': '672382487888003092'
};

export default {


	name: 'mange',
	description: 'Donne un compte rendu de son repas inrp\nFormat: `!mange "Elizia" "des chocolats"`',
	interaction: true,
	
	security: {
		place: 'public',
	},

	options: [{
		name: 'personne',
		type: 3,
		description: 'Qui mange ?',
		required: true,
	},{
		name: 'quoi',
		type: 3,
		description: 'Manger quoi ?',
		required: true,
	}],

	async executeAttribute(cmdData, levelOptions) {
		if(levelOptions.length < 2) return new MessageMaker.Embed('Mange', module.exports.description);//n'a pas respecté les options


		const guildId = cmdData.guild.id;
		//le channel dans la liste logChannels ou le channel d'où le message est envoyé
		const channelLog = logChannels[guildId] ? cmdData.bot.channels.cache.get(logChannels[guildId]) : undefined;

		const sujet = await getTarget(cmdData.bot, levelOptions.personne || levelOptions[0] && levelOptions[0].value);
		const aliment = levelOptions.quoi || levelOptions[1] && levelOptions[1].value;
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
}



async function getTarget(bot, str)
{
	if(!Snowflake.isSnowflake(str)) return str;

	const user = await bot.users.fetch(str);
	if(user) {
		if(user.partial == false) return user;//si on a l'user : target == user
		return `<@${str}>`;//si on a un snowflake mais pas vraiment user : <@Snowflake>
	}

	return str;//si on a rien de tout ça : str
}