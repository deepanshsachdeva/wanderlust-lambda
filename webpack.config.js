const fs = require('fs');
const path = require('path');
const slsw = require('serverless-webpack');

module.exports = {
	entry: slsw.lib.entries,
	target: 'node',
	module: {
		loaders: [{
			test: /\.js$/,
			loaders: ['babel-loader'],
			include: __dirname,
			exclude: /node_modules/,
		}],
	},
	output: {
		libraryTarget: 'commonjs',
		path: path.join(__dirname, '.webpack'),
		filename: '[name].js',
	},
	// externals: fs.readdirSync('node_modules').filter((x) => { return x !== '.bin'; }),
	externals: ['pg', 'sqlite3', 'tedious', 'pg-hstore']
};