import Discord from 'discord.js';
import fs from 'fs';
const defaultCommandsPath = './commands';
var existingCommands = new Discord.Collection();//stocker les commandes et pas les redemander h24//TODO: liste avec database.js car c'est une même fonction pour tous
import Security from './security.js';
import CommandStored from './commandStored.js';
import AppManager from './AppManager.js';

export default {

	async getExistingCommands(target, forceUpdate) {
		var commandsStored = existingCommands.get(target.path);

		if(forceUpdate) {
			console.warn(`getExistingCommands called with forceUpdate.`.yellow);
		}
		
		if(!commandsStored || commandsStored.timeUpdate < Date.now() || forceUpdate) {
			if(commandsStored)
				console.warn(`Asking Discord for existing Commands (ping: ${Date.now() - commandsStored.lastUpdate} ms)`.magenta);

			var commandsGet = [];
			try {
				commandsGet = await target.r.get();
			} catch(error) {
				console.warn(`Can't get commands from ${target.r}, it's maybe empty`.yellow);
				commands = [];
			}
			commandsStored = {
				commands: commandsGet,
				lastUpdate: Date.now(),
				timeUpdate: Date.now() + 1000
			}
			existingCommands.set(target.path, commandsStored);
		}
		return commandsStored.commands;
	},

	resetCacheTimer(target) {
		commands = existingCommands.get(target.path);
		if(commands) commands.timeUpdate = 0;
	},

	async getCommand(commandName, target) {
		return command = (await this.getExistingCommands(target))
			.find(command => command.name == commandName);
	},
	async getCommandId(commandName, target) {
		const command = await this.getCommand(commandName, target);
		return command ? command.id : undefined;
	},



	commands: new Discord.Collection(),//les commandes stockées par le bot (avec les execute())

	addCommand(command, target) {

		// on ecrasera forcément les anciens post car on sait pas s'ils sont utilisés (ils restent même si le bot est off)
		
		var posted = new Promise((resolve, reject) => {
			AppManager.post(command, target)
				.then(() => {
					this.resetCacheTimer(target);
					resolve(true);
				})
				.catch(() => resolve(false) );
		});
		this.commands.set(command.name, command);//registered also if it's not posted
		return posted;
	},

	removeCommand(command, target) {
		target = target.clone();//don't change ths path for others

		return new Promise((resolve, reject) => {
			target.go(command.id);
			target.r.delete()
			.catch(e => {
				console.error(`Error while removing command ${command.name}`.red);
				console.log(e);
				resolve(false);
			})
			.then(() => {
				if(this.commands.has(command.name)) this.commands.delete(command.name);
				this.resetCacheTimer(target);
				resolve(true);
			});
		});
	},

	async loadCommands(targetGlobal, targetPrivate) {
		console.log(`Loading commands...`.green);

		const commandFiles = fs.readdirSync(defaultCommandsPath).filter(file => file.endsWith('.js'))
		const cmdsLoaded = await Promise.all(commandFiles.map(async file => {
			const command = (await import(`../${defaultCommandsPath}/${file}`)).default;
			if(command) {
				return new CommandStored(command);
			}
			else {
				console.error(`Command not loaded : ${file}`.red);
			}
		}).filter(c => c != undefined));

		var c = {
			before: this.commands.length,
			after: 0,
			total: 0,
			public: 0,
			wip: 0,
			private: 0,
			hidden: 0,
			interaction: 0,
		};

		console.log(`Adding ${cmdsLoaded.length} commands...`.green);

		const commandSent = cmdsLoaded.map(async command => {
			var target = undefined;
			switch(command.allowedPlacesToCreateInteraction) {
				case Security.SecurityPlace.PUBLIC: target = targetGlobal; break;
				case Security.SecurityPlace.PRIVATE: target = targetPrivate; break;
			}
			
			if(process.env.WIPOnly && target == targetGlobal) target = targetPrivate;//serv privé (en WIP)
			
			
			c.total++;
			if(await this.addCommand(command, target)) {
				c.interaction++;
			}
			if(command.wip) c.wip++;
			switch(target) {
				case targetPrivate: c.private++; break;
				case targetGlobal: c.public++; break;
				case undefined: c.hidden++; break;
			}
		});
		await Promise.all(commandSent);
		//pas de différence de vitesse : 1246/1277/1369/1694/2502 ms (avec Promise) contre 1237/1267/1676/1752/2239 ms (avec await)
		console.log(`Loaded ${c.total} commands : ${c.public} public, ${c.private} private, ${c.wip} wip, ${c.hidden} hidden`.green);

		c.after = this.commands.length;
		return c;
	},

	getCommand(commandName) {
		return this.commands.find(command => command.isCommand(commandName));
	},
	getCommandForData(cmdData, readOnly) {//TODO: remove it
		var command = this.getCommand(cmdData.commandName);

		if(!command) return;
		

		if(cmdData.options && cmdData.options.length > 0)
			[command,] = command.getSubCommand(cmdData.options);
		if(!command) { throw `Command not found`; }


		if(readOnly) {
			if(!command.security.isAllowedToSee(cmdData.context))
				return `You can't do that`;
			//command.execute = undefined;//can't execute it
			//fix for the new CommandStored : it can't be removed like this, use security insted
		}
		else {
			if(!command.security.isAllowedToUse(cmdData.context))
				return `You can't do that`;
		}
		return command;
	}

}
