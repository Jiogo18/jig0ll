const MessageMaker = require('../lib/messageMaker.js');


module.exports = {

	name: 'anonyme',
	description: 'Faire une annonce anonymement',
	
	interaction: false,
	security: {
		hidden: true,
		place: 'public',
	},
	



	options: [{
		name: 'message',
		type: 3,
		required: true,

		execute(cmdData) {
			var options = cmdData.optionsValue;

			const message = options.join(' ');
			
			if(cmdData.commandSource) {
				if(cmdData.commandSource.delete) cmdData.commandSource.delete();
			}
			return new MessageMaker.Embed('Anonyme', message, 3);
		}
	}]

}