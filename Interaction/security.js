

const guild_beta_tester = [ '313048977962565652' ];//serveur privé
const channel_beta_only = [ '541315862016032788' ];
const user_beta_tester = [ '175985476165959681' ];

module.exports = {

	isBetaGuild(guild_id) { return guild_beta_tester.includes(guild_id); },
	isBetaOnlyChannel(channel_id) { return betaOnlyChannel.includes(channel_id); },

	isBetaTester(user_id) { return betaTester.includes(user_id); },
	isJig0ll(user_id) { return user_id == process.env.BOT_ID; },


	botIsAllowedToDo(context) {
		const guild_id = (context.guild && context.guild.id) || context.guild_id;
		const channel_id = (context.channel && context.channel.id) || context.channel_id;
		if(process.env.WIPOnly) {
			//en WIPOnly on n'autorise que les serveurs de beta test
			return this.isBetaGuild(guild_id);
		}
		else {
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