const config = require('./config.js');


const guild_beta_tester = [ config.guild_test ];
const channel_beta_only = [ '541315862016032788' ];

const user_beta_tester = [ config.jiogo18 ];
const user_high_privilege = [ config.jiogo18 ];// cut command
const user_plenitude_privilege = [ config.jiogo18, config.rubis ];//plenitude_location
const user_private = [ config.jiogo18, config.jig0ll ];


module.exports = {
	get guild_test() { return config.guild_test; },
	get jiogo18() { return config.jiogo18; },
	get rubis() { return config.rubis; },
	get jig0ll() { return config.jig0ll; },


	isBetaGuild(guild_id) { return guild_beta_tester.includes(guild_id); },
	isBetaOnlyChannel(channel_id) { return channel_beta_only.includes(channel_id); },
	isBetaTester(user_id) { return user_beta_tester.includes(user_id); },
	isBetaAllowed(context) {
		const guild_id = context.guild && context.guild.id || context.guild_id;
		if(guild_id == undefined) {//mp
			return this.isBetaTester(context.author.id);
		}
		return this.isBetaGuild(guild_id);
	},

	isPrivateUser(user_id) { return user_private.includes(user_id); },//le bot et moi
	
	isHightPrivilegeUser(user_id) { return user_high_privilege.includes(user_id); },
	isPlenitudePrivilege(user_id) { return user_plenitude_privilege.includes(user_id); },


	botIsAllowedToDo(context) {
		const guild_id = (context.guild && context.guild.id) || context.guild_id;
		const channel_id = (context.channel && context.channel.id) || context.channel_id;
		if(process.env.WIPOnly) {
			//en WIPOnly on n'autorise que les serveurs de beta test
			return this.isBetaAllowed(context);
		}
		else {
			//en normal on autorise tout SAUF les channels de Beta Only
			if(this.isBetaGuild(guild_id) == false) {
				return true;//autorise si c'est pas une guild de beta test
			}
			if(this.isBetaOnlyChannel(channel_id)) {
				return false;//si c'est un channel de beta only
			}
			return true;//sinon c'est autorisé
		}
	},

	allowedPlace: {
		PUBLIC: 'public',
		PRIVATE: 'private',
		NONE: 'none'
	},

	isAllowedToCreateInteraction(command) {
		if(command.interaction != true) { return this.allowedPlace.NONE; }
		if(command.wip) { return this.allowedPlace.PRIVATE; }
		if(command.public) { return this.allowedPlace.PUBLIC; }
		if(command.private) { return this.allowedPlace.PRIVATE; }
		console.warn(`${command.name} has no interaction place available`);
		return this.allowedPlace.NONE;
	},


	isAllowedToUseCommand(command, context) {
		if(command.wip && this.isBetaAllowed(context) == false) { return false; }

		if(typeof command.isAllowed == 'function') { return command.isAllowed(context); }
		if(typeof command.isAllowedToUse == 'function') { return command.isAllowedToUse(context); }
		
		if(command.private) { return this.isHightPrivilegeUser(context.author.id); }
		if(command.public) { return true; }
		if(command.type > 0) { return true; }//autorisé (pour les sous commandes)
		//TODO: avoir une sécurité par héritage (créée au démarrage ?)
		console.warn(`isAllowedToUse unknow for ${command.name}`);
	},

	isAllowedToSeeCommand(command, context) {
		if(typeof command.isAllowedToSee == 'function') { return command.isAllowedToSee(context); }
		
		if(command.secret || command.hidden) return false;
		if(command.publicSee) return true;

		return this.isAllowedToUseCommand(command, context);//sinon on l'affiche (si elle est disponible)
	},

	isAllowedToGetCommand(command, context, readOnly) {
		if(readOnly) return this.isAllowedToSeeCommand(command, context);
		return this.isAllowedToUseCommand(command, context);
	}
}