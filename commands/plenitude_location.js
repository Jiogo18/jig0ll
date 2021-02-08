import { getLocation, setLocation } from './plenitude.js';
import { isPlenitudePrivilege } from '../Interaction/security.js';
import { EmbedMaker } from '../lib/messageMaker.js';


const vars = [{
	name: 'PlenCity',
	get: function() { return getLocation(); },
	set: function(value) {
		
		return setLocation(value);
	},

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

		async executeAttribute(cmdData, levelOptions) {
			const name = levelOptions.variable || levelOptions[0] && levelOptions[0].value
			return await onGetCommand(name);
		},
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

		execute() { return makeVariablesAvailable(); }
	}]
}



function findVar(name) {
	return vars.find(e => e.name.toLowerCase() == name.toLowerCase());
}

function makeMessage(text) { return new EmbedMaker('Plénitude', text); }
function makeError(text) { return new EmbedMaker('Plénitude', text || 'Une erreur est survenue', {color: 'red'}); }
function makeVariablesAvailable() {
	return makeMessage('Variables disponibles : ' + optionVariable.choices.map(e => e.name).join(', '));
}


async function onACommand(name, func) {
	const variable = findVar(name);
	if(!variable) { return makeError(`La variable '${name}' n'existe pas`); }
	
	return makeMessage(await func(variable));
}

async function onGetCommand(name) {
	return await onACommand(name, variable => variable.textGet());
}

async function onSetCommand(name, values) {
	return await onACommand(name, variable => variable.textSet(values));
}