const InteractionBase = require('../Interaction/base.js');

module.exports = {
	name: 'interaction',
	description: 'Informations sur les intéractions du bot',
	security: InteractionBase.config.securityLevel.wip,

	options: [{
		name: "list",
		description: "Liste des intéractions du bot sur ce serveur",
		type: 1,

		execute: listInteraction
		/*
		options: [{

			//TODO: id du serveur
		}]*/
	},{
		name: "get",
		description: "Donne des informations sur une intéraction",
		type: 1,
		execute() { return  'Work in progress' }
	},{
		name: "clean",
		description: "Nettoye les intéractions",
		type: 1,
		execute: cleanInteraction
	}]
};








async function listInteraction(context, application) {
	var slashCmd = application.interaction; 
	var globalInte = await slashCmd.getCmdFrom();
	var localInte = await slashCmd.getCmdFrom(context.guild_id);
	//attendre les 2 intéractions pour envoyer

	const counter = globalInte.length + localInte.length;
	globalInte = globalInte.map(option => { return option.name; });
	localInte = localInte.map(option => { return option.name; });

	const global = globalInte.length ? `        ${globalInte.join('\n        ')}\n` : '';
	const local = localInte.length ? `        ${localInte.join('\n        ')}\n` : '';
	return `${counter} interactions are available in this guild\n    Global:\n${global}    Local:\n${local}`;
}


async function cleanInteraction(context, application) {
	var slashCmd = application.interaction;

	var globalInte = await slashCmd.getCmdFrom();
	var localInte = await slashCmd.getCmdFrom(context.guild_id);
	const counterBefore = globalInte.length + localInte.length;

	await slashCmd.cleanCommands().catch(e => { console.error('error: cleanCommands global'); });//global
	await slashCmd.cleanCommands(context.guild_id).catch(e => { console.error('error: cleanCommands guild'); console.log(e) });
	await slashCmd.loadCommands();
	globalInte = await slashCmd.getCmdFrom().catch(e => { console.error('error: getCmdFrom 1'); });
	localInte = await slashCmd.getCmdFrom(context.guild_id).catch(e => { console.error('error: getCmdFrom 2'); });
	const counterAfter = globalInte.length + localInte.length;

	return `There were ${counterBefore} interactions, there are ${counterAfter}.`;
}