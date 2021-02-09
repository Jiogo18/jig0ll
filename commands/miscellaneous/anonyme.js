import { EmbedMaker } from '../../lib/messageMaker.js';


export default {

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
	}],

	executeAttribute(cmdData, levelOptions) {
		var options = levelOptions.map(e => e.value);

		const message = options.join(' ');
		
		if(cmdData.commandSource) {
			if(cmdData.commandSource.delete) cmdData.commandSource.delete().catch(()=>{});
		}
		return new EmbedMaker('Anonyme', message, 3);
	},
}