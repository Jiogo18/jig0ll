const InteractionBase = require('./base.js');

module.exports = class InteractionManager extends InteractionBase {
	constructor(bot) {
		super(bot);

		bot.ws.on('INTERACTION_CREATE', inte => { this.onInteraction(inte); });//to keep the function with the right 'this'
	}


	async onInteraction(interaction) {
		const commandName = interaction.data.name.toLowerCase();
		var command = this.commandsMgr.commands.get(commandName);
		if(!command) {
			console.error(`Command unknow: ${commandName}`);

			if(process.env.WIPOnly)
				this.sendAnswer(interaction, `Command unknow: ${commandName}`);//peut être fait par un autre Jig0ll
			
			return;
		}

		const context = {
			name: commandName,
			user: interaction.member.user,
			guild: { id: interaction.guild_id },
			channel: { id: interaction.channel_id },
			on: 'interaction'
		}

		if(!InteractionBase.config.isAllowed(context, command.security)) {
			this.sendAnswer(interaction, `You can't do that`);
			return;
		}



		//https://stackoverflow.com/questions/13973158/how-do-i-convert-a-javascript-object-array-to-a-string-array-of-the-object-attri#answer-13973194
		//format de interaction.data.options: [{ 'name':'a' },{ 'name':'b' }], ou undefined si vide
		const args = (interaction.data.options || []).map(option => option.name);
		const commandLine = `/${[commandName].concat(args).join(' ')}`;//just for the console

		for(const optionName of args) {//get the sub command named optionName
			var subCommand = command.options.find(option => option.name == optionName);
			if(subCommand == undefined) {
				console.error(`Option unknow: ${commandName} ${optionName}`);
				if(process.env.WIPOnly)
					this.sendAnswer(interaction, `Option unknow: ${optionName}`);
				return;
			}
			if(!InteractionBase.config.isAllowed(context, subCommand.security)) {
				this.sendAnswer(interaction, `You can't do that`);
				return;
			}
			command = subCommand;
		}

		try {
			if(command.execute == undefined) {
				const lastArg = args.length>0 ? args[args.length-1] : commandName;
				console.error(`Can't find execute() for ${lastArg}`.red);
				throw "execute is not defined for this option";
			}
			const retour = await command.execute(interaction, {bot: this.bot, interaction: this, commands: this.commandsMgr.commands});

			this.sendAnswer(interaction, retour);
			console.log(`Interaction done for ${interaction.member.user.username} : "${commandLine}"`);
			if(!retour) {
				console.warn(`Interaction "${commandLine}" has no answer`.yellow);
			}
		} catch (error) {
			this.sendAnswer(interaction, `Sorry I've had an error`);
			console.error(`An error occured will executing "${commandLine}"`.red, error);
		}
	}

	onCommand(commandName, options, context) {
		var command = this.commandsMgr.commands.get(commandName);
		console.debug(`onCommand ${commandName}`)
		console.debug(command);


		return 'Work in Progress';
	}
}

