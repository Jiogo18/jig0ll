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
			if(this.wip && this.#securityPlace == SecurityPlace.PUBLIC) return SecurityPlace.PRIVATE;
			return this.#securityPlace || (this.parent && this.parent.place) || SecurityPlace.NONE;
		};
	
	#wip;
		get wip() { return this.#wip || (this.parent && this.parent.wip); };
		get wipSet() { return this.#wip; };
		setWip(wip = true) { this.#wip = wip; return this; };
	
	#parent;
		get parent() { return this.#parent; };
		set parent(parent) { this.#parent = (parent != this) ? parent : undefined; }
		setParent(parent) { this.parent = parent; return this; }
	
	#inheritance = true;
		get inheritance() { return this.#inheritance; }
	
	constructor(security, parent) {
		this.parent = parent;
		if(!security) {
			return;//default
		}
		this.#wip = security.wip;

		this.#securityPlace = security.place;

		if(security.inheritance) this.#inheritance = security.inheritance;
		if(security.isAllowedToSee) this.isAllowedToSee = security.isAllowedToSee;
		if(security.isAllowedToUse) this.#isAllowedToUse2 = security.isAllowedToUse;
	}

	isAllowedToSee = function(context) {
		return this.isAllowedToUse(context);//si on peut l'utiliser alors on l'affiche
	}
	setIsAllowedToSee(func) { this.isAllowedToSee = getStricFunction(func); return this; }


	isAllowedToUse(context) {
		if((this.wip) && is.betaAllowed(context) == false) return false;

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
			case undefined: return false;
			default:
				console.warn(`isAllowedToUse place unknow for ${this.name} : ${this.place}`);
				return false;
		}
	}
	setIsAllowedToUse(func) { this.#isAllowedToUse2 = getStricFunction(func); return this; }
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


	SecurityPlace: SecurityPlace,

	SecurityCommand: SecurityCommand
}