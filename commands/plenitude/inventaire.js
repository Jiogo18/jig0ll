import { EmbedMaker } from '../../lib/messageMaker.js';
import { ReceivedCommand } from '../../bot/command/received.js';
import { DiscordChannelDatabase, MessageData } from '../../lib/discordDatabase.js';
import DiscordBot from '../../bot/bot.js';
import { User } from 'discord.js';
import colorLib from '../../lib/color.js';

/**
 * @type {DiscordChannelDatabase}
 */
var channelDatabase;
/**
 * @type {DiscordBot}
 */
var bot;
var channel_tries = 0;
async function setChannelDatabase() {
	const channel = await bot.channels.fetch('850137517344686122');
	if (!channel) {
		if (channel_tries++ >= 10) {
			throw 'No channel for inventaire';
		}
		setTimeout(setChannelDatabase, channel_tries * 500);
		return;
	}
	channelDatabase = new DiscordChannelDatabase(channel);
}

/**
 * @param {string} id_prop
 * @param {User} author
 */
function getPropId(id_prop, author) {
	if (!id_prop || id_prop == '*' || id_prop == '$' || id_prop == '') {
		return author.toString();
	}
	const snowflakeMatch = id_prop.match(/<@!(\d+)>/);
	if (snowflakeMatch) {
		return `<@${snowflakeMatch[1]}>`;
	}
	const snowflake2Match = id_prop.match(/<@&(\d+)>/);
	if (snowflake2Match) throw `Ce type de tag n'est pas valide : \`<@&${snowflake2Match[1]}>\`.\nEvitez de copier/coller les tags`;
	if (id_prop.includes(' ')) throw `Les espaces ne sont pas autorisés dans le nom de bâtiment`;
	return id_prop;
}

/**
 * @param {Function} executeFunc
 */
function createExecuteLink(executeFunc) {
	return (cmdData, levelOptions) => executeFunc(cmdData, getPropId(levelOptions.shift()?.value, cmdData.author), ...levelOptions.map(i => i?.value));
}

const invo = {
	id_source: {
		name: 'inv_source',
		description: "Inventaire source (* pour l'inventaire perso)",
		type: 3, // string
		required: true,
	},
	id_target: {
		name: 'inv',
		description: "Inventaire cible (* pour l'inventaire perso)",
		type: 3, // string
		required: true,
	},
	item_name: {
		name: 'name',
		description: "Nom de l'item",
		type: 3,
		required: true,
	},
	item_count: {
		name: 'count',
		description: "Nombre d'items",
		type: 4,
		required: false,
	},
};

export default {
	name: 'inventaire',
	description: 'Un inventaire',
	alts: ['inv'],

	interaction: true,
	security: {
		place: 'public',
	},

	options: [
		{
			name: 'reload',
			description: 'Recharger tous les inventaires',
			type: 1,
			execute: executeReload,
		},
		{
			name: 'create',
			description: 'Créer un bâtiment',
			type: 1,
			options: [
				{
					name: 'name',
					description: 'Nom du nouveau bâtiment',
					type: 3,
					required: true,
				},
			],
			executeAttribute: (cmdData, levelOptions) => executeCreateBatiment(cmdData, levelOptions[0]?.value),
		},
		{
			name: 'open',
			description: "Ouvrir l'inventaire",
			type: 1,
			options: [{ ...invo.id_target, required: false }],
			execute: cmdData => executeOpen(cmdData, cmdData.author.toString()),
			executeAttribute: createExecuteLink(executeOpen),
		},
		{
			name: 'give',
			description: 'Ajouter un item',
			type: 1,
			options: [invo.id_target, invo.item_name, invo.item_count],
			executeAttribute: createExecuteLink(executeGive),
		},
		{
			name: 'remove',
			description: 'Retirer un item',
			type: 1,
			options: [invo.id_target, invo.item_name, invo.item_count],
			executeAttribute: createExecuteLink(executeRemove),
		},
		{
			name: 'move',
			description: "Déplacer un item d'un inventaire à un autre",
			type: 1,
			options: [invo.id_source, invo.id_target, invo.item_name, invo.item_count],
			executeAttribute: (cmdData, levelOptions) =>
				executeMove(
					cmdData,
					getPropId(levelOptions[0]?.value, cmdData.author),
					getPropId(levelOptions[1]?.value, cmdData.author),
					levelOptions[2]?.value,
					levelOptions[3]?.value
				),
		},
		{
			name: 'description',
			description: "Changer la description de l'inventaire",
			type: 1,
			options: [
				invo.id_target,
				{
					name: 'description',
					description: 'La description',
					type: 3,
					required: true,
				},
			],
			executeAttribute: (cmdData, levelOptions) =>
				executeDescription(cmdData, getPropId(levelOptions[0]?.value, cmdData.author), levelOptions[1]?.value),
		},
		{
			name: 'couleur',
			description: `'Changer la couleur de l'inventaire`,
			type: 1,
			options: [invo.id_target, colorLib.commandOptions],
			executeAttribute: (cmdData, levelOptions) => executeCouleur(cmdData, getPropId(levelOptions[0]?.value, cmdData.author), levelOptions[1]?.value),
		},
	],

	/**
	 * @param {DiscordBot} bot
	 */
	setBot(b) {
		bot = b;
		setTimeout(setChannelDatabase, 200);
	},
};

class Item {
	/**
	 * @type {string}
	 */
	name;
	/**
	 * @type {number}
	 */
	count;
	/**
	 * @param {string} name
	 * @param {number} count
	 */
	constructor(name, count = 0) {
		this.name = name;
		this.count = count;
	}

	/**
	 * Copy this item
	 */
	copy() {
		return new Item(this.name, this.count);
	}

	/**
	 * @param {Item} item
	 */
	isEqual(item) {
		return this.name == item.name;
	}

	toSmallText() {
		return `${this.count}x ${this.name}`;
	}
}

/**
 * Make an embed message
 * @param {string} description The content
 * @param {number} color
 */
function makeMessage(description, color) {
	return new EmbedMaker('Inventaire', description, { color });
}
/**
 * Make an embed message with a red color
 * @param {string} description The content
 */
function makeError(description) {
	return new EmbedMaker('Inventaire', description, { color: 'red' });
}

const messages = {
	/**
	 * @param {Inventory} inv
	 */
	cantOpen: inv => makeError(`Cet inventaire appartient à ${inv?.proprietaire} et vous ne pouvez pas voir son contenu`),
	/**
	 * @param {Inventory} inv
	 */
	cantEdit: inv => makeError(`Cet inventaire appartient à ${inv?.proprietaire} et vous ne pouvez pas modifier son contenu`),
	/**
	 * @param {Inventory} inv
	 */
	doesntExist: inv => makeError(`Cet inventaire n'existe pas.\nPour créer un inventaire de bâtiment utilisez \`create <nom_batiment>\``),
	/**
	 * @param {string} name
	 */
	badName: name => makeError(`Nom invalide : ${name}`),
	/**
	 * @param {Item} item
	 * @param {string} inv_id
	 */
	itemInfo: (item, inv_id) => makeMessage(`Il y a désormais ${item.toSmallText()} dans l'inventaire de ${inv_id}`),
	/**
	 * @param {Item} item
	 * @param {string} inv_id
	 */
	itemSmartInfo: (item, inv_id) => {
		if (!item?.count) {
			return `Il n'y a plus de ${item?.name} dans l'inventaire de ${inv_id}`;
		}
		return `Il y a désormais ${item.toSmallText()} dans l'inventaire de ${inv_id}`;
	},
	/**
	 * @param {Item} item
	 * @param {string} inv_id
	 */
	noItem: (item, inv_id) => makeError(`Il n'y a pas ${item.toSmallText()} dans l'inventaire de ${inv_id}`),
	/**
	 * @param {Item} item
	 * @param {string} inv_id
	 */
	cantAddItem: (item, inv_id) => makeError(`Vous ne pouvez pas ajouter ${item.toSmallText()} dans l'inventaire de ${inv_id}`),
};

////////////////////////// inventory_source tools //////////////////////////

class Inventory {
	/**
	 * The name/id of the inventory
	 * @type {string}
	 */
	noms;
	/**
	 * The owner of the inventory (the first user)
	 * @type {string}
	 */
	proprietaire;
	/**
	 * Items in the inventory
	 * @type {Item[]}
	 */
	items = [];
	/**
	 * The MessageData where the inventory is stored
	 * @type {MessageData}
	 */
	messageData;
	/**
	 * Description of the inventory
	 * @type {string}
	 */
	description;

	get color() {
		return colorLib.DiscordColorToHex(this.messageData?.color);
	}
	set color(color) {
		if (typeof color != 'number') {
			color = colorLib.hexToDiscordColor(color);
		}
		this.messageData.color = color;
	}

	/**
	 * @param {MessageData} messageData
	 */
	constructor(messageData) {
		this.messageData = messageData;
		this.noms = messageData.id;
		this.proprietaire = messageData.proprietaire || messageData.id;
		/**
		 * @type {Item[]}
		 */
		const inv = messageData.data.inventaire;
		this.items = inv?.map(item => new Item(item.name, item.count)) || [];
		this.description = messageData.data.description;
	}

	/**
	 * Save the inventory
	 */
	save() {
		this.messageData.data.id = this.noms;
		if (this.proprietaire != this.noms) {
			this.messageData.data.proprietaire = this.proprietaire;
		} else {
			delete this.messageData.data.proprietaire;
		}
		if (this.description) {
			this.messageData.data.description = this.description;
		} else {
			delete this.messageData.data.description;
		}
		this.messageData.data.inventaire = this.items;

		return this.messageData.save();
	}

	/**
	 * Does the inventory exist
	 */
	get exist() {
		return this.messageData.exist;
	}

	/**
	 * Does the inventory belong to a user or a building
	 */
	isPlayerInventory() {
		return !!this.noms.match(/<@.+>/);
	}

	/**
	 * Is the Owner / propriétaire
	 * @param {User} user
	 */
	isProp(user) {
		if (!user) return false;
		if (this.noms === user.toString()) return true;
		if (this.proprietaire === user.toString()) return true;
		return false;
	}

	/**
	 * @param {User} user
	 */
	canOpen(user) {
		return true;
	}

	/**
	 * @param {User} user
	 */
	canEdit(user) {
		return true; // prop is disabled
		return this.isProp(user);
	}

	/**
	 * Get an item with the same name
	 * @param {string} item_name Name of the item in this inventory
	 */
	getItemByName(item_name) {
		return this.items.find(item => item.name == item_name);
	}
	/**
	 * Get the exact item in this inventory
	 * @param {Item} item Item witch match with an item of this inventory
	 */
	getItem(item) {
		return this.items.find(i => i.isEqual(item));
	}
	/**
	 * Does this inventory contain this item
	 * @param {Item} item Item witch match with an item of this inventory
	 */
	hasItem(item) {
		return !!this.getItem(item);
	}
	/**
	 * Removed an item from the items list
	 * @param {Item} item Item from this inventory
	 */
	deleteItem(item) {
		const i = this.items.indexOf(item);
		return this.items.splice(i, 1);
	}
	/**
	 * Removed an item from the items list if count == 0
	 * @param {Item} item Item from this inventory we have modified
	 */
	deleteItemIfNoLongerExists(item) {
		if (item.count == 0) {
			this.deleteItem(item);
		} else if (item.count < 0) {
			throw `Item a un count négatif : ${item}`;
		}
	}

	/**
	 * @param {Item} item
	 */
	canAddItem(item) {
		const item_here = this.getItem(item);
		const count = (item_here?.count || 0) + item.count;
		if (count < 0) return false; // si l'item n'existe pas on peut le rajouter
		return true;
	}

	/**
	 * @param {Item} item
	 */
	canRemoveItem(item) {
		const item_here = this.getItem(item);
		const count = (item_here?.count || 0) - item.count;
		if (count < 0) return false;
		return true;
	}

	/**
	 * Add an item to this inventory
	 * @param {Item} item Item(s) to add to this inventory
	 */
	addItem(item) {
		if (!this.canAddItem(item)) throw "Can't add item";

		if (!item?.constructor?.name != 'Item') {
			item = new Item(item?.name, item?.count);
		}

		var item_here = this.getItem(item);
		if (item_here) {
			item_here.count += item.count;
		} else {
			item_here = item.copy();
			this.items.push(item);
		}

		this.deleteItemIfNoLongerExists(item_here);
		return item_here;
	}
	/**
	 * Remove an item to this inventory
	 * @param {Item} item Item(s) to remove to this inventory
	 */
	removeItem(item) {
		if (!this.canRemoveItem(item)) throw "Can't remove item";
		const item_copy = item.copy();
		item_copy.count = -item_copy.count;
		return this.addItem(item_copy);
	}
}

/**
 * Open / Edit the inventory_source
 * @param {string} id
 */
async function getInventory(id) {
	return new Inventory(await channelDatabase.getMessageData(id));
}

////////////////////////// execute commands //////////////////////////

/**
 * @param {ReceivedCommand} cmdData
 */
async function executeReload(cmdData) {
	if (!channelDatabase) {
		bot = cmdData.bot;
		setChannelDatabase();
	} else {
		channelDatabase.list.reset();
	}
	return makeMessage('Rechargement terminé !');
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} name_batiment
 */
async function executeCreateBatiment(cmdData, name_batiment) {
	if (!name_batiment) {
		return makeError(`Nom invalide du bâtiment : ${name_batiment}`);
	}
	const name = '$' + name_batiment;

	const inv = await getInventory(name);
	if (!inv) {
		process.consoleLogger.commandError(cmdData.commandLine, `Impossible de créer le bâtiment ${name}`);
		return makeError('Impossible de créer le bâtiment, réessayez');
	}
	if (inv.exist) return makeError(`Ce bâtiment existe déjà : ${name}`);

	inv.proprietaire = cmdData.author.toString();
	await inv.save();
	return makeMessage(`Un bâtiment a été créé pour ${inv.proprietaire} : ${name}\nPrécisez "${name}" pour ouvrir son inventaire`, inv.color);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} id_prop
 */
async function executeOpen(cmdData, id_prop) {
	const inv = await getInventory(id_prop);

	if (!inv.canOpen(cmdData.author)) return messages.cantOpen(inv);

	const inventory_source = inv.items;

	var retour = `**Inventaire de ${id_prop}**\n`;
	if (inv.description) {
		retour += inv.description + '\n';
	}
	retour += '\n';
	if (!inventory_source.length) {
		retour += 'Vide';
	} else {
		retour += inventory_source.map(i => i.toSmallText()).join('\n');
	}

	return new EmbedMaker('', retour, { color: inv.color });
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} inv_id
 * @param {string} item_name
 * @param {string} item_count
 */
async function executeGive(cmdData, inv_id, item_name, item_count) {
	item_count = parseInt(item_count) || 1;
	if (item_count < 0) return executeRemove(cmdData, inv_id, item_name, -item_count);

	const inv = await getInventory(inv_id);

	if (!inv.isPlayerInventory() && !inv.exist) return messages.doesntExist(inv); // bâtiment et n'existe pas
	if (!inv.canEdit(cmdData.author)) return messages.cantEdit(inv);
	if (!item_name) return messages.badName(item_name);

	const item = new Item(item_name, item_count);

	if (!inv.canAddItem(item)) return messages.cantAddItem(item, inv_id);
	const item_inv = inv.addItem(item);

	await inv.save();
	return messages.itemInfo(item_inv, inv_id);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} id
 * @param {string} item_name
 * @param {string} item_count
 */
async function executeRemove(cmdData, id, item_name, item_count) {
	item_count = parseInt(item_count) || 1;
	if (item_count < 0) return executeGive(cmdData, id, item_name, -item_count);

	const inv = await getInventory(id, true);

	if (!inv.isPlayerInventory() && !inv.exist) return messages.doesntExist(inv); // bâtiment et n'existe pas
	if (!inv.canEdit(cmdData.author)) return messages.cantEdit(inv);
	if (!item_name) return messages.badName(item_name);

	const item = new Item(item_name, item_count);

	if (!inv.canRemoveItem(item)) return messages.noItem(item, id);
	const item_inv = inv.removeItem(item);

	await inv.save();
	return messages.itemInfo(item_inv, id);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} id_source
 * @param {string} id_target
 * @param {string} item_name
 * @param {string} item_count
 */
async function executeMove(cmdData, id_source, id_target, item_name, item_count) {
	item_count = parseInt(item_count) || 1;
	if (item_count < 0) return executeMove(cmdData, id_target, id_source, item_name, -item_count);

	const inv_source = await getInventory(id_source, false);
	const inv_target = await getInventory(id_target, false);

	if (!inv_source.isPlayerInventory() && !inv_source.exist) return messages.doesntExist(inv_source); // bâtiment et n'existe pas
	if (!inv_target.isPlayerInventory() && !inv_target.exist) return messages.doesntExist(inv_target); // bâtiment et n'existe pas
	if (!inv_source.canEdit(cmdData.author) && !inv_target.canEdit(cmdData.author))
		return makeMessage(`Vous n'etes le propriétaire d'aucun de ces inventaire donc vous ne pouvez pas déplacer les objets`);
	if (!item_name) return messages.badName(item_name);

	const item = new Item(item_name, item_count);

	if (!inv_source.canRemoveItem(item)) {
		return messages.noItem(item, id_source);
	}
	if (!inv_target.canAddItem(item)) {
		return messages.cantAddItem(item, id_target);
	}

	var item_source, item_target;
	try {
		item_source = inv_source.removeItem(item);
		item_target = inv_target.addItem(item);
	} catch (e) {
		return makeError(`Erreur en déplaçant ${item.name} de ${inv_source} vers ${inv_target} (${e})`);
	}

	try {
		await Promise.all(inv_source.save(), inv_target.save());
	} catch (e) {
		return makeError(`Erreur lors de la sauvegarde en déplaçant ${item.name} de ${inv_source} vers ${inv_target} (${e})`);
	}

	return makeMessage(
		`Vous avez déplacé ${item.toSmallText()} de ${id_source} vers ${id_target}.\n` +
			messages.itemSmartInfo(item_source, id_source) +
			'\n' +
			messages.itemSmartInfo(item_target, id_target)
	);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} inv_id
 * @param {string} description
 */
async function executeDescription(cmdData, inv_id, description) {
	const inv = await getInventory(inv_id, false);

	if (!inv.isPlayerInventory() && !inv.exist) return messages.doesntExist(inv); // bâtiment et n'existe pas
	if (!inv.canEdit(cmdData.author)) return messages.cantEdit(inv);

	inv.description = description;
	await inv.save();
	return makeMessage(`La description de ${inv_id} est désormais : ${description}`, inv.color);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} inv_id
 * @param {string} couleur
 */
async function executeCouleur(cmdData, inv_id, couleur) {
	const inv = await getInventory(inv_id, false);

	if (!inv.isPlayerInventory() && !inv.exist) return messages.doesntExist(inv); // bâtiment et n'existe pas

	if (!couleur) {
		return makeMessage(`La couleur de ${inv_id} est actuellement ${inv.color}`, inv.color);
	}

	if (!inv.canEdit(cmdData.author)) return messages.cantEdit(inv);

	if (!couleur.match(colorLib.hexRegex)) {
		const couleurHex = colorLib.colorNameToHex(couleur);
		if (!couleurHex) {
			return makeError(`La couleur ${couleur} n'est pas valide, utilisez le format #000000`);
		}
		couleur = couleurHex;
	}

	inv.color = couleur;
	await inv.save();
	return makeMessage(`La couleur de ${inv_id} est désormais ${inv.color}`, inv.color);
}
