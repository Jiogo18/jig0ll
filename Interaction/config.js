const security = require('./security.js');

class Security {
	name = 'security';
	isAllowed = function() { return false; };//est autorisé dans ce context avec cette sécurité ?
	constructor(name, filterFunction) {
		this.name = name;
		this.isAllowed = filterFunction;
	}
}

module.exports = {

	isWip(user) {
		return security.isBetaTester(user.id) || security.isJig0ll(user.id);
	},
	isJig0ll(user) { return user.id == process.env.BOT_ID; },


	
	securityLevel: {
		public: new Security('public', () => true),
		wip: new Security('wip', context => {
			const guild_id = context.guild && context.guild.id || context.guild_id;
			return security.isBetaGuild(guild_id);//uniquement sur un serv privé
		}),
		bot: new Security('bot', ({author}) => security.isJig0ll(author.id)),
		jiogo18: new Security('jiogo18', ({author}) => author.id == security.jiogo18),
		rubis: new Security('rubis', ({author}) => author.id == security.rubis),
		private: new Security('private', context => {//moi et le bot uniquement
			if(context.on == 'interaction_create') return module.exports.securityLevel.wip.isAllowed(context);//interactions sur le serv de test
			return module.exports.securityLevel.bot.isAllowed(context) || module.exports.securityLevel.jiogo18.isAllowed(context);
		})
	},
	isAllowedIfWIPOnly(context) {//en WIPOnly on n'autorise que si c'est sur la guild test
		return security.botIsAllowedToDo(context);
	},

	allowedPlace: {
		PUBLIC: 'public',
		PRIVATE: 'private',
		NONE: 'none'
	},

	isAllowedInteractionCreate(command) {
		if(command.interaction != true) { return this.allowedPlace.NONE; }
		if(command.wip) { return this.allowedPlace.PRIVATE; }
		if(command.public) { return this.allowedPlace.PUBLIC; }
		if(command.private) { return this.allowedPlace.PRIVATE; }
		console.warn(`${command.name} has no interaction place available`);
		return this.allowedPlace.NONE;
	},
	isAllowedToUse(command, context) {
		if(command.wip) { return this.securityLevel.wip.isAllowed(context); }
		if(typeof command.isAllowedToUse == 'function') { return command.isAllowedToUse(context); }
		if(command.public) { return this.securityLevel.public.isAllowed(context); }
		if(command.private) { return this.securityLevel.private.isAllowed(context); }
		if(command.type > 0) { return true; }//autorisé (pour les sous commandes)
		//TODO: avoir une sécurité par héritage (créée au démarrage ?)
		console.warn(`isAllowedToUse unknow for ${command.name}`);
	},
	isAllowedToSee(command, context) {
		if(command.secret || command.hidden) return false;
		if(command.publicSee) return true;
		return this.isAllowedToUse(command, context);
	},
	isAllowedToGetCommand(command, context, readOnly) {
		if(readOnly) return this.isAllowedToSee(command, context);
		return this.isAllowedToUse(command, context);
	}
};