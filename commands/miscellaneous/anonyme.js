import { Message } from 'discord.js';
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
	async executeAttribute(cmdData, levelOptions) {
		var options = levelOptions.options.map(e => e.value);

		const message = options.join(' ');
		const answer = new EmbedMaker('Anonyme', message).getForMessage();

		if (cmdData.isMessage) {
			/** @type {Message} */
			const message = cmdData.message;
			if (!message.deletable) {
				return EmbedMaker.Error('Anonyme', 'Bien tenté mais je ne pourrais pas supprimer votre message...');
			}
			message.delete?.().catch(e => process.consoleLogger.internalError("deleting a message for '/anonyme'", e));

			cmdData.setReplied();
			await message.channel.send(answer);
			return;
		} else if (cmdData.isInteraction) {
			const channel = await cmdData.context.getChannel();
			await channel.send(answer);
			return new EmbedMaker('Anonyme', 'Message envoyé', { ephemeral: true });
		}
	},
};
