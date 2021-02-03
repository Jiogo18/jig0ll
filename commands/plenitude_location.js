const Plenitude = require('./plenitude.js');
const security = require('../Interaction/security.js');
const MessageMaker = require('../lib/messageMaker.js');


module.exports = {
	name: 'plenitude_location',//TODO: renomme en PlenConfig
	description: 'Commandes avancées pour Plénitude',
	interaction: true,//private donc sera ok juste sur mon serv
	
	security: {
		place: 'private',
		isAllowedToUse(cmdData) { return security.isPlenitudePrivilege(cmdData.author.id); },
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
			console.debug(levelOptions);
			const name = levelOptions.variable || levelOptions[0] && levelOptions[0].value
			return await onGetCommand(name);
		},
		async execute() {
			return await onGetCommand('PlenCity');
		}

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
		}
	}]
}


const vars = [{
	name: 'PlenCity',
	get: function() { return Plenitude.getLocation(); },
	set: function(value) {
		
		return Plenitude.setLocation(value);
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
	choices: vars.map(e => { return { name: e.name, value: e.name } }),
}




function findVar(name) {
	return vars.find(e => e.name.toLowerCase() == name.toLowerCase());
}

function makeMessage(text) { return new MessageMaker.Embed('Plénitude', text); }
function makeError(text) { return new MessageMaker.Embed('Plénitude', text || 'Une erreur est survenue', {color: 'red'}); }

async function onGetCommand(name) {
	const variable = findVar(name);
	if(!variable) { return makeError(`La variable '${name}' n'existe pas`); }

	return makeMessage(await variable.textGet());
}

async function onSetCommand(name, values) {
	console.debug(name);
	
	const variable = findVar(name);
	if(!variable) { return makeError(`La variable '${name}' n'existe pas`); }
	
	console.debug(values);
	
	
	return makeMessage(await variable.textSet(values));
}