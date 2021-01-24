const Discord = require('discord.js');
const fs = require('fs');
const defaultCommandsPath = './commands';
var existingCommands = new Discord.Collection();//stocker les commandes et pas les redemander h24
const Security = require('./security.js');
const CommandStored = require('./commandStored.js');

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



	commands: new Discord.Collection(),//les commandes stockées par le bot (avec les execute())

	async addCommand(command, target) {

		// on ecrasera forcément les anciens post car on sait pas s'ils sont utilisés (ils restent même si le bot est off)
		
		var posted = false;
		if(target) {
			await target.post(command.JSON)//TODO : utiliser patch si elle existe car ça supprimerais des mauvais trucs
			.catch(e => {
				console.error(`Error while posting command ${command.name} ${e}`.red);
				posted = false;
			})
			.then(e => {
				posted = true;
				this.resetCacheTimer(target);
			});
		}
		this.commands.set(command.name, command);//registered also if it's not posted
		return posted;
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
				cmdsLoaded.push(new CommandStored(command));
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
			hidden: 0,
		};

		console.log(`Adding ${cmdsLoaded.length} commands...`.green);
		for (const command of cmdsLoaded) {
			var target = undefined;
			switch(command.allowedPlacesToCreateInteraction) {
				case Security.SecurityPlace.PUBLIC: target = targetGlobal; break;
				case Security.SecurityPlace.PRIVATE: target = targetPrivate; break;
			}
			
			if(process.env.WIPOnly && target == targetGlobal) target = targetPrivate;//serv privé (en WIP)

			c.total++;
			if(await this.addCommand(command, target)) {
				if(command.wip) c.wip++;
				switch(target) {
					case targetPrivate: c.private++; break;
					case targetGlobal: c.public++; break;
					case undefined: c.hidden++; break;
				}
			}
		}
		//pas de différence de vitesse : 1246/1277/1369/1694/2502 ms (avec Promise) contre 1237/1267/1676/1752/2239 ms (avec await)
		console.log(`Loaded ${c.total} commands, ${c.public} public, ${c.private} private`.green);

		c.after = this.commands.length;
		return c;
	},

	getCommand(commandName) {
		return this.commands.find(command => command.isCommand(commandName));
	},
	getCommandForData(cmdData, readOnly) {
		var command = this.getCommand(cmdData.commandName);

		if(!command) return;
		

		if(cmdData.options && cmdData.options.length > 0)
			command = command.getSubCommand(cmdData.options);
		if(!command) { throw `Command not found`; }


		if(readOnly) {
			if(!command.security.isAllowedToGet(cmdData.context))
				return `You can't do that`;
			command.execute = undefined;//can't execute it
		}
		else {
			if(!command.security.isAllowedToUse(cmdData.context))
				return `You can't do that`;
		}
		return command;
	}

}

function strToFlatStr(str) {
	return str.toLowerCase().replace(/[àâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[ìîï]/g,'i').replace(/[òôö]/g,'o').replace(/[ùûü]/g,'u').replace('ÿ','y').replace('ñ','n');
}

function commandNameMatch(name1, name2) {
	return strToFlatStr(name1) == strToFlatStr(name2);
}