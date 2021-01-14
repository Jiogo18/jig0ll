class Security {
	name = 'security';
	isAllowed = function() { return false; };//est autorisé dans ce context avec cette sécurité ?
	constructor(name, filterFunction) {
		this.name = name;
		this.isAllowed = filterFunction;
	}
}

module.exports = {
	jiogo18: '175985476165959681',
	rubis: '262213332600225792',

	guild_test: '313048977962565652',

	isWip(user) {
		switch(user.id) {
			case process.env.BOT_ID:
			case this.jiogo18:
				return true;
		}
		return false;
	},
	isJig0ll(user) { return user.id == process.env.BOT_ID; },


	
	securityLevel: {
		public: new Security('public', () => true),
		wip: new Security('wip', context => {
			return (context.guild && context.guild.id || context.guild_id) == module.exports.guild_test;//uniquement sur un serv privé
		}),
		bot: new Security('bot', ({author}) => author.id == process.env.BOT_ID),
		jiogo18: new Security('jiogo18', ({author}) => author.id == module.exports.jiogo18),
		rubis: new Security('jiogo18', ({author}) => author.id == module.exports.rubis),
		private: new Security('private', context => {//moi et le bot uniquement
			if(context.on == 'interaction_create') return module.exports.securityLevel.wip.isAllowed(context);//interactions sur le serv de test
			return module.exports.securityLevel.bot.isAllowed(context) || module.exports.securityLevel.jiogo18.isAllowed(context);
		}),
		plenitude: new Security('plenitude', context => {
			return module.exports.securityLevel.private.isAllowed(context) || module.exports.securityLevel.rubis.isAllowed(context);
		}),
		secret: new Security('secret', ({on}) => { return on != 'interaction_create'; })
	},
	isAllowed(context, security) {
		if(process.env.WIPOnly && !this.securityLevel.wip.isAllowed(context)) return false;//en wip et que ça marche pas pour le wip

		if(security == 0 || security == undefined || security == false)
			return true;//pas de sérucité


			if(typeof security != 'object')
			security = this.securityLevel[security];
		if(security && security.isAllowed)
			return security.isAllowed(context);

		console.error(`No security config set for ${security}`.red);
		return false;
	}
};