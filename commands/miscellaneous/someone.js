import { MessageMaker } from '../../lib/messageMaker.js';

var useInMinute = [];
var lastReset = [];

export default {

	name: 'someone',
	description: "Appel aléatoirement un membre du channel avec les memes du @someone d'avril 2018",
	interaction: false,

	security: {
		place: 'public',
		hidden: true,
	},

	/**
	 * Executed when there is no valid option
	 * @param {ReceivedCommand} cmdData
	 */
	execute(cmdData) {
		const id = cmdData.guild_id;
		
		const members = cmdData.channel.members;//uniquement les membres actifs (qui ont postés un message)
		var randomUser = members.random();

		if(lastReset[id]==undefined || useInMinute[id]==undefined) { lastReset[id] = 0; }
		if(lastReset[id] + 60000 < Date.now()) {
			lastReset[id] = Date.now();
			useInMinute[id] = 0;
		}
		if(useInMinute[id] >= 10) {//s'il y a plus de 10 appels par minute on envoit l'auteur
			randomUser = cmdData.author;
		}
		useInMinute[id]++;
		
		return new MessageMaker(`@someone ${getRandomMeme()} ${randomUser}`, 3);//don't reply
	}
}


const meme = [
	"（✿ ͡◕ ᴗ◕)つ━━✫・o。",
	"༼ つ ◕_◕ ༽つ",
	"(╯°□°）╯︵ ┻━┻",
	"ヽ༼ ಠ益ಠ ༽ﾉ",
	"(∩ ͡° ͜ʖ ͡°)⊃━✿✿✿✿✿✿",
	"ಠ_ಠ",
	"¯\\_(ツ)_/¯",
	"(◕‿◕✿)",
	"¯(°_o)/¯",
	"(⁄ ⁄•⁄ω⁄•⁄ ⁄)"
];
/**
 * @param {number} max 
 * @returns {number} An integer between `0` and `max` excluded
 */
function getRandomInt(max) { return Math.floor(Math.random() * Math.floor(max)); }
export function getRandomMeme() { return meme[getRandomInt(meme.length)]; }