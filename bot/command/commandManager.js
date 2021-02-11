import { Collection } from 'discord.js';
import fs from 'fs';
import { SecurityPlace } from './security.js';
const defaultCommandsPath = './commands';//from index.js !
import CommandStored from './commandStored.js';
import DiscordBot from '../bot.js';


export default class CommandManager {
	bot;
	#commands = new Collection(); get commands() { return this.#commands; }

	/**
	 * The command manager store every commands of the bot
	 * @param {DiscordBot} bot 
	 */
	constructor(bot) {
		this.bot = bot;
		if(bot.commandEnabled) this.loadCommands();
	}

	/**
	 * Get the command stored by the CommandManager
	 * @param {string} commandName The name of the command
	 * @returns {CommandStored} The command
	 */
	getCommand(commandName) { return this.commands.find(c => c.isCommand(commandName));	}

	/**
	 * Load and store the command
	 * @param {string} commandFilename The filename of the command
	 * @returns {Pomise<CommandStored>} `undefined` if the command wasn't created
	 */
	async loadCommand(commandFilename) {
		const commandFile = (await import('../../'+commandFilename)).default;
		if(!commandFile) { console.error(`Command not loaded : ${file}`.red); return; }
		const command = new CommandStored(commandFile, commandFilename);
		if(this.#commands.has(command.name)) {
			console.warn(`Conflict with two commands named '${command.name}', please use reloadCommand if it's not intended`.yellow);
		}

		this.#commands.set(command.name, command);
		return command;
	}
	/**
	 * Load every commands from the defaultCommandsPath
	 * @returns Return stats from loaded commands
	 */
	async loadCommands() {
		var start = Date.now();

		const commandPaths = getAllCommandFiles(defaultCommandsPath);

		var c = {
			before: this.commands.length,
			after: 0,
			public: 0,
			wip: 0,
			private: 0,
			hidden: 0,
			interaction: 0,
		};
		
		const loadedCommands = await Promise.all(commandPaths
			.map(c => this.loadCommand(c))
			.filter(c => c != undefined));
		//toutes les commandes qui ont été chargées

		loadedCommands.forEach(command => {
			if(command.security.wip) c.wip++;
			if(command.interaction) c.interaction++;
			if(command.security.hidden) c.hidden++;
			else {
				switch(command.security.place) {
					case SecurityPlace.PUBLIC: c.public++; break;
					case SecurityPlace.PRIVATE: c.private++; break;
				}
			}
		});
		c.after = this.commands.length;
		c.total = loadedCommands.length;
		
		console.log(`Loaded ${loadedCommands.length} commands in ${Date.now() - start} msec`.green);
		console.log(`Commands : ${c.public} public, ${c.private} private, ${c.hidden} hidden, ${c.wip} wip, ${c.interaction} with interaction`.green);
		return c;
	}

	/**
	 * Remove a command from the list
	 * @param {CommandStored} command The command to remove
	 * @returns {boolean} `true` if the command was removed, `false` if the command does not exist.
	 */
	removeCommand(command) { return this.commands.delete(command.name) }
	/**
	 * Reload a command
	 * @param {CommandStored} command The command to reload
	 * @returns {Promise<boolean>} `true` if the command was reloaded.
	 */
	async reloadCommand(command) {
		this.removeCommand(command);
		return this.loadCommand(filename);
	}
}




//https://stackoverflow.com/a/24594123/12908345
/**
 * Obtenir les dossiers dans path
 * @param {string} path 
 * @returns Les noms des dossiers du répertoire
 */
const getDirectories = path => fs.readdirSync(path, { withFileTypes: true })
	.filter(dirent => dirent.isDirectory())
	.map(dirent => dirent.name);
/**
 * Obtenir tous les dossiers et sous dossiers dans path
 * @param {string} path 
 * @returns Les chemins d'accès à tous les sous dossiers du répertoire
 */
function getAllDir(path) {
	const directories = getDirectories(path);
	var allDir = [];
	for(const dir of directories) {
		allDir.push(dir);
		allDir.concat(getAllDir(path + '/' + dir).map(d => dir + '/' + d));
	}
	
	return allDir;
}
/**
 * Obtenir les noms des commandes du dossier
 * @param {string} path 
 * @returns Les noms des fichiers de commande du répertoire
 */
function getCommandFiles(path) {
	return fs.readdirSync(path).filter(file => file.endsWith('.js'));
}
/**
 * Obtenir les chemins d'accès de toutes les commandes du dossier path
 * @param {string} path 
 * @returns Les chemins complets vers tous les fichiers de commande du répertoire
 */
function getAllCommandFiles(path) {
	var files = getCommandFiles(path).map(f => path+'/'+f);
	for(const directory of getAllDir(path)) {
		const localCommandFiles = getCommandFiles(path + '/' + directory);
		files = files.concat(localCommandFiles.map(f => path+'/'+directory+'/'+f));
	}
	return files;
}
