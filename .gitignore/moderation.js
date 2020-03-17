module.exports = class Modo
{
	static action (message)
	{
		if(message.content.includes("@everyone"))
		{
			console.log(message.author + " a mentionner @everyone dans " + message.id + ", renvoie du message avec @here");
			message.channel.send(message.author + " a mentionné everyone, je me charge de lui montrer l'exemple !\n"+this.corrige(message.content));
			message.delete();
		}
	}

	static corrige(message)
	{
		message = message.replace("@everyone", "@here");
		return message;
	}
}