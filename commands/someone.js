const MessageMaker = require('../lib/messageMaker.js');

var useInMinute = [];
var lastReset = [];

module.exports = {

	name: 'someone',
	description: "Appel aléatoirement un membre du channel avec les memes du @someone d'avril 2018",
	interaction: false,
	hidden: true,
	public: true,

	execute(cmdData) {
		const id = cmdData.guild_id;
		
		const members = cmdData.channel.members.array();//uniquement les membres actifs (qui ont postés un message)
		//TODO: https://discord.com/developers/docs/resources/guild#list-guild-members
		const randomNb = getRandomInt(members.length);
		var randomUser = members[randomNb];

		if(lastReset[id]==undefined || useInMinute[id]==undefined) { lastReset[id] = 0; }
		if(lastReset[id] + 60000 < Date.now()) {
			lastReset[id] = Date.now();
			useInMinute[id] = 0;
		}
		if(useInMinute[id] >= 10) {//s'il y a plus de 10 appels par minute on envoit l'auteur
			randomUser = cmdData.author;
		}
		useInMinute[id]++;
		
		return new MessageMaker.Message(`@someone ${getRandomMeme()} ${randomUser}`, 3);//don't reply
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
function getRandomInt(max) { return Math.floor(Math.random() * Math.floor(max)); }
function getRandomMeme() { return meme[getRandomInt(meme.length)]; }