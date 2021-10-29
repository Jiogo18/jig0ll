import { User } from 'discord.js';
import { ReceivedCommand } from '../../bot/command/received.js';

var useInMinute = [];
var lastReset = [];

export default {
	name: 'someone',
	description: "Appel aléatoirement un membre du channel avec les memes du @someone d'avril 2018",

	security: {
		place: 'public',
		interaction: false,
		hidden: true,
	},

	/**
	 * Executed when there is no valid option
	 * @param {ReceivedCommand} cmdData
	 */
	async execute(cmdData) {
		const id = cmdData.guild_id;

		/**
		 * @type {User}
		 */
		var randomUser;

		const channel = await cmdData.context.getChannel();
		if (channel.members) {
			// https://discordjs.guide/popular-topics/intents.html
			// Seul les membres qui ont parlé il y a peu de temps seront choisis
			// C'est pas plus mal, ça évite de ping d'autres personnes
			randomUser = channel.members.random();
		} else {
			randomUser = getRandomInt(2) ? channel.recipient : cmdData.bot.user;
		}

		// Sécurité pour pas spammer la commande
		if (lastReset[id] == undefined || useInMinute[id] == undefined) {
			lastReset[id] = 0;
		}
		if (lastReset[id] + 60000 < Date.now()) {
			lastReset[id] = Date.now();
			useInMinute[id] = 0;
		}
		if (useInMinute[id] >= 10) {
			//s'il y a plus de 10 appels par minute on envoie l'auteur
			randomUser = cmdData.author;
			if (process.env.WIPOnly) console.warn(`Anonyme : spam de ${cmdData.author.toString()} (${cmdData.author.username})`);
		}
		useInMinute[id]++;

		await cmdData.reply(`@someone ${getRandomMeme()} ${randomUser?.toString()}`);
	},
};

//prettier-ignore
const meme = [
	'（✿ ͡◕ ᴗ◕)つ━━✫・o。',
	'༼ つ ◕_◕ ༽つ',
	'(╯°□°）╯︵ ┻━┻',
	'ヽ༼ ಠ益ಠ ༽ﾉ',
	'(∩ ͡° ͜ʖ ͡°)⊃━✿✿✿✿✿✿',
	'ಠ_ಠ',
	'¯\\_(ツ)_/¯',
	'(◕‿◕✿)',
	'¯(°_o)/¯',
	'(⁄ ⁄•⁄ω⁄•⁄ ⁄)'
];
/**
 * @param {number} max
 * @returns {number} An integer between `0` and `max` excluded
 */
const getRandomInt = max => Math.floor(Math.random() * Math.floor(max));

export const getRandomMeme = _ => meme[getRandomInt(meme.length)];
