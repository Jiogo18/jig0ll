import { EmbedMaker } from '../../lib/messageMaker.js';
import { CommandLevelOptions, ReceivedCommand } from '../../bot/command/received.js';
import { DiscordChannelDatabase, getEveryMessageSnowflake, MessageData } from '../../lib/discordDatabase.js';
import DiscordBot from '../../bot/bot.js';
import { User } from 'discord.js';
import colorLib from '../../lib/color.js';
import YAML from 'yaml';

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
	const channel = await bot.channels.fetch(process.env.WIPOnly ? '850137517344686122' : '850812437258043412');
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
		return `<@${author.id}>`;
	}
	const snowflakeMatch = id_prop.match(/<@!?(\d+)>/);
	if (snowflakeMatch) {
		return `<@${snowflakeMatch[1]}>`;
	}
	const snowflake2Match = id_prop.match(/<@&(\d+)>/);
	if (snowflake2Match) throw `Ce type de tag n'est pas valide : \`<@&${snowflake2Match[1]}>\`.\nEvitez de copier/coller les tags`;
	return id_prop;
}

/**
 * @param {Function} executeFunc
 */
function createExecuteLink(executeFunc) {
	/**
	 * @param {ReceivedCommand} cmdData
	 * @param {CommandLevelOptions} levelOptions
	 */
	return (cmdData, levelOptions) =>
		executeFunc(
			cmdData,
			getPropId(levelOptions.getArgumentValue('inv', 0), cmdData.author),
			...levelOptions.options.filter((v, i) => i).map(i => i?.value)
		);
}

const invo = {
	id_source: {
		name: 'inv_source',
		description: "Inventaire source (* pour l'inventaire perso)",
		type: 3,
		required: true,
	},
	id_target: {
		name: 'inv',
		description: "Inventaire cible (* pour l'inventaire perso)",
		type: 3,
		required: true,
	},
	item_name: {
		name: 'item',
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
	description: 'Gestion des inventaires',
	alts: ['inv'],

	security: {
		place: 'public',
		interaction: true,
	},

	options: [
		{
			name: 'reload',
			description: 'Recharger tous les inventaires (en cas de bug, ne pas en abuser)',
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
			executeAttribute: (cmdData, levelOptions) => executeCreateBatiment(cmdData, levelOptions.getArgumentValue('name', 0)),
		},
		{
			name: 'delete',
			description: "Supprimer l'inventaire",
			type: 1,
			options: [invo.id_target],
			executeAttribute: createExecuteLink(executeDelete),
		},
		{
			name: 'open',
			description: "Ouvrir l'inventaire",
			type: 1,
			options: [{ ...invo.id_target, required: false }],
			/** @param {ReceivedCommand} cmdData */
			execute: cmdData => executeOpen(cmdData, getPropId('', cmdData.author)),
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
			/**
			 * @param {ReceivedCommand} cmdData
			 * @param {CommandLevelOptions} levelOptions
			 */
			executeAttribute: (cmdData, levelOptions) =>
				executeMove(
					cmdData,
					getPropId(levelOptions.getArgumentValue('inv_source', 0), cmdData.author),
					getPropId(levelOptions.getArgumentValue('inv', 1), cmdData.author),
					levelOptions.getArgumentValue('item', 2),
					levelOptions.getArgumentValue('count', 3)
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
			/**
			 * @param {ReceivedCommand} cmdData
			 * @param {CommandLevelOptions} levelOptions
			 */
			executeAttribute: (cmdData, levelOptions) =>
				executeDescription(
					cmdData,
					getPropId(levelOptions.getArgumentValue('inv', 0), cmdData.author),
					levelOptions.getArgumentValue('description', 1)
				),
		},
		{
			name: 'set',
			description: "Changer une donnée de l'inventaire",
			type: 1,
			options: [
				invo.id_target,
				{
					name: 'key',
					description: 'Nom de la donnée',
					type: 3,
					choices: [
						{ name: 'Proprietaire', value: 'prop' },
						{ name: 'Nom', value: 'name' },
					],
					required: true,
				},
				{
					name: 'value',
					description: 'Valeur de la donnée',
					type: 3,
					required: true,
				},
			],
			/**
			 * @param {ReceivedCommand} cmdData
			 * @param {CommandLevelOptions} levelOptions
			 */
			executeAttribute: (cmdData, levelOptions) =>
				executeSetData(
					cmdData,
					getPropId(levelOptions.getArgumentValue('inv', 0), cmdData.author),
					levelOptions.getArgumentValue('key', 1),
					levelOptions.getArgumentValue('value', 2)
				),
		},
		{
			name: 'couleur',
			description: `Changer la couleur de l'inventaire`,
			type: 1,
			options: [invo.id_target, colorLib.commandOptions],
			/**
			 * @param {ReceivedCommand} cmdData
			 * @param {CommandLevelOptions} levelOptions
			 */
			executeAttribute: (cmdData, levelOptions) =>
				executeCouleur(cmdData, getPropId(levelOptions.getArgumentValue('inv', 0), cmdData.author), levelOptions.getArgumentValue('couleur', 1)),
		},
		{
			name: 'liste',
			description: 'Lister vos inventaires',
			type: 1,
			options: [
				{
					name: 'user',
					description: "Lister les inventaires d'un joueur",
					type: 6,
					required: false,
				},
			],
			/** @param {ReceivedCommand} cmdData */
			execute: cmdData => executeListUserInventory(cmdData, getPropId('', cmdData.author)),
			/**
			 * @param {ReceivedCommand} cmdData
			 * @param {CommandLevelOptions} levelOptions
			 */
			executeAttribute: (cmdData, levelOptions) =>
				executeListUserInventory(cmdData, getPropId(levelOptions.getArgumentValue('user', 0), cmdData.author)),
		},
	],

	/**
	 * @param {DiscordBot} bot
	 */
	setBot(b) {
		bot = b;
		bot.onReady.then(setChannelDatabase);
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
	return EmbedMaker.Error('Inventaire', description);
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
	 * @param {ReceivedCommand} cmdData
	 */
	doesntExist: async (inv, cmdData) => {
		const error = makeError(`Cet inventaire n'existe pas.\nPour créer un inventaire de bâtiment utilisez \`create <nom_batiment>\``);
		const user_invs = await getInventoryListOf(getPropId('', cmdData.author));
		if (user_invs.length > 0) error.addField(`Vous avez ${user_invs.length} inventaires`, user_invs.map(inv => inv.id).join(', '));
		return error;
	},
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
	get noms() {
		return this.messageData.id;
	}
	set noms(noms) {
		this.messageData.id = noms;
		if (this.proprietaire === noms) this.proprietaire = undefined;
	}

	/**
	 * The owner of the inventory (the first user)
	 * @type {string}
	 */
	get proprietaire() {
		return this.messageData.data.proprietaire || this.noms;
	}
	set proprietaire(prop) {
		if (prop === this.noms || !prop) delete this.messageData.data.proprietaire;
		else this.messageData.data.proprietaire = prop;
	}

	/**
	 * Items in the inventory
	 * @type {Item[]}
	 */
	items;

	/**
	 * The MessageData where the inventory is stored
	 * @type {MessageData}
	 */
	messageData;

	/**
	 * Description of the inventory
	 * @type {string}
	 */
	get description() {
		return this.messageData.data.description;
	}
	set description(desc) {
		if (!desc) delete this.messageData.data.description;
		else this.messageData.data.description = desc;
	}

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
		/**
		 * @type {Item[]}
		 */
		const inv = messageData.data.inventaire;
		this.items = inv?.map(item => new Item(item.name, item.count)) || [];
		this.messageData.data.inventaire = this.items;
	}

	/**
	 * Save the inventory
	 */
	save() {
		return this.messageData.save();
	}

	/**
	 * Does the message of inventory is created
	 */
	get created() {
		return this.messageData.exist;
	}

	/**
	 * Does the inventory don't need to be created first
	 */
	get exist() {
		return this.created || this.isPlayerInventory();
	}

	delete() {
		return this.messageData.delete();
	}

	/**
	 * Does the inventory belong to a user or a building
	 */
	isPlayerInventory() {
		return !!this.noms.match(/^<@\W?\d{10,20}>$/);
	}

	/**
	 * Is the Owner / propriétaire
	 * @param {User} user
	 */
	isProp(user) {
		if (!user) return false;
		if (this.noms === getPropId('', user)) return true;
		if (this.proprietaire === getPropId('', user)) return true;
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
	return new Inventory(await channelDatabase?.getMessageData(id));
}

/**
 * @param {string} user_mention
 * @return {Promise<Inventory[]>} Almost the same object
 */
async function getInventoryListOf(user_mention) {
	const messagesSnowflake = Array.from((await getEveryMessageSnowflake(channelDatabase.channel)).values());

	messagesSnowflake.forEach(m => (m.data = YAML.parse(m.embeds?.[0]?.description || '')));

	return messagesSnowflake.filter(m => m.data?.proprietaire === user_mention).map(m => m.data);
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
	if (name_batiment.match(/^ +$/)) return makeError('Le nom du bâtiment doit contenir des lettres et / ou des chiffres');

	const inv = await getInventory(name_batiment);
	if (!inv) {
		process.consoleLogger.commandError(cmdData.commandLine, `Impossible de créer le bâtiment \`${name_batiment}\``);
		return makeError('Impossible de créer le bâtiment, réessayez');
	}
	if (inv.created) return makeError(`Ce bâtiment existe déjà : \`${name_batiment}\``);

	inv.proprietaire = getPropId('', cmdData.author);
	await inv.save();
	return makeMessage(
		`Un bâtiment a été créé pour ${inv.proprietaire} : \`${name_batiment}\`\nPrécisez \`${name_batiment}\` pour ouvrir son inventaire`,
		inv.color
	);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} inv_id
 */
async function executeDelete(cmdData, inv_id) {
	const inv = await getInventory(inv_id);

	if (!inv.created) return messages.doesntExist(inv, cmdData);
	if (!inv.canEdit(cmdData.author)) return messages.cantEdit(inv);

	try {
		await inv.delete();
		return makeMessage(`L'inventaire ${inv_id} a été supprimé`);
	} catch (error) {
		return makeError(`Impossible de supprimer l'inventaire \`${inv.noms}\``);
	}
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} inv_id
 */
async function executeOpen(cmdData, inv_id) {
	const inv = await getInventory(inv_id);

	if (!inv.exist) return messages.doesntExist(inv, cmdData);
	if (!inv.canOpen(cmdData.author)) return messages.cantOpen(inv);

	const inventory_source = inv.items;

	var retour = `**Inventaire de ${inv_id}**\n`;
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

	if (!inv.exist) return messages.doesntExist(inv, cmdData); // bâtiment et n'existe pas
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

	const inv = await getInventory(id);

	if (!inv.exist) return messages.doesntExist(inv, cmdData); // bâtiment et n'existe pas
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

	const inv_source = await getInventory(id_source);
	const inv_target = await getInventory(id_target);

	if (!inv_source.exist) return messages.doesntExist(inv_source, cmdData); // bâtiment et n'existe pas
	if (!inv_target.exist) return messages.doesntExist(inv_target, cmdData); // bâtiment et n'existe pas
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
	} catch (error) {
		return makeError(`Erreur en déplaçant ${item.name} de ${inv_source.noms} vers ${inv_target.noms} (${error})`);
	}

	try {
		await Promise.all([inv_source.save(), inv_target.save()]);
	} catch (error) {
		return makeError(`Erreur lors de la sauvegarde en déplaçant ${item.name} de ${inv_source.noms} vers ${inv_target.noms} (${error})`);
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
	const inv = await getInventory(inv_id);

	if (!inv.exist) return messages.doesntExist(inv, cmdData); // bâtiment et n'existe pas
	if (!inv.canEdit(cmdData.author)) return messages.cantEdit(inv);

	inv.description = description;
	await inv.save();
	if (!description) return makeMessage(`La description de ${inv_id} est désormais vide`, inv.color);
	return makeMessage(`La description de ${inv_id} est désormais : ${description}`, inv.color);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} inv_id
 * @param {string} key
 * @param {string} value
 */
async function executeSetData(cmdData, inv_id, key, value) {
	const inv = await getInventory(inv_id);

	if (!inv.exist) return messages.doesntExist(inv, cmdData); // bâtiment et n'existe pas
	if (!inv.canEdit(cmdData.author)) return messages.cantEdit(inv);

	switch (key) {
		case 'prop':
			if (inv.isPlayerInventory()) {
				return makeError(`Vous ne pouvez pas modifier le propriétaire de l'inventaire d'un joueur`);
			}
			const prop_id = getPropId(value);
			inv.proprietaire = prop_id;
			await inv.save();
			if (inv.proprietaire) return makeMessage(`Le propriétaire de \`${inv.noms}\` est désormais '${inv.proprietaire}'`);
			else return makeMessage(`L'inventaire \`${inv.noms}\` n'a plus de propriétaire`);

		case 'name':
			if (inv.isPlayerInventory()) {
				return makeError(`Vous ne pouvez pas modifier le nom de l'inventaire d'un joueur`);
			}
			if (!value.match(/\w+/)) return makeError(`Le nom de l'inventaire ne peut pas être vide`);
			const old_name = inv.noms;
			inv.noms = value;
			await inv.save();
			return makeMessage(`L'inventaire \`${old_name}\` a été renommé \`${inv.noms}\``);

		default:
			return makeError(`Aucun paramètre nommée '${key}'`);
	}
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} inv_id
 * @param {string} couleur
 */
async function executeCouleur(cmdData, inv_id, couleur) {
	const inv = await getInventory(inv_id);

	if (!inv.exist) return messages.doesntExist(inv, cmdData); // bâtiment et n'existe pas

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

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} user_mention
 */
async function executeListUserInventory(cmdData, user_mention) {
	const userInventories = await getInventoryListOf(user_mention);

	return makeMessage(`${userInventories.length} inventaires appartiennent à ${user_mention} :\n${userInventories.map(inv => inv.id).join(', ')}`);
}
