const guild_test = '313048977962565652';//serveur privé
const guild_beta_tester = [ guild_test ];
const channel_beta_only = [ '541315862016032788' ];
const users = { jiogo18: '175985476165959681', rubis: '262213332600225792' };
const user_beta_tester = [ users.jiogo18 ];// wip commands
const user_high_privilege = [ users.jiogo18 ];// cut command
const user_plenitude_privilege = [ user.jiogo18, user.rubis ];//plenitude_location

module.exports = {
	get guild_test() { return guild_test; },
	get jiogo18() { return users.jiogo18; },
	get rubis() { return users.rubis; },

	isBetaGuild(guild_id) { return guild_beta_tester.includes(guild_id); },
	isBetaOnlyChannel(channel_id) { return channel_beta_only.includes(channel_id); },

	isJig0ll(user_id) { return user_id == process.env.BOT_ID; },
	isBetaTester(user_id) { return user_beta_tester.includes(user_id); },
	
	isHightPrivilegeUser(user_id) { return user_high_privilege.includes(user_id); },
	isPlenitudePrivilege(user_id) { return user_plenitude_privilege.includes(user_id); },


	botIsAllowedToDo(context) {
		const guild_id = (context.guild && context.guild.id) || context.guild_id;
		const channel_id = (context.channel && context.channel.id) || context.channel_id;
		if(process.env.WIPOnly) {
			//en WIPOnly on n'autorise que les serveurs de beta test
			return this.isBetaGuild(guild_id);
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
	}


}