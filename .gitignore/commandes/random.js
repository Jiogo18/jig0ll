module.exports = class CmdRandom
{
	static action (message, msg)
	{
		switch (msg[0].toLowerCase())
		{
			case "ping":
				message.channel.send('pong, '+message.author+" !");
				break;

			case "id":
				message.channel.send("ID de "+message.author+" : "+message.author.id);
				break;
		}
	}
}
