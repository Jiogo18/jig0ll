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
		public: 'public',
		wip: 'wip',
		private: 'private'
	},
	isAllowed(context, security) {
		if(!security && process.env.WIPOnly)
			security = this.securityLevel.wip;

		switch(security) {//securityLevel
			case undefined:
			case 0:
			case false://pas de sécurité
			case this.securityLevel.public:
				return true;//tout le monde

			case this.securityLevel.wip:
				if(!context.guild) { return false; }
				return context.guild.id == this.guild_test;//uniquement sur un serv privé

			case this.securityLevel.private://moi et le bot uniquement
				switch(context.user.id) {
					case process.env.BOT_ID:
					case this.jiogo18:
						return true;
					default:
						return false;
				}
			
			default:
				console.error(`No security config set for ${security}`.red);
				return false;
		}
	}
};