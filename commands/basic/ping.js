import { Message } from 'discord.js';
import { EmbedMaker } from '../../lib/messageMaker.js';
import { Snowflake } from '../../lib/snowflake.js';


export default {
	name: 'ping',
	description: 'Pong!',
	interaction: true,

	security: {
		place: 'public',
	},

	/**
	 * Executed when there is no valid option
	 * @param {ReceivedCommand} cmdData 
	 */
	execute(cmdData) {
		const time = Date.now();

		// Await ping messages from bot
		const filter = (m) =>  {
			if(m.author.id != process.env.BOT_ID || typeof m.embeds != 'object' || !m.embeds.length) return false;
			return matchPrePingMessage(m.embeds[0], time);
		};
		
		
		cmdData.channel.awaitMessages(filter, { max: 1, time: 10000, errors: ['time'] })
			.then(([ [id, message] ]) => catchPrePingMessage(cmdData, time, message) )
			.catch((e) => {
				if(e && e.size != undefined) console.error(`Couldn't catch the ping after 10s.`.red);
				else console.error(`Error with /ping : `.red, e);
			});

		//Temps perdu : Date.now() - cmdData.receivedAt = 0 msec
		return makePrePingMessage(time, cmdData.author.id)
	},
};


/**
 * @param {number} time - Time of the ping
 * @param {string} author_id
 */
function makePrePingMessage(time, author_id) {
	return new EmbedMaker('Ping', `@Jig0ll:${time}\nfor:${author_id}`);
}

/**
 * @param {Object} embed
 * @param {number} time - Time of the ping
 * @returns {boolean}
 */
function matchPrePingMessage(embed, time) {
	return embed.title == 'Ping' && embed.description.match(new RegExp(`@Jig0ll:${time}\nfor:\\\d+`));
}
if ( !matchPrePingMessage(makePrePingMessage(0, 0).content, 0) ) console.error(`Ping format error: can't match a simple message`.red);



/**
 * @param {ReceivedCommand} cmdData - Original message
 * @param {number} timePrePingSentLocal - Time of the ping
 * @param {Message} message - Message of the bot
 */
function catchPrePingMessage(cmdData, timePrePingSentLocal, message) {

	/** Steps:
	 * ReceivedMessage (Discord)
	 * PrePingSent (bot)
	 * PrePingServ (Discord)
	 * PrePingCatched (bot)
	 */
	const local = {
		prePingSent: timePrePingSentLocal,// temps d'envoie PrePing d'après le bot (et de reception du premier message)
		prePingCatched: Date.now(),// temps de reception de PrePing
	}
	const server = {
		command: cmdData.commandSource.createdTimestamp || new Snowflake(cmdData.commandSource.id).timestamp,// temps du premier message d'après le serveur
		prePingServ: message.createdTimestamp,// id de PrePing
	}

	server.prePingSent = (server.command + server.prePingServ) / 2; // supposition : temps d'envoie vue par le serv
	local.prePingServ = (local.prePingSent + local.prePingCatched) / 2; // supposition : temps lors de la reception de PrePing par Discord vu par le bot

	//règle : on n'a pas le droit de mélanger local et server
	const pingDiscord = server.prePingServ - server.command;// le temps de réponse au message vue (depuis Discord)
	const pingLocal = local.prePingCatched - local.prePingSent;// ping du message PrePing
	const pingBot = (pingDiscord + pingLocal) / 2;

	const pingSinceMessageCreated = pingDiscord + pingBot/2; // temps de réponse total
	
	const decalagePrePingSent = server.prePingSent - local.prePingSent;// décalage premier message
	const decalagePrePingServ = server.prePingServ - local.prePingServ;// décalage PrePing
	const decalage = (decalagePrePingSent + decalagePrePingServ) / 2


	message.edit(new EmbedMaker('Ping',
		`Pong en ${Math.round(pingSinceMessageCreated)} msec
		Ping du bot : ${Math.round(pingBot)} msec
		Décalage avec le serveur : ${Math.round(decalage)} msec`).content);

	console.log(`Ping du bot : ${pingBot} msec`);
	//Durée du calcul : Date.now() - local.prePingCatched ~= 1 msec
}