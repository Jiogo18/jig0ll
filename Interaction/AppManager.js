var bot;
var canPostCommands = true;

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

export function getGlobal() { return new DiscordRequest(); }
export function getGuild(id) { return new DiscordRequest(id ? `guilds/${id}` : ''); }
export function getTarget(id) { return getGuild(id).go('commands'); }
export function getCmdFrom(guild_id) { return getTarget(guild_id).request.get(); }


export async function postCommand(command, target) {
	if(!target) return false;

	var promise = target.r.post(command.JSON);
	//TODO : utiliser patch si elle existe car ça supprimerais des mauvais trucs
	return new Promise((resolve, reject) => {
		promise
		.then(() => resolve(true) )
		.catch(e => {
			if(!canPostCommands) { resolve(false); return; }//on sait déjà qu'on peut pas poster

			console.error(`Error while posting command '${command.name}' code: ${e.httpStatus}`.red);

			switch(e.code) {
				case 0:
					console.error(e.message);
					canPostCommands = false;//on a dépassé le quota des 200 messages
					setTimeout(() => { canPostCommands = true; }, 10000);//peut être dans 10s
					break;
				default:
					console.error(e);
					break;
			}
			
			resolve(false);
		})
	});
}
export async function removeCommand(command, target) {
	if(!target) return false;
	target = target.clone();//don't change ths path for others

	return new Promise((resolve, reject) => {
		target.go(command.id);
		target.r.delete()
		.then(() => resolve(true) )
		.catch(e => {
			console.error(`Error while removing command '${command.name}'`.red);
			console.log(e);
			reject(false);
		})
	});
}


export default {
	setBot(b) { bot = b; },

	DiscordRequest,

	getGlobal,
	getGuild,
	getTarget,
	getCmdFrom,

	postCommand,
	removeCommand,
	
};