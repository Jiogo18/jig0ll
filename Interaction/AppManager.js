var bot;

//https://discord.com/developers/docs/interactions/slash-commands#get-global-application-commands
//https://stackoverflow.com/questions/65402187/new-discord-slash-commands#answer-65422307
//Global Application Command: applications/{application.id}/commands
//Guild Application Command: applications/{application.id}/guilds/{guild.id}/commands


// get: array avec les commandes
// post({data:{}}): post une commande
// patch: edit une commande (mais peut aussi être écrasé par un post)
// (id)delete: delete une commande
class DiscordRequest {
	#path = [];
		get path() { return this.#path.join('/'); }
	//TODO: bot.api peut être récup sans le bot ? ça serait plus simple
	get request() { return bot.api.applications(bot.user.id)[this.path]; }
	get r() { return this.request; }

	constructor(path = '') {
		if(path && path != '') {
			this.#path = path.split('/');
		}
		
	}

	clone() { return new DiscordRequest(this.path); }
	go(path) {
		if(path.length > 0) {
			this.#path = this.#path.concat(path.split('/'));
		}
		return this;
	}

	back() {
		this.#path.pop();
		//ou : this.path += '/..';
		// ancienne solution pour le [[Function: noop]] mais pas pratique
		return this;
	}
}



module.exports = {
	setBot(b) { bot = b; },

	DiscordRequest,

	getGlobal() { return new DiscordRequest(); },
	getGuild(id) { return new DiscordRequest(id ? `guilds/${id}` : ''); },
	getTarget(id) { return this.getGuild(id).go('commands'); },
	getCmdFrom(guild_id) { return this.getTarget(guild_id).request.get(); },



	async post(command, target) {
		if(!target) return false;

		var promise = target.r.post(command.JSON);
		//TODO : utiliser patch si elle existe car ça supprimerais des mauvais trucs

		return new Promise((resolve, reject) => {
			promise
			.then(() => resolve() )
			.catch(e => {
				console.error(`Error while posting command ${command.name} ${e}`.red);
				console.error(e);
				reject(`Error while posting command ${command.name} ${e}`);
			})
		});
	}
};