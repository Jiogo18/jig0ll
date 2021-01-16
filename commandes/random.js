module.exports = class CmdRandom
{
	static isAction(msg) {
		return false;
	}
	static action(message,msg)
	{
		//dernier endroit ou chercher avec commande.js
		console.log("commande inconnue : " + message.id);
	}
	static getHelp(complet) {
		switch(complet) {
			default:
				return "pas de commande dans random.js";
		}
		
	}
}
