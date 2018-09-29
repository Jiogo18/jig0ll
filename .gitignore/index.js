const Discord = require('discord.js')
const bot = new Discord.Client()
const channelBot = "<#386086319035514890>"
const CmdHelp = require("./commandes/help.js")
const CmdRandom = require("./commandes/random.js")


bot.on("ready", function ()
{
	bot.user.setActivity("!help || @Jig0ll help", {type: 'WATCHING'})
	.then(presence => console.log(`Activity of ` +bot.user.username+ ` set to "${presence.game ? presence.game.name : 'none'}"`))
  .catch(console.error);
})



bot.on('message', function (message)
{
	if(message.channel != channelBot)//si c pas ds le channel bot
		return
	if(message.author === bot.user)//si c un msg du bot lui meme, pas intérésent
		return
	
	if(message.content.startsWith("!") || message.content.startsWith(bot.user))
	{
		let msg=""//pas besoin après, on pourra le suppr
		if(message.content.startsWith("!"))
			msg = message.content.substring(1).split(" ")
		if(message.content.startsWith(bot.user))//a une taille de 18+<@>
			msg = message.content.substring(22).split(" ")//un espace inutile


		console.log('commande par ' + message.author.username + ' : ' + commande + " . " + argument)

		let delMsg=true
		switch (msg[0].toLowerCase())
		{
			case "help":
				CmdHelp.action(channelBot, message, msg[1])
				break

			case "ping":
			case "id":
				CmdRandom.action(message, msg)
				break

			default:
				delMsg=false
		}
		if(delMsg)
			message.delete()//si c une commande utile
	}

})




bot.login('NDk0NTg3ODY1Nzc1MzQxNTc4.DpDyvQ.-MAS3m0njV6fqW4ngFsg40gHTLM')
