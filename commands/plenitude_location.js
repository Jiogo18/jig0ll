const Plenitude = require('./plenitude.js');
const security = require('../Interaction/security.js');
const MakeMessage = require('../lib/messageMaker.js');


module.exports = {
	name: 'plenitude_location',
	description: 'Commandes avancées pour Plénitude',
	interaction: false,
	
	security: {
		place: 'private',
		isAllowedToUse(cmdData) { return security.isPlenitudePrivilege(cmdData.author.id); },
	},

	//TODO: set [variable] [value]
	options: [{
		name: 'get',
		description: 'Donne la ville actuelle de Plénitude',
		type: 1,
		async execute() {
			const PlenCity = await Plenitude.getLocation();
			return new MakeMessage.Embed('Plénitude', `La ville de Plénitude se trouve à ${PlenCity}`);
		}
	},{
		name: 'set',
		description: 'Change la ville actuelle de Plénitude',
		type: 1,
		options: [{
			name: 'location',
			type: 3,
		}],
		async executeAttribute(cmdData, levelOptions) {
			const optionsValue = levelOptions.map(e => e.value);
			await Plenitude.setLocation(optionsValue.join(','));
			const PlenCity = await Plenitude.getLocation();
			return new MakeMessage.Embed('Plénitude', `La ville de Plénitude est maintenant ${PlenCity}`);
		}
	}]
}