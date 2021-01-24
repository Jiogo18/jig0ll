const config = require('./config.js');


const guild_beta_tester = [ config.guild_test ];
const channel_beta_only = [ '541315862016032788' ];

const user_beta_tester = [ config.jiogo18 ];
const user_high_privilege = [ config.jiogo18 ];// cut command
const user_plenitude_privilege = [ config.jiogo18, config.rubis ];//plenitude_location
const user_private = [ config.jiogo18, config.jig0ll ];


const SecurityPlace = {
	PUBLIC: 'public',
	PRIVATE: 'private',
	NONE: 'none'
};



function getStricFunction(func) {//obtenir une fonction ou une fonction avec le retour func
	if(typeof func == 'function') return func;
	return () => { return func; }
}

const is = {
	betaAllowed(context) {
		const guild_id = context.guild && context.guild.id || context.guild_id;
		if(guild_id == undefined) {//mp
			return this.betaTester(context.author.id);
		}
		return this.betaGuild(guild_id);
	},

	betaGuild(guild_id) { return guild_beta_tester.includes(guild_id); },
	betaOnlyChannel(channel_id) { return channel_beta_only.includes(channel_id); },
	betaTester(user_id) { return user_beta_tester.includes(user_id); },

	hightPrivilegeUser(user_id) { return user_high_privilege.includes(user_id); },
	privateUser(user_id) { return user_private.includes(user_id); },//le bot et moi

	PlenitudePrivilege(user_id) { return user_plenitude_privilege.includes(user_id); },
}



class SecurityCommand {
	get securityCommand() { return true; }
	#securityPlace;
		get place() {
			if(this.wip) return SecurityPlace.NONE;
			return this.#securityPlace;
		};
	#interfaceSlashCmd;
		get interaction() { return this.#interfaceSlashCmd; };
		enableInteraction(enabled = true) { this.#interfaceSlashCmd = enabled; return this; };
	
	#wip;
		get wip() { return this.#wip || process.env.WIPOnly; };
		get wipSet() { return this.#wip; };
		setWip(wip = true) { this.#wip = wip; return this; };
	
	#parent;
		get parent() { return this.#parent; };
		set parent(parent) { this.#parent = parent != this ? parent : undefined; }
		setParent(parent) { this.parent = parent; return this; }
	
	#inheritance = true;
		get inheritance() { return this.#inheritance; }
	
	constructor(security, parent) {
		if(!security) {
			return;//default
		}
		this.securityPlace = security.place;
		this.interfaceSlashCmd = security.interaction;//enable interactions
		this.wip = security.wip;
		this.#parent = parent;
		this.#inheritance = security.inheritance || this.#inheritance;
		this.isAllowedToSee = security.isAllowedToSee || this.isAllowedToSee;
		this.#isAllowedToUse2 = security.isAllowedToUse || this.#isAllowedToUse2;
	}

	isAllowedToSee = function(context) {
		return this.isAllowedToUse(context);//si on peut l'utiliser alors on l'affiche
	}
	setIsAllowedToSee(func) { this.isAllowedToSee = getStricFunction(func); return this; }


	isAllowedToUse(context) {
		if((this.wip || process.env.WIPOnly) && is.betaAllowed(context) == false) return false;

		if(this.inheritance && this.parent && this.parent.isAllowedToUse) {
			if(this.parent.isAllowedToUse(context) == false)
				return false;
		}

		return this.#isAllowedToUse2(context);
	}
	#isAllowedToUse2 = function(context) {
		switch(this.place) {
			case SecurityPlace.PRIVATE: return is.hightPrivilegeUser(context.author.id);
			case SecurityPlace.PUBLIC: return true;
			case SecurityPlace.NONE: return false;
			default:
				//TODO: avoir une sécurité par héritage (créée au démarrage ?)
				console.warn(`isAllowedToUse unknow for ${this.name}`);
				return false;
		}
	}
	setIsAllowedToUse(func) { this.#isAllowedToUse2 = getStricFunction(func); return this; }

	allowedPlacesToCreateInteraction() {
		if(this.interaction != true) { return SecurityPlace.NONE; }
		return this.securityPlace;
	}
}






module.exports = {
	get guild_test() { return config.guild_test; },
	get jiogo18() { return config.jiogo18; },
	get rubis() { return config.rubis; },
	get jig0ll() { return config.jig0ll; },


	is: is,
	isBetaAllowed: is.betaAllowed,
	isBetaGuild: is.betaGuild,
	isBetaOnlyChannel: is.betaOnlyChannel,
	isBetaTester: is.betaTester,

	isHightPrivilegeUser: is.hightPrivilegeUser,
	isPrivateUser: is.privateUser,
	isPlenitudePrivilege: is.PlenitudePrivilege,
	


	botIsAllowedToDo(context) {
		const guild_id = (context.guild && context.guild.id) || context.guild_id;
		const channel_id = (context.channel && context.channel.id) || context.channel_id;
		if(process.env.WIPOnly) {
			//en WIPOnly on n'autorise que les serveurs de beta test
			return is.betaAllowed(context);
		}
		else {
			//en normal on autorise tout SAUF les channels de Beta Only
			if(is.betaGuild(guild_id) == false) {
				return true;//autorise si c'est pas une guild de beta test
			}
			if(is.betaOnlyChannel(channel_id)) {
				return false;//si c'est un channel de beta only
			}
			return true;//sinon c'est autorisé
		}
	},


	allowedPlace: SecurityPlace,

	isAllowedToCreateInteraction(command) {
		if(command.interaction != true) { return this.allowedPlace.NONE; }
		if(command.wip) { return this.allowedPlace.PRIVATE; }
		if(command.public) { return this.allowedPlace.PUBLIC; }
		if(command.private) { return this.allowedPlace.PRIVATE; }
		console.warn(`${command.name} has no interaction place available`);
		return this.allowedPlace.NONE;
	},


	isAllowedToUseCommand(command, context) {
		if(command.wip && is.betaAllowed(context) == false) { return false; }

		if(typeof command.isAllowed == 'function') { return command.isAllowed(context); }
		if(typeof command.isAllowedToUse == 'function') { return command.isAllowedToUse(context); }
		
		if(command.private) { return is.hightPrivilegeUser(context.author.id); }
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
	},


	SecurityCommand: SecurityCommand
}