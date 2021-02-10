import { CommandData } from '../lib/commandData.js';
import { MessageMaker } from '../lib/messageMaker.js';


function getCommand(commandName) {
	try {
		return this.interactionMgr.commandsMgr.getCommand(commandName);
	}
	catch(error) {
		console.warn(`Error whilte getting the command with '${commandName}'`.yellow);
		console.warn(error);
	};
}
async function executeCommand(cmdData) {
	const command = getCommand.call(this, cmdData.commandName)
	if(!command) return;
	if(typeof command == 'string') return new MessageMaker(command);


	try {
		const retour = await new Promise((resolve, reject) => {
			resolve(command.execute(cmdData, cmdData.options));//try to solve with it
			setTimeout(() => reject('timeout'), 60000);//more than 60s
		});
		if(!retour && cmdData.needAnswer != false) {
			console.warn(`Command "${cmdData.commandLine}" has no answer`.yellow);
		}
		
		return retour;

	} catch (error) {
		console.error(`An error occured will executing "${cmdData.commandLine}"`.red, error);
		return new MessageMaker(`Sorry I've had an error (${error})`);
	}
}

async function onCommand(cmdData) {

	const retour = await executeCommand.call(this, cmdData);
	if(!retour) return;

	return cmdData.sendAnswer(retour);
	
}


/**
 * Called when any commands are catched
 * @param {CommandData} cmdData - The command
 */
export default async function commandHandler(cmdData) {
	
	var timeoutLogged = false;
	const timeoutLog = setTimeout(_ => {

		console.log(`Command #${cmdData.id} by ${cmdData.author.username} : '${cmdData.commandLine}' not finished yet`.gray);
		timeoutLogged = true;

	}, 30000);//30s pour répondre, sinon il envoit un message d'info

	const retour = await onCommand.call(this, cmdData)

	clearTimeout(timeoutLog);
	if(!timeoutLogged) {
		console.log(`Command #${cmdData.id} by ${cmdData.author.username} : '${cmdData.commandLine}' done in ${Date.now() - cmdData.receivedAt} msec`.gray);
	}
	else {
		console.log(`Command #${cmdData.id} done in ${Date.now() - cmdData.receivedAt} msec`.gray);
	}

	return retour;
}
