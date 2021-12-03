import { getLocation, setLocation } from './plenitude.js';
import { isPlenitudePrivilege } from '../../bot/command/security.js';
import { EmbedMaker } from '../../lib/messageMaker.js';
import { CommandLevelOptions, ReceivedCommand } from '../../bot/command/received.js';

const vars = [
	{
		name: 'PlenCity',
		description: 'Emplacement de Plénitude',
		get: getLocation,
		set: setLocation,

		textGet: async function () {
			return `La ville de Plénitude se trouve à ${await this.get()}`;
		},
		/**
		 * @param {string} value
		 */
		textSet: async function (value) {
			const newValue = await this.set(value);
			return `La ville de Plénitude est maintenant ${newValue}`;
		},
	},
];
const optionVariable = {
	name: 'var',
	type: 3,
	required: true,
	choices: vars.map(e => ({ name: e.name, value: e.name, description: e.description })),
};

export default {
	name: 'plenitude_config',
	description: 'Commandes avancées pour Plénitude',

	security: {
		place: 'private',
		interaction: true, //private donc sera ok juste sur mon serv
		isAllowedToUse: isPlenitudePrivilege,
	},

	//format: get [var], set [var] [value]
	options: [
		{
			name: 'get',
			description: 'Récupérer une variable',
			type: 1,
			options: [
				{
					...optionVariable,
					description: 'Nom de la variable à récupérer',
				},
			],

			/**
			 * Executed with option(s)
			 * @param {ReceivedCommand} cmdData
			 * @param {CommandLevelOptions} levelOptions
			 */
			async executeAttribute(cmdData, levelOptions) {
				const name = levelOptions.getArgumentValue('var', 0);
				return onGetCommand(name);
			},
			/**
			 * Executed when there is no valid option
			 * @returns A list of availables variables to get
			 */
			execute: makeVariablesAvailable,
		},
		{
			name: 'set',
			description: 'Changer une variable',
			type: 1,
			options: [
				{
					...optionVariable,
					description: 'Nom de la variable à modifier',
				},
				{
					name: 'value',
					description: 'Valeur de la variable',
					type: 3,
					required: true,
				},
			],
			/**
			 * Executed with option(s)
			 * @param {ReceivedCommand} cmdData
			 * @param {CommandLevelOptions} levelOptions
			 */
			async executeAttribute(cmdData, levelOptions) {
				const name = levelOptions.getArgumentValue('var', 0);
				var value;
				if (cmdData.isMessage && levelOptions.length > 2) {
					value = levelOptions.options
						.filter((o, i) => i > 0)
						.map(o => o.getValueOrName())
						.join(', ');
				} else {
					value = levelOptions.getArgumentValue('value', 1);
				}
				return onSetCommand(name, value);
			},
			/**
			 * Executed when there is no valid option
			 * @returns A list of availables variables to set
			 */
			execute: makeVariablesAvailable,
		},
	],
};

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
function makeMessage(text) {
	return new EmbedMaker('Plénitude', text);
}
/**
 * Make an error message with Plénitude in the title
 * @param {string} text The reason or the message for the error
 */
function makeError(text) {
	return EmbedMaker.Error('Plénitude', text || 'Une erreur est survenue');
}
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
	if (!variable) {
		return makeError(`La variable '${name}' n'existe pas`);
	}

	return makeMessage(await func(variable));
}

/**
 * When `plenitude_location get` was called
 * @param {string} name The name of the variable
 */
async function onGetCommand(name) {
	return onACommand(name, variable => variable.textGet());
}
/**
 * When `plenitude_location set` was called
 * @param {string} name The name of the variable
 * @param {string} value The data with the new value
 */
async function onSetCommand(name, value) {
	return onACommand(name, variable => variable.textSet(value));
}
