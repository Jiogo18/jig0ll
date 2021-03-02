import config from '../config.js';
import { CommandContext } from './received.js';

export const guild_beta_tester = [config.guild_test, '815995510178447422'];
export const channel_beta_only = ['541315862016032788'];
export const guild_plenitude = [config.guild_test, '815995510178447422', '626121178163183628']; //plenitude invite_score

export const user_beta_tester = [config.jiogo18];
export const user_high_privilege = [config.jiogo18]; // cut command
export const user_plenitude_privilege = [config.jiogo18, config.rubis]; //plenitude_location
export const user_private = [config.jiogo18, config.jig0ll];

export const SecurityPlaces = {
	PUBLIC: 'public',
	PRIVATE: 'private',
	NONE: 'none',
};

/**
 * Get the function wich returns the content of func
 * @param {*} func A function or the result of the function
 */
function getStricFunction(func) {
	if (typeof func == 'function') return func;
	return () => func;
}

/**
 * Is `context` a beta allowed context
 * @param {CommandContext} context
 */
export function isBetaAllowed(context) {
	const guild_id = (context.guild && context.guild.id) || context.guild_id;
	if (guild_id == undefined) {
		//mp
		return isBetaTester(context.author.id);
	}
	return isBetaGuild(guild_id);
}

/**
 * Is this guild a beta allowed guild?
 * @param {string} guild_id
 * @returns `true` if this guild is allowed to do beta things
 */
export const isBetaGuild = guild_id => guild_beta_tester.includes(guild_id);
/**
 * Is this channel a beta only channel?
 * @param {string} channel_id
 * @returns `true` if this channel is only allowed to do beta things
 */
export const isBetaOnlyChannel = channel_id => channel_beta_only.includes(channel_id);
/**
 * Is this user a beta tester?
 * @param {string} user_id
 * @returns `true` if this user is allowed to do beta things
 */
export const isBetaTester = user_id => user_beta_tester.includes(user_id);

/**
 * Is this user has elevated privileges?
 * @param {string} user_id
 * @returns `true` if this user has elevated privileges
 */
export const isHightPrivilegeUser = user_id => user_high_privilege.includes(user_id);
/**
 * Is this user has private privileges?
 * @param {string} user_id only the bot and the author
 * @returns `true` if this user has private privileges
 */
export const isPrivateUser = user_id => user_private.includes(user_id);
/**
 * Is this user has privileges for Plénitude?
 * @param {string} user_id
 * @returns `true` if this user has privileges for Plénitude
 */
export const isPlenitudePrivilege = user_id => user_plenitude_privilege.includes(user_id);

export class SecurityCommand {
	#securityPlace;
	get place() {
		if (this.wip && this.#securityPlace == SecurityPlaces.PUBLIC) return SecurityPlaces.PRIVATE;
		return this.#securityPlace || (this.parent && this.parent.place) || SecurityPlaces.NONE;
	}

	#wip;
	get wip() {
		return this.#wip || (this.parent && this.parent.wip);
	}
	get wipSet() {
		return this.#wip;
	}
	setWip(wip = true) {
		this.#wip = wip;
		return this;
	}
	hidden = false;

	parent;

	inheritance = true;

	/**
	 * @param {{wip:boolean, place:SecurityPlaces, inheritance:boolean, isAllowedToSee:Function, isAllowedToUse:Function, hidden:boolean}} security
	 * @param {SecurityCommand} parent
	 */
	constructor(security, parent) {
		this.parent = parent;
		if (!security) {
			return; //default
		}
		this.#wip = security.wip;

		this.#securityPlace = security.place;

		if (security.inheritance != undefined) this.inheritance = security.inheritance;
		if (security.isAllowedToSee) this.isAllowedToSee = security.isAllowedToSee;
		if (security.isAllowedToUse) this.#isAllowedToUse2 = security.isAllowedToUse;
		this.hidden = security.hidden;
	}

	/**
	 * @param {CommandContext} context The context where you want to see this
	 * @returns {boolean} `true` if you are allowed to see this
	 */
	isAllowedToSee = function (context) {
		return this.isAllowedToUse(context); //si on peut l'utiliser alors on l'affiche
	};
	/**
	 * Change the rule of isAllowedToSee
	 * @param {Function} func
	 */
	setIsAllowedToSee(func) {
		this.isAllowedToSee = getStricFunction(func);
		return this;
	}

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
	#isAllowedToUse2 = function (context) {
		switch (this.place) {
			case SecurityPlaces.PRIVATE:
				return isHightPrivilegeUser(context.author.id);
			case SecurityPlaces.PUBLIC:
				return true;
			case SecurityPlaces.NONE:
				return false;
			case undefined:
				return false;
			default:
				console.warn(`isAllowedToUse place unknow for ${this.name} : ${this.place}`);
				return false;
		}
	};
	/**
	 * Change the rule of isAllowedToUse
	 * @param {Function} func
	 */
	setIsAllowedToUse(func) {
		this.#isAllowedToUse2 = getStricFunction(func);
		return this;
	}
}

/**
 * @param {CommandContext} context The context where you want to work
 * @returns {boolean} `true` if the bot can do things
 */
export function botIsAllowedToDo(context) {
	const guild_id = (context.guild && context.guild.id) || context.guild_id;
	const channel_id = (context.channel && context.channel.id) || context.channel_id;
	if (process.env.WIPOnly) {
		//en WIPOnly on n'autorise que les serveurs de beta test
		return isBetaAllowed(context);
	} else {
		//en normal on autorise tout SAUF les channels de Beta Only
		if (isBetaGuild(guild_id) == false) {
			return true; //autorise si c'est pas une guild de beta test
		}
		if (isBetaOnlyChannel(channel_id)) {
			return false; //si c'est un channel de beta only
		}
		return true; //sinon c'est autorisé
	}
}

export default {
	get guild_test() {
		return config.guild_test;
	},
	get jiogo18() {
		return config.jiogo18;
	},
	get rubis() {
		return config.rubis;
	},
	get jig0ll() {
		return config.jig0ll;
	},

	isBetaAllowed,
	isBetaGuild,
	isBetaOnlyChannel,
	isBetaTester,

	isHightPrivilegeUser,
	isPrivateUser,
	isPlenitudePrivilege,

	botIsAllowedToDo,

	SecurityPlaces,

	SecurityCommand,
};
