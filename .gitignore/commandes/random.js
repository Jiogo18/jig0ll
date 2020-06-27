module.exports = class CmdRandom
{
	static isAction(msg) {
		return msg.length>0 && (msg[0]=="someone" || msg[0]=="anonyme");
	}
	static action(message,msg)
	{
		switch (msg[0].toLowerCase())
		{
			case "someone":
				var randomNb=getRandomInt(message.channel.members.array().length);
				var randomUser=message.channel.members.array()[randomNb];
				return "@someone "+getRandomMeme()+" <@!"+randomUser+">";

			case "anonyme":
				message.delete();
				var message2=message.content.substring(msg[0].length+1);//retire le premier arg
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
	static getHelp(complet) {
		switch(complet) {
			default:
				return "someone : appel un membre aléatoire du channel"+
					"\nanonyme <message> : Faire une annonce anonymement";
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