const config = require('./config.js');

module.exports = class InteractionBase {
	bot = undefined;
	static config = require('./config.js')
	commandsMgr = require('./commands.js');

	constructor(bot) {
		//format des demandes d'interactions '</COMMAND:BOT_ID> '
		//format des retours d'interactions: 'réponse'
		this.bot = bot;
	}

	//https://discord.com/developers/docs/interactions/slash-commands#get-global-application-commands
	//https://stackoverflow.com/questions/65402187/new-discord-slash-commands#answer-65422307
	//Global Application Command: applications/{application.id}/commands
	//Guild Application Command: applications/{application.id}/guilds/{guild.id}/commands
	global() { return this.bot.api.applications(this.bot.user.id); }
	guilds(id) { return this.global().guilds(id); }
	getTarget(id) {
		const target = (id ? this.guilds(id) : undefined) || this.global();
		return target ? target.commands : undefined;
	}

	// get: array avec les commandes
	// post({data:{}}): post une commande
	// patch: edit une commande (mais peut aussi être écrasé par un post)
	// (id)delete: delete une commande
	async getCmdFrom(guild_id = undefined) {
		var target = this.getTarget(guild_id);
		return target ? await target.get() : undefined;
	}

	async createInteraction(interaction, guild_id = undefined) {
		const target = this.getTarget(guild_id)
		return target ? target.post(interaction) : undefined;
	}

	async loadCommands() {
		const targetPrivate = this.getTarget(config.guild_test);
		const targetGlobal = this.getTarget();
		return this.commandsMgr.loadCommands(targetGlobal, targetPrivate);
	}

	async cleanCommands(target_id = undefined) {
		const target = this.getTarget(target_id);
		
		const commandsAvailable = await this.commandsMgr.getExistingCommands(target);
		if(!commandsAvailable) {
			console.error(`Can't get commands for ${target_id ? target_id : 'Global'}`);
			return;
		}
		
		//console.log(`commands before : ${(await this.commandsMgr.getExistingCommands(target)).length}`);
		var promises = [];
		for(const command of commandsAvailable) {
			promises.push(this.commandsMgr.removeCommand(command, target));
		}
		await Promise.all(promises);
		//console.log(`commands remaning : ${(await this.commandsMgr.getExistingCommands(target)).length}`)

		if(this.commandsMgr.commands.length > 0) {
			console.error(`${this.commandsMgr.commands.length} Slash Commands remain after cleanCommands`.red);
		}
		else {
			console.log(`All Slash Commands of ${target_id ? target_id : 'Global'} have been removed.`);
		}
	}
}

