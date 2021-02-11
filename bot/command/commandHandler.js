import { ReceivedCommand } from './received.js';
import { MessageMaker } from '../../lib/messageMaker.js';
import CommandStored from './commandStored.js';


/**
 * Get the command in CommandManager
 * @param {string} commandName 
 * @returns {CommandStored}
 */
function getCommand(commandName) {
	try {
		return this.commandMgr.getCommand(commandName);
	}
	catch(error) {
		console.warn(`Error while getting the command with '${commandName}'`.yellow);
		console.warn(error);
	};
}

/**
 * Execute the command and return the result
 * @param {ReceivedCommand} cmdData 
 * @returns {Promise<MessageMaker>} The result of the execution
 */
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
/**
 * Execute and send the anwser of the command
 * @param {ReceivedCommand} cmdData 
 * @returns Return a `falsy` value if the answer was not sent
 */
async function onCommand(cmdData) {

	const retour = await executeCommand.call(this, cmdData);
	if(!retour) return;

	return cmdData.sendAnswer(retour);
	
}


/**
 * Called when any commands are catched
 * @param {ReceivedCommand} cmdData - The command
 * @returns Return a `falsy` value if the answer was not sent
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
