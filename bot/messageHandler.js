import { removePrefix as removeCommandPrefix } from '../lib/command.js';
import { CommandMessage } from '../lib/commandData.js';


export default async function messageHandler(message) {

	//préparer le message pour les commandes
	try {
		const [content, prefix] = removeCommandPrefix(message.content);
		if(prefix == undefined) return;

		message.content = content;
		message.prefix = prefix;

	} catch(error) {
		console.error(`Error with a message: ${error}`);
		return;
	}


	//on suppose que message.content et message.prefix ont été séparés
	var cmdData = new CommandMessage(message, this.interactionMgr);
	const retour = await this.interactionMgr.onCommand(cmdData)
		.catch(error => {
			message.channel.send(`Sorry I've had an error: ${error}`);
			console.error(error);
		});
	
	if(!retour) return;
	
	console.log(`nouvelle commande (par ${message.author.username} @${message.author.id}) : ${message.content}`);
	
	cmdData.sendAnswer(retour)
		.catch(error => {
			message.reply(`Sorry I've had an error while sending the answer: ${error}`);
			console.error(error);
		});
}