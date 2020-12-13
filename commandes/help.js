module.exports = class CmdHelp
{
	static isAction(msg) {
		return msg.length>0 && /help/i.test(msg[0])
	}
	static action (message, msg) {
		if(msg.length >= 2)
		{
			var retour = withArgument(msg[1]);
			if(retour != "")
			{
				return {embed:{
					color: 3447003,
					title: "Help : "+msg[1],
					description: retour,
					author: true
				}};
			}

		}
		return {embed:{
			color:3447003,
			title:"Help",
			description: "Disponible uniquement dans les channels avec '@Jig0ll' dans le topic'"+
				"\n"+CmdHelp.getHelp()+
				"\n"+require("./ping.js").getHelp()+
				"\n"+require("./info.js").getHelp()+
				"\n"+require("./test.js").getHelp()+
				"\n"+require("./random.js").getHelp()+
				"\n"+require("./meteo.js").getHelp()+
				"\n"+require("./plenitude.js").getHelp(),
			author: true
		}};
	}
	static getHelp(complet) {
		if(complet)
			return "Donne la liste des commandes disponnibles"+
				"\n\u200b \u200b help (commande) pour détailler la commande";
		else
			return "help (commande): affiche cette liste ou détaille la commande";
	}
}

function withArgument(argument)
{
	const CmdHelp = module.exports;
	const CmdPing = require("./ping.js");
	const CmdInfo = require("./info.js");
	const CmdTest = require("./test.js");
	const CmdRandom = require("./random.js");
	const CmdMeteo = require("./meteo.js");
	const CmdPlenitude = require("./plenitude.js");

	if(CmdHelp.isAction([argument]))
		return CmdHelp.getHelp(argument);
	else if(CmdPing.isAction([argument]))
		return CmdPing.getHelp(argument);
	else if(CmdInfo.isAction([argument]))
		return CmdInfo.getHelp(argument);
	else if(CmdTest.isAction([argument]))
		return CmdTest.getHelp(argument);
	else if(CmdRandom.isAction([argument]))
		return CmdRandom.getHelp(argument);
	else if(CmdMeteo.isAction([argument]))
		return CmdMeteo.getHelp(argument);
	else if(CmdPlenitude.isAction([argument]))
		return CmdPlenitude.getHelp(argument);
	else
		return "";
}