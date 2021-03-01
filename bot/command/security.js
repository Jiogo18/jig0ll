import config from '../config.js';
import { CommandContext } from './received.js';


const guild_beta_tester = [ config.guild_test ];
const channel_beta_only = [ '541315862016032788' ];

const user_beta_tester = [ config.jiogo18 ];
const user_high_privilege = [ config.jiogo18 ];// cut command
const user_plenitude_privilege = [ config.jiogo18, config.rubis ];//plenitude_location
const user_private = [ config.jiogo18, config.jig0ll ];


export const SecurityPlaces = {
	PUBLIC: 'public',
	PRIVATE: 'private',
	NONE: 'none'
};


/**
 * Get the function wich returns the content of func
 * @param {*} func A function or the result of the function
 */
function getStricFunction(func) {
	if(typeof func == 'function') return func;
	return () => func;
}

/**
 * Is `context` a beta allowed context
 * @param {CommandContext} context 
 */
export function isBetaAllowed(context) {
	const guild_id = context.guild && context.guild.id || context.guild_id;
	if(guild_id == undefined) {//mp
		return isBetaTester(context.author.id);
	}
	return isBetaGuild(guild_id);
}

/**
 * Is this guild a beta allowed guild?
 * @param {string} guild_id 
 * @returns {boolean} `true` if this guild is allowed to do beta things
 */
export function isBetaGuild(guild_id) { return guild_beta_tester.includes(guild_id); }
/**
 * Is this channel a beta only channel?
 * @param {string} channel_id 
 * @returns {boolean} `true` if this channel is only allowed to do beta things
 */
export function isBetaOnlyChannel(channel_id) { return channel_beta_only.includes(channel_id); }
/**
 * Is this user a beta tester?
 * @param {string} user_id
 * @returns {boolean} `true` if this user is allowed to do beta things
 */
export function isBetaTester(user_id) { return user_beta_tester.includes(user_id); }

/**
 * Is this user has elevated privileges?
 * @param {string} user_id 
 * @returns {boolean} `true` if this user has elevated privileges
 */
export function isHightPrivilegeUser(user_id) { return user_high_privilege.includes(user_id); }
/**
 * Is this user has private privileges?
 * @param {string} user_id only the bot and the author
 * @returns {boolean} `true` if this user has private privileges
 */
export function isPrivateUser(user_id) { return user_private.includes(user_id); }
/**
 * Is this user has privileges for Plénitude?
 * @param {string} user_id 
 * @returns {boolean} `true` if this user has privileges for Plénitude
 */
export function isPlenitudePrivilege(user_id) { return user_plenitude_privilege.includes(user_id); }




export class SecurityCommand {
	#securityPlace;
		get place() {
			if(this.wip && this.#securityPlace == SecurityPlaces.PUBLIC) return SecurityPlaces.PRIVATE;
			return this.#securityPlace || (this.parent && this.parent.place) || SecurityPlaces.NONE;
		};
	
	#wip;
		get wip() { return this.#wip || (this.parent && this.parent.wip); };
		get wipSet() { return this.#wip; };
		setWip(wip = true) { this.#wip = wip; return this; };
	hidden = false;
	
	#parent;
		get parent() { return this.#parent; };
		/**
		 * Set the parent of this security
		 * @param {SecurityCommand} parent
		 */
		set parent(parent) { this.#parent = (parent != this) ? parent : undefined; }
		setParent(parent) { this.parent = parent; return this; }
	
	#inheritance = true;
		get inheritance() { return this.#inheritance; }
	
	/**
	 * @param {{wip:boolean, place:SecurityPlaces, inheritance:boolean, isAllowedToSee:Function, isAllowedToUse:Function, hidden:boolean}} security 
	 * @param {SecurityCommand} parent 
	 */
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
		this.hidden = security.hidden;
	}

	/**
	 * @param {CommandContext} context The context where you want to see this
	 * @returns {boolean} `true` if you are allowed to see this
	 */
	isAllowedToSee = function(context) {
		return this.isAllowedToUse(context);//si on peut l'utiliser alors on l'affiche
	}
	/**
	 * Change the rule of isAllowedToSee
	 * @param {Function} func 
	 */
	setIsAllowedToSee(func) { this.isAllowedToSee = getStricFunction(func); return this; }

	/**
	 * @param {CommandContext} context The context where you want to use this
	 * @returns {boolean} `true` if you are allowed to user this
	 */
	isAllowedToUse(context) {
		if (this.wip && isBetaAllowed(context) != true) {
			context.NotAllowedReason = context.NotAllowedReason || `Sorry, you can't do that outside of a test server`;
			return false;
		}

		if (this.inheritance && this.parent?.isAllowedToUse) {
			if (this.parent.isAllowedToUse(context) != true) {
				return false;
			}
		}

		return this.#isAllowedToUse2(context);
	}
	/**
	 * @param {CommandContext} context The context where you want to use this
	 * @returns {boolean} `true` if you are allowed to user this
	 */
	#isAllowedToUse2 = function(context) {
		switch(this.place) {
			case SecurityPlaces.PRIVATE: return isHightPrivilegeUser(context.author.id);
			case SecurityPlaces.PUBLIC: return true;
			case SecurityPlaces.NONE: return false;
			case undefined: return false;
			default:
				console.warn(`isAllowedToUse place unknow for ${this.name} : ${this.place}`);
				return false;
		}
	}
	/**
	 * Change the rule of isAllowedToUse
	 * @param {Function} func 
	 */
	setIsAllowedToUse(func) { this.#isAllowedToUse2 = getStricFunction(func); return this; }
}


/**
 * @param {CommandContext} context The context where you want to work
 * @returns {boolean} `true` if the bot can do things
 */
export function botIsAllowedToDo(context) {
	const guild_id = (context.guild && context.guild.id) || context.guild_id;
	const channel_id = (context.channel && context.channel.id) || context.channel_id;
	if(process.env.WIPOnly) {
		//en WIPOnly on n'autorise que les serveurs de beta test
		return isBetaAllowed(context);
	}
	else {
		//en normal on autorise tout SAUF les channels de Beta Only
		if(isBetaGuild(guild_id) == false) {
			return true;//autorise si c'est pas une guild de beta test
		}
		if(isBetaOnlyChannel(channel_id)) {
			return false;//si c'est un channel de beta only
		}
		return true;//sinon c'est autorisé
	}
}


export default {
	get guild_test() { return config.guild_test; },
	get jiogo18() { return config.jiogo18; },
	get rubis() { return config.rubis; },
	get jig0ll() { return config.jig0ll; },


	isBetaAllowed,
	isBetaGuild,
	isBetaOnlyChannel,
	isBetaTester,

	isHightPrivilegeUser,
	isPrivateUser,
	isPlenitudePrivilege,
	


	botIsAllowedToDo,


	SecurityPlaces,

	SecurityCommand
}