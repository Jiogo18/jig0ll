const InteractionBase = require('../Interaction/base.js');

var slashMgr = undefined
module.exports = {
	name: 'interaction',
	description: 'Informations sur les intéractions du bot',
	security: InteractionBase.getConfig().securityLevel.wip,

	options: [{
		name: "list",
		description: "Liste des intéractions du bot sur ce serveur",
		type: 1,

		async execute(interaction) {
			if(!slashMgr) { throw 'Interaction not set'; }
			var globalInte = await slashMgr.getCmdFrom();
			var localInte = await slashMgr.getCmdFrom(interaction.guild_id);
			//attendre les 2 intéractions pour envoyer

			const counter = globalInte.length + localInte.length;
			globalInte = globalInte.map(option => { return option.name; });
			localInte = localInte.map(option => { return option.name; });

			const global = globalInte.length ? `        ${globalInte.join('\n        ')}\n` : '';
			const local = localInte.length ? `        ${localInte.join('\n        ')}\n` : '';
			return `${counter} interactions are available in this guild\n    Global:\n${global}    Local:\n${local}`;
		}/*,

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
		async execute(interaction) {
			if(!slashMgr) { throw 'Interaction not set'; }

			var globalInte = await slashMgr.getCmdFrom();
			var localInte = await slashMgr.getCmdFrom(interaction.guild_id);
			const counterBefore = globalInte.length + localInte.length;

			await slashMgr.cleanCommands().catch(e => { console.error('error: cleanCommands global'); });//global
			await slashMgr.cleanCommands(interaction.guild_id).catch(e => { console.error('error: cleanCommands guild'); console.log(e) });
			await slashMgr.loadCommands().catch(e => { console.error('error: loadCommands'); });
			globalInte = await slashMgr.getCmdFrom().catch(e => { console.error('error: getCmdFrom 1'); });
			localInte = await slashMgr.getCmdFrom(interaction.guild_id).catch(e => { console.error('error: getCmdFrom 2'); });
			const counterAfter = globalInte.length + localInte.length;

			return `There were ${counterBefore} interactions, there are ${counterAfter}.`;
		}
	}],

	setBot(bot) {
		slashMgr = InteractionBase ? new InteractionBase(bot) : undefined;
	}
};