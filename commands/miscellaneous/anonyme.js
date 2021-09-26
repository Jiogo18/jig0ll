import { CommandLevelOptions, ReceivedCommand } from '../../bot/command/received.js';
import { EmbedMaker } from '../../lib/messageMaker.js';

export default {
	name: 'anonyme',
	description: 'Faire une annonce anonymement',

	security: {
		interaction: false,
		hidden: true,
		place: 'public',
	},

	options: [
		{
			name: 'message',
			description: 'Votre message',
			type: 3,
			required: true,
		},
	],

	/**
	 * Executed with option(s)
	 * @param {ReceivedCommand} cmdData
	 * @param {CommandLevelOptions} levelOptions
	 */
	executeAttribute(cmdData, levelOptions) {
		var options = levelOptions.options.map(e => e.value);

		const message = options.join(' ');

		if (!cmdData.commandSource.deletable) {
			return EmbedMaker.Error('Anonyme', 'Bien tenté mais je ne pourrais pas supprimer votre message...');
		}
		if (cmdData.commandSource.delete)
			cmdData.commandSource.delete().catch(e => {
				process.consoleLogger.internalError("deleting a message for '/anonyme'", e);
			});
		return new EmbedMaker('Anonyme', message, 3);
	},
};
