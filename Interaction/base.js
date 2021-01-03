const { DiscordAPIError } = require('discord.js');

module.exports = class InteractionBase {
	bot = undefined;
	config = require('./config.js');
	static getConfig() { return require('./config.js'); }

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
		const fs = require('fs');
		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

		const targetPrivate = this.getTarget(this.config.guild_test);
		const targetGlobal = process.env.WIPOnly ? targetPrivate : this.getTarget();//serv privé (en WIP) ou le global

		console.log(`Loading commands...`.green);
		var counter = 0, globalCounter = 0;

		for (const file of commandFiles) {
			try {
				const command = require(`../commands/${file}`);
				if(command.setBot) { command.setBot(this.bot); }
				if(command.security == this.config.securityLevel.wip) {
					console.warn(`Interaction ${command.name} is WIP`.yellow);
				}

				const post = { data: {
					name: command.name,
					description: command.description,
					options: command.options
				}};
				var target = targetPrivate;//WIP ou Private
				if(command.security == this.config.securityLevel.public) {
					target = targetGlobal;
					globalCounter++;
				}
				await target.post(post).catch(e => {
					console.error(`Error while posting ${command.name}`.red);
				});

				this.bot.slash_commands.set(command.name, command);
				counter++;
			} catch (error) {
				console.error(`Slash command not loaded: ${file}`.red);
			}
		}
		console.log(`${counter} commands loaded, ${globalCounter} public`.green);
	}

	async removeInteraction(target, interaction_id) {
		const retour = target(interaction_id).delete();
		target('..');//fait remonter au parent parce que le target() modifie target lui même...
		//ex si il y a pas .. : path: '/applications/494587865775341578/guilds/313048977962565652/commands/792926340126736434/792926340973330462'
		return retour;
	}
	async cleanCommands(target_id = undefined) {
		var ok = true;
		const target = this.getTarget(target_id);
		if(!ok) return;

		const commandsAvailable = await this.getCmdFrom(target_id)
			.catch(e => {
			console.error(`Can't get commands for ${target_id ? target_id : 'Global'}`);
			ok = false;
		});
		if(!ok) return;

		for(const command of commandsAvailable) {
			await this.removeInteraction(target, command.id);
			if(!this.bot.slash_commands.delete(command.name)) {
				console.warn(`Can not delete ${command.name} from bot.slash_commands`.yellow);
			}
		}

		if(this.bot.slash_commands.length > 0) {
			console.error(`${this.bot.slash_commands.length} Slash Commands remaining with cleanCommands`.red);
		}
		else {
			console.log(`All Slash Commands of ${target_id ? target_id : 'Global'} have been removed.`);
		}

	}


	makeMessage(post) {
		if(post == undefined) { return; }
		else if(post.data && post.data.data) {
			return post;
		}
		else if(post.data && post.data.content) {
			return { data: post };
		}
		else {
			return {
				data : {
					type: 4,
					data: {
						content: post
					}
				}
			};
		}
	}

	sendAnswer(interaction, post) {
		if(post == undefined) { return; }
		return this.bot.api.interactions(interaction.id, interaction.token)
				.callback.post(this.makeMessage(post));
	}
}

