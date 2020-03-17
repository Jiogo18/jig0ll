
module.exports = class CmdRandom
{
	static action (message, msg)
	{
		const Modo = require("../moderation.js")
		switch (msg[0].toLowerCase())
		{
			case "someone":
				var randomNb=getRandomInt(message.channel.members.array().length);
				var randomUser=message.channel.members.array()[randomNb];
				message.delete();
				return "@someone "+getRandomMeme()+" "+randomUser;

			case "anonyme":
				message.delete();
				var message2=message.content.substring(msg[0].length+1);//retire le premier arg
				message2 = Modo.corrige(message2);
				return {embed:{
					color:3447003,
					description: message2,
					author: "Anonyme"
				}};
			default://dernier endroit ou chercher avec commande.js
				console.log("commande inconnue : " + message.id);
				return;
		}
	}

}

function getRandomInt(max) {//min : 0, max : max-1
  return Math.floor(Math.random() * Math.floor(max));
}


function getRandomMeme() {
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
	return meme[getRandomInt(meme.length)];
}