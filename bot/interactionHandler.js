import { CommandInteraction } from '../lib/commandData.js';
import { InteractionSpecialMaker } from '../lib/messageMaker.js';
import { getDateSinceEpoch as getSnowflakeTimestamp } from '../lib/snowflake.js';


async function safeInteractionAnswer(cmdData) {
	const timestampId = getSnowflakeTimestamp(cmdData.commandSource.id);
	//ne fonctionne que si la commande fonctionne au await (pas au sleep des dates)
	const timeRemaining = 3000 + timestampId - Date.now();
	setTimeout(async function() {
		if(cmdData.answered || cmdData.needAnswer == false) return;
		console.log(`Interaction is too long, an acknowledgement will be sent (for '/${cmdData.commandLine}')`);
		cmdData.sendAnswer(new InteractionSpecialMaker(5));//accepte l'intéraction (et attent le retour)
	}, timeRemaining - 1000);//on a 3s pour répondre à l'interaction (et le bot peut être désyncro de 1s...)
}


/**
 * @param {CommandInteraction} interaction 
 */
export default async function interactionHandler(interaction) {

	safeInteractionAnswer(interaction);


	const retour = await this.interactionMgr.onCommand(cmdData);
	console.log(`Interaction done for ${interaction.author.username} : "${interaction.commandLine}" in ${Date.now() - interaction.receivedAt} msec`);

	if(!retour) return;

	const answerOk = await interaction.sendAnswer(retour)
		.catch(e => {
			console.error(`Error while sending an answer`.red);
			console.error(e);
		})
	if(!answerOk)
		console.warn(`Interaction "${interaction.commandLine}" has no answer`.yellow);
		interaction.answered = true;
}