const Plenitude = require('./plenitude.js');
const Config = require('../Interaction/config.js');
const MakeMessage = require('../Interaction/messageMaker.js');



module.exports = {
	name: 'plenitude_location',
	description: 'Commandes avancées pour Plénitude',
	interaction: false,
	public: false,
	wip: true,
	isAllowedToUse(cmdData) { return [ Config.rubis, Config.jiogo18 ].includes(cmdData.author.id); },

	options: [{
		name: 'get',
		type: 1,
		async execute() {
			const PlenCity = await Plenitude.getLocation();
			return new MakeMessage.Embed('Plénitude', `La ville de Plénitude se trouve à ${PlenCity}`);
		}
	},{
		name: 'set',
		type: 1,
		options: [{
			name: 'location',
			type: 3,
			async execute(cmdData) {
				var optionsValue = [...cmdData.optionsValue];
				optionsValue.shift();//le premier c'est 'set'
				await Plenitude.setLocation(optionsValue.join(','));
				const PlenCity = await Plenitude.getLocation();
				return new MakeMessage.Embed('Plénitude', `La ville de Plénitude est maintenant ${PlenCity}`);
			}
		}]
	}]
}