module.exports = class CmdHelp
{
	static action (bot, message, msg)
	{
		const CmdHelp = require("./help.js");
		const CmdPing = require("./ping.js");
		const CmdInfo = require("./info.js");
		const CmdTest = require("./test.js");
		const CmdRandom = require("./random.js");
		//var embed = new Discord.RichEmbed();
		var reponse=[];
		switch(msg[0].toLowerCase())
		{
			case "help":
				reponse.push(CmdHelp.action(message, msg));
				break;

			case "ping":
			case "pingbot":
			case "timeserv":
				reponse.push(CmdPing.action(message, msg, bot, Date.now()));
				break;

			case "info":
				reponse.push(CmdInfo.action(message, msg));
				break;

			case "test":
				reponse.push(CmdTest.action(message, msg));
				break;

			default:
				reponse.push(CmdRandom.action(message, msg));
				break;
		}
		if(reponse.length == 0)
		{
			console.log("erreur avec la commande : " + message.id);
		}
		else
		{
			for(var i=0; i<reponse.length; i++)//parcours la réponse
			{
				if(!reponse[i])//undefined
					continue;
				if(reponse[i].embed)//si embed existe
				{
					var author = reponse[i].embed.author;
					reponse[i].embed.author = {};
					if(typeof(author) == "number" || typeof(author) == "boolean")//commande spéciale
					{
						switch(author)
						{
							case true://l'auteur
							case 0:
								author = message.author;
								break;
							case 1://le bot
								author = bot.user;
								break;
						}
					}
					switch(typeof(author))
					{
						case "string":
							reponse[i].embed.author.name = author;
							break;
						case "object"://author doit etre un User
							if(author.user)//ou si author est un Client (ou autre chose contenant .user)
								author = author.user//donne un ClientUser, qui est la meme chose qu'un User
							if(author.username)//si on a la fonction username
								reponse[i].embed.author.name = author.username
							if(author.avatarURL)
								reponse[i].embed.author.icon_url = author.avatarURL
							break;

						default:
							console.log("type for author unknow : "+typeof(author) + " (commande.js)");
							break;

					}
					if(reponse[i].embed.author == {})
						reponse[i].embed.author = undefined;
				}
				//https://www.colorhexa.com/3498db => 3447003 (bleu)
				//rouge : #cc0000 = 13369344

				message.channel.send(reponse[i]);
			}
		}
	}
}
//v1 : [(int)color, (bool)author, (str)title, (str)reponse]
//v2 : [(str)reponse, (bool)embed, (str)title, (int)color, (bool/str)author]