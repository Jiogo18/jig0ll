import express from 'express';
import favicon from 'serve-favicon';

const app = express();
const __dirname = process.env.INIT_CWD || process.env.PWD;

app.use(favicon(__dirname + '/favicon.ico'));

/**
 * Create a link between the url and a file
 * @param {string} webPath The relative path in the url
 * @param {string} filePath The relative path of the file
 */
function registerWeb(webPath, filePath) {
	app.get(webPath, (req, res) => {
		if (!filePath.startsWith('/')) filePath = '/' + filePath;
		res.sendFile(__dirname + filePath, undefined, error => {
			if (!error) return;
			if (error.errno == -4058) {
				res.send(`File not found : ${filePath}`);
				console.log(`File not found : '${error.path}'`.red);
			} else {
				res.send(`An error occurred, please try again later (${error.status})`);
				console.error(error);
			}
		});
	});
}

//l'ordre est important : les premiers sont prioritaires
registerWeb('/', '/web/index.html');
registerWeb('/main.css', '/web/css/main.css');
//registerWeb('/main.js', '/web/js/main.js');

// page unknow
app.use((req, res) => {
	res.status(404);
	res.sendFile(__dirname + '/web/unknow.html', undefined, error => {
		if (!error) return;
		if (error.errno == -4058) {
			res.send(`File not found`);
			console.log(`File not found : '${error.path}'`.red);
		} else {
			res.send(`An error occurred, please try again later (${error.status})`);
			console.error(error);
		}
	});
});

export default {
	start() {
		const port = parseInt(process.env.PORT) || 80;
		app.listen(port, () => {
			console.log(`Server running on port ${port}`.blue);
		});
	},
};
