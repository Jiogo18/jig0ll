const Discord = require('discord.js');
const fs = require('fs');
const defaultCommandsPath = './commands';
var existingCommands = new Discord.Collection();//stocker les commandes et pas les redemander h24

module.exports = {

	async getExistingCommands(target, forceUpdate) {
		var commandsStored = existingCommands.get(target);

		if(forceUpdate) {
			console.warn(`getExistingCommands called with forceUpdate.`.yellow);
		}
		
		if(!commandsStored || commandsStored.timeUpdate < Date.now() || forceUpdate) {
			if(commandsStored)
				console.warn(`Asking Discord for existing Commands (ping: ${Date.now() - commandsStored.lastUpdate} ms)`.magenta);

			var commandsGet = [];
			try {
				commandsGet = await target.get();
			} catch(error) {
				console.warn(`Can't get commands from ${target}, it's maybe empty`.yellow);
				commands = [];
			}
			commandsStored = {
				commands: commandsGet,
				lastUpdate: Date.now(),
				timeUpdate: Date.now() + 1000
			}
			existingCommands.set(target, commandsStored);
		}
		return commandsStored.commands;
	},

	resetCacheTimer(target) {
		commands = existingCommands.get(target);
		if(commands) commands.timeUpdate = 0;
	},

	async getCommand(commandName, target) {
		const command = (await this.getExistingCommands(target))
			.find(command => command.name == commandName);
	},
	async getCommandId(commandName, target) {
		const command = await this.getCommand(commandName, target);
		return command ? command.id : undefined;
	},



	commands: new Discord.Collection(),

	async addCommand(command, target) {

		// on ecrasera forcément les anciens post car on sait pas s'ils sont utilisés (ils restent même si le bot est off)

		const post = { data: {
			name: command.name,
			description: command.description,
			options: command.options
		}};//these are the only JSON Param from Discord API
		
		var ok = true;
		await target.post(post)
			.catch(e => {
				console.error(`Error while posting command ${command.name}`.red);
				ok = false;
			})
			.then(e => {
				this.commands.set(command.name, command);
				this.resetCacheTimer(target);
			});
		return ok;
	},

	async removeCommand(command, target) {
		var ok = new Promise((resolve, reject) => {
			target(command.id);
			target.delete()
			.catch(e => {
				console.error(`Error while removing command ${command.name}`.red);
				console.log(e);
				resolve(false);
			})
			.then(buffer => {
				if(this.commands.has(command.name))
					this.commands.delete(command.name);
					this.resetCacheTimer(target);
				//console.log(`removeCommand is success for ${command.name}`)
				resolve(true);
			});
			target('..');//fait remonter au parent parce que le target() modifie target lui même...
			//ex s'il n'y a pas .. : path: '/applications/494587865775341578/guilds/313048977962565652/commands/792926340126736434/792926340973330462'
		});
		return ok;
	},

	async loadCommands(targetGlobal, targetPrivate) {
		console.log(`Loading commands...`.green);

		const commandFiles = fs.readdirSync(defaultCommandsPath).filter(file => file.endsWith('.js'))
		var cmdsLoaded = [];
		commandFiles.forEach(file => {
			const command = require(`../${defaultCommandsPath}/${file}`);
			if(command) {
				cmdsLoaded.push(command);
			}
			else {
				console.error(`Command not loaded : ${file}`.red);
			}
		});

		var c = {
			before: this.commands.length,
			after: 0,
			total: 0,
			public: 0,
			wip: 0,
			private: 0,
			other: 0
		};

		console.log(`Adding ${cmdsLoaded.length} commands...`.green);
		for (const command of cmdsLoaded) {
			var target = targetPrivate;//WIP ou Private
			switch(command.security) {
				case 'wip':
					console.warn(`Interaction /${command.name} is WIP`.yellow);
					break;
				case 'public':
					target = targetGlobal;
					break;
			}

			if(await this.addCommand(command, target)) {
				c.total++;
				switch(command.security) {
					case 'public': c.public++; break;
					case 'wip': c.wip++; break;
					case 'private': c.private++; break;
					default: c.other++;
				}
			}
		}
		console.log(`Loaded ${c.total} commands, ${c.public} public`.green);

		c.after = this.commands.length;
		return c;
	}

}