module.exports = class CmdTest
{
	static isAction(msg) {
		return msg.length>0 && msg[0].toLowerCase()=="test";
	}
	static action(message,msg)
	{
		if(msg.length == 1)
		{
			return {embed:{
				color:3447003,
				title:"test",
				description: this.getHelp(true),
				author: true
			}};
		}
		if(message.author.id!=175985476165959681)
			return {embed:{
				color:14372916,//red
				title:"test",
				description: "Vous n'avez pas accès à ces commandes",
				author: true
			}};
		switch (msg[1].toLowerCase())
		{

			case "timestamp":
				if(msg.length == 2)
				{
					return {embed:{
						color:3447003,
						title:"Timestamp",
						description: "Time stamp du channel "+message.channel+" : "+message.channel.createdTimestamp+
							"\n("+message.channel.createdAt+")",
						author: true
					}};
				}
				else
				{
					var chl = message.guild.channels;//les channels de la guild
					chl = chl.cache.find(function(element) {return msg[2]==element});//recherche le channel demande
					//console.log("channel demande:"+msg[2],chl);
					if(chl) {
						return {embed:{
							color:3447003,
							title:"Timestamp",
							description: "Time stamp du channel "+msg[2]+" : "+chl.createdTimestamp+
								"\n(" + chl.createdAt + ")",
							author: true
						}};
					}
					else
						return {embed:{
							color:14372916,
							title:"Timestamp",
							description: "Channel non trouvé",
							author: true
						}};
				}
				break;


			case "snowflake":
				var id = 0;
				if(!isNaN(parseInt(msg[2])))
				{
					id = parseInt(msg[2]);
				}
				else if(msg[2].startsWith("<") && msg[2].endsWith(">"))
				{
					id = parseInt(msg[2].substring(2, msg[2].length-1))
				}
				if(id == 0)
				{
					return {embed:{
						color:13369344,
						title:"Snowflake",
						description: "Aucune cible trouvée"+
								"\n(https://discord.js.org/#/docs/main/stable/typedef/Snowflake)",
						author: true
					}};
				}
				var snowflake = id.toString(2);
				while(snowflake.length < 64)
					snowflake = "0"+snowflake;
				var time = snowflake.substring(64-64, 64-22);
				var worker = snowflake.substring(64-22, 64-17);
				var pid = snowflake.substring(64-17, 64-12);
				var increment = snowflake.substring(64-12, 64);
				var timeSince2015 = parseInt(time, 2);//msec
				const timeAt2015 = 1420070400*1000;//msec
				var timeSinceEpoch = timeAt2015 + timeSince2015;//msec
				var date = new Date(timeSinceEpoch);

				return {embed:{
						color:3447003,
						title:"Snowflake",
						/*description: "64"+generateSpace(100)+"22"+generateSpace(14)+"17"+generateSpace(14)+"12"+generateSpace(28)+"0"+
								"\n \u00a0"+time+" \u00a0 "+worker+" \u00a0 "+pid+" \u00a0 "+increment+
								"\n"+generateSpace(12)+"number of ms since Discord epoch"+generateSpace(14)+"worker"+generateSpace(6)+"pid"+generateSpace(12)+"increment"+*/
						description: "time : "+time+
								"\nworker : "+worker+
								"\npid : "+pid+
								"\nincrement : "+increment+
								"\n(https://discord.js.org/#/docs/main/stable/typedef/Snowflake)"+
								"\nLa date correspond à : " + date,
						author: true
					}};
					/*
					worker :
					user: 00000
					msg: 00010 / 00001
					serveur: 00001
					channel: 00000

					*/
		}

	}
	static getHelp(complet) {
		if(complet)
			return "test <test>:"+
				"\ntimestamp (channel): renvoie la date de creation du channel"+
				"\nsnowflake (snowflake): renvoie les informations du snowflake";
		else
			return "test <test> : commandes de tests (limitées)";
	}
}

function generateSpace(nb)
{
	var space = "";
	while(nb > 0)
	{
		space += ((space.length % 2 == 0) ? " " : "\u00a0");
		nb--;
	}
	return space;
}
