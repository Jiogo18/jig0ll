import { Guild } from 'discord.js';
import AppManager, { DiscordInteractionStored } from '../../bot/AppManager.js';
import CommandStored from '../../bot/command/commandStored.js';
import { CommandContext, ReceivedCommand } from '../../bot/command/received.js';
import { MessageMaker, EmbedMaker } from '../../lib/messageMaker.js';
const spaces = '\u200b \u200b \u200b \u200b ';

const commands = [
	{
		name: 'list',
		description: 'Liste des intéractions du bot sur le serveur',
		execute: (cmdData, guild) => {
			return listInteraction(cmdData.context, guild);
		},
	},
	{
		name: 'get',
		description: 'Informations détaillées sur une intéraction',
		execute: (cmdData, guild) => 'work in progress',
	},
	{
		name: 'clean',
		description: 'Nettoyer toutes les intéractions du bot',
		execute: (cmdData, guild) => cleanInteraction(cmdData.context, guild),
	},
	{
		name: 'remove',
		description: "Retirer une commande d'un serveur",
		execute: (cmdData, guild, command) => removeInteraction(cmdData.context, guild, command),
		needInteraction: true,
	},
	{
		name: 'add',
		description: 'Ajouter une commande à partir des commandes chargées',
		/**
		 * !interaction add <server> <command>
		 * @param {ReceivedCommand} cmdData
		 * @param {Guild} guild
		 * @param {string} command
		 */
		execute: (cmdData, guild, command) => addInteraction(cmdData.context, guild, command),
		needCommand: true,
	},
];

export default {
	name: 'interaction',
	description: 'Informations sur les intéractions du bot',
	interaction: true,

	security: {
		place: 'private',
		wip: true,
	},

	options: [
		{
			name: 'subcommand',
			description: 'Sous commande des intéractions',
			type: 3,
			required: true,

			choices: commands.filter(o => o.name).map(o => ({ name: o.name, value: o.value || o.name })),
		},
		{
			name: 'serveur',
			description: 'Serveur ciblé',
			type: 3,
		},
		{
			name: 'command_id',
			description: 'Commande ciblé (si besoin)',
			type: 3,
		},
	],

	/**
	 * !interaction <sub command> <guild id>
	 * @param {ReceivedCommand} cmdData
	 * @param {[*]} levelOptions
	 */
	async executeAttribute(cmdData, levelOptions) {
		const commandName = levelOptions.subcommand || levelOptions[0]?.value;
		if (!commandName) return makeError('You must put the name of the command');
		const subcommand = commands.find(c => c.name === commandName);
		if (!commandName) return makeError(`Sub Command not found : ${commandName}`);

		const guild_id = levelOptions.guild || levelOptions[1]?.value;
		const guild = getGuild(cmdData, guild_id);

		const commandTargetName = levelOptions.command || levelOptions[2]?.value;
		if (!commandTargetName && (subcommand.needCommand || subcommand.needInteraction))
			return makeError("Donnez un nom de commande ou son id (vous devez préciser l'id du serveur aussi)");
		const commandTarget =
			(subcommand.needInteraction && (await getInteraction(commandTargetName, guild))) ||
			(subcommand.needCommand && cmdData.bot.commandMgr.getCommand(commandTargetName));
		if (!commandTarget && (subcommand.needCommand || subcommand.needInteraction))
			return makeError(`Commande introuvable dans ${guild?.name || 'global'} : ${commandTargetName}`);

		return await subcommand.execute(cmdData, guild, commandTarget);
	},

	execute() {
		const retour = new EmbedMaker('Interaction', `${commands.length} commands are available`);
		commands.forEach(c => retour.addField(`interaction ${c.name}`, c.description, true));
		return retour;
	},
};

function makeMessage(description) {
	return new EmbedMaker('Interaciton', description);
}
function makeError(description) {
	return new EmbedMaker('Interaction', description, { color: 'red' });
}

/**
 * List all interactions in the guild
 * `interaction list` was called
 * @param {CommandContext} context
 */
async function listInteraction(context, guild) {
	var globalInte = await AppManager.getCmdFrom();
	var localInte = guild ? await AppManager.getCmdFrom(guild.id) : undefined;
	//attendre les 2 intéractions pour envoyer

	const counter = globalInte.length + (localInte?.length || 0);
	globalInte = globalInte.map(option => option.name);
	localInte = localInte?.map(option => option.name);

	const retour = makeMessage(`${counter} interactions are available in ${guild?.name || 'global'}`);
	if (globalInte.length > 0) retour.addField('Global', `${spaces}${globalInte.join(`\n${spaces}`)}`);
	if (localInte?.length > 0) retour.addField('Local', `${spaces}${localInte.join(`\n${spaces}`)}`);
	return retour;
}

/**
 * Clean ALL interactions of the bot
 * `interaction clean` was called
 * @deprecated
 * @param {CommandContext} context
 */
async function cleanInteraction(context) {
	var slashCmd = context.interactionMgr;

	var globalInte = await AppManager.getCmdFrom();
	var localInte = await AppManager.getCmdFrom(context.guild_id);
	const counterBefore = globalInte.length + localInte.length;

	await slashCmd.cleanCommands().catch(e => console.error('error: cleanCommands global'.red, e)); //global
	await slashCmd.cleanCommands(context.guild_id).catch(e => console.error('error: cleanCommands guild'.red, e));
	await slashCmd.loadCommands();
	globalInte = await AppManager.getCmdFrom().catch(e => console.error('error: getCmdFrom 1'.red, e));
	localInte = await AppManager.getCmdFrom(context.guild_id).catch(e => console.error('error: getCmdFrom 2'.red, e));
	const counterAfter = globalInte.length + localInte.length;

	return new MessageMaker(`There were ${counterBefore} interactions, there are ${counterAfter}.`);
}

/**
 * Remove an interaction from the guild
 * @param {CommandContext} context
 * @param {Guild} guild `undefined` for global
 * @param {AppManager.DiscordInteractionStored} interaction The interaction to remove
 */
async function removeInteraction(context, guild, interaction) {
	const success = await AppManager.deleteCommand(interaction, AppManager.getTarget(guild?.id));
	return makeMessage(
		success
			? `L'intéraction '${interaction.name}' a été supprimée de ${guild?.name || 'global'}`
			: `Impossible de supprimer l'intéraction '${interaction.name}' de ${guild?.name || 'global'}`
	);
}

/**
 * Add an interaction to the guild
 * @param {CommandContext} context
 * @param {Guild} guild `undefined` for global
 * @param {CommandStored} command The command to add
 */
async function addInteraction(context, guild, command) {
	const success = await AppManager.postCommand(command, AppManager.getTarget(guild?.id), true);
	return makeMessage(
		success
			? `L'intéraction '${command.name}' a été ajoutée à ${guild?.id ? guild.name : 'global'}`
			: `Impossible d'ajouter l'intéraction '${command?.name}' à ${guild?.id ? guild.name : 'global'}`
	);
}

/**
 * Get the guild from his id
 * @param {ReceivedCommand} cmdData
 * @param {string} guild
 * @return {Guild} `undefined` for global
 */
function getGuild(cmdData, guild) {
	if (!guild) return cmdData.guild;
	switch (guild) {
		case undefined:
		case 'this':
		case 't':
			return cmdData.guild;
		case 'global':
		case 'g':
			return undefined;
	}
	const guild_id = guild?.id || (parseInt(guild) && guild);
	const guilds = cmdData.bot.guilds.cache;
	if (guild_id) return guilds.get(guild_id);
	return guilds.find(g => g.name == guild);
	//si la guild n'existe pas on a 'global' (undefined)
}

/**
 * Get the command from his id or his name
 * @param {string} command
 * @returns {Promise<DiscordInteractionStored>}
 */
async function getInteraction(command, guild) {
	const command_id = command?.id || (parseInt(command) && command);
	const commands = await AppManager.getCmdFrom(guild?.id);
	if (command_id) return commands.find(c => c.id == command_id);
	return commands.find(c => c.name === command);
}
