import { getLocation, setLocation } from './plenitude.js';
import { isPlenitudePrivilege } from '../../bot/command/security.js';
import { EmbedMaker } from '../../lib/messageMaker.js';
import { ReceivedCommand } from '../../bot/command/received.js';


const vars = [{
	name: 'PlenCity',
	get: getLocation,
	set: setLocation,

	textGet: async function() { return `La ville de Plénitude se trouve à ${await this.get()}`},
	textSet: async function(value) {
		const optionsValue = value.map(e => e.value);
		await this.set(optionsValue.join(','));
		return `La ville de Plénitude est maintenant ${await this.get()}`
	},
}];
const optionVariable = {
	name: 'variable',
	type: 3,
	required: true,
	choices: vars.map(e => { return { name: e.name, value: e.name } }),
}



export default {
	name: 'plenitude_location',//TODO: renomme en PlenConfig
	description: 'Commandes avancées pour Plénitude',
	interaction: true,//private donc sera ok juste sur mon serv
	
	security: {
		place: 'private',
		/**
		 * Custom isAllowedToUse
		 * @param {ReceivedCommand} cmdData 
		 */
		isAllowedToUse(cmdData) { return isPlenitudePrivilege(cmdData.author.id); },
	},

	//format: get [variable], set [variable] [value]
	options: [{
		name: 'get',
		description: 'Donne la ville actuelle de Plénitude',
		type: 1,
		options: [{
			...optionVariable,
			description: 'Donne la valeur actuelle de la variable',
		}],

		/**
		 * Executed with option(s)
		 * @param {ReceivedCommand} cmdData
		 * @param {{variable:string}} levelOptions
		 */
		async executeAttribute(cmdData, levelOptions) {
			const name = levelOptions.variable || levelOptions[0] && levelOptions[0].value
			return await onGetCommand(name);
		},
		/**
		 * Executed when there is no valid option
		 * @returns A list of availables variables to get
		 */
		execute() { return makeVariablesAvailable(); }

	},{
		name: 'set',
		description: 'Change la ville actuelle de Plénitude',
		type: 1,
		options: [{
			...optionVariable,
			desciption: 'Affecter la valeur à la variable',
			required: true,
		},{
			name: 'location',
			type: 3,
			required: true,
		}],
		/**
		 * Executed with option(s)
		 * @param {ReceivedCommand} cmdData
		 * @param {{variable:string, location:string}} levelOptions
		 */
		async executeAttribute(cmdData, levelOptions) {
			const name = levelOptions.variable || levelOptions[0] && levelOptions[0].value;
			if(levelOptions[0]) {
				if(levelOptions[0] == name || levelOptions[0].value == name) {
					levelOptions.shift();
				}
			}
			if(levelOptions.variable) levelOptions.variable = undefined;
			return await onSetCommand(name, levelOptions);
		},
		/**
		 * Executed when there is no valid option
		 * @returns A list of availables variables to set
		 */
		execute() { return makeVariablesAvailable(); }
	}]
}


/**
 * Find a variable
 * @param {string} name The name of the var
 */
function findVar(name) {
	return vars.find(e => e.name.toLowerCase() == name.toLowerCase());
}

/**
 * Make a message with Plénitude in the title
 * @param {string} text 
 */
function makeMessage(text) { return new EmbedMaker('Plénitude', text); }
/**
 * Make an error message with Plénitude in the title
 * @param {string} text The reason or the message for the error
 */
function makeError(text) { return new EmbedMaker('Plénitude', text || 'Une erreur est survenue', {color: 'red'}); }
function makeVariablesAvailable() {
	return makeMessage('Variables disponibles : ' + optionVariable.choices.map(e => e.name).join(', '));
}

/**
 * Do things with the variable
 * @param {string} name The name of the variale
 * @param {Function} func The function to execute with the variable
 */
async function onACommand(name, func) {
	const variable = findVar(name);
	if(!variable) { return makeError(`La variable '${name}' n'existe pas`); }
	
	return makeMessage(await func(variable));
}

/**
 * When `plenitude_location get` was called
 * @param {string} name The name of the variable
 */
async function onGetCommand(name) {
	return await onACommand(name, variable => variable.textGet());
}
/**
 * When `plenitude_location set` was called
 * @param {string} name The name of the variable
 * @param {[*]} values The data with the new value
 */
async function onSetCommand(name, values) {
	return await onACommand(name, variable => variable.textSet(values));
}