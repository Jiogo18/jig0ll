module.exports = class CmdHelp
{
	static action (channelBot, message, args)
	{
		args.shift()
		if(args[1] == "")
		{
			message.channel.send(	"------------------help------------------\n"+
									"  Disponible uniquement dans le channel "+channelBot+"\n"+
									"  ping : retourne pong\n"+
									"  id : retourne votre ID Discord\n"+
									//"  \n"+
									//"  \n"+
									//"  \n"+
									//"  \n"+
									//"  \n"+
									//"  \n"+
									"----------------------------------------")
		}
		else
		{

		}
	}
}
