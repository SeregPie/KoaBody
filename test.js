let assert = require('assert').strict;
let fetch = require('node-fetch');
let Koa = require('koa');
let util = require('util');

let KoaBody = require('./index');

(async () => {

	let app = new Koa();
	app.on('error', () => {
		// pass
	});
	app.use(async ctx => {
		try {
			let json = await KoaBody.json(ctx, {limit: '8b'});
			if (util.isDeepStrictEqual(json, {a: 1})) {
				ctx.body = null;
			} else {
				ctx.throw(400);
			}
		} catch {
			ctx.throw(500);
		}
	});
	await new Promise(resolve => {
		app.server = app.listen(resolve);
	});
	let {port} = app.server.address();
	let origin = `http://localhost:${port}`;
	{
		let res = await fetch(origin, {
			method: 'POST',
			body: JSON.stringify({a: 1}),
		});
		assert(res.ok);
	}
	{
		let res = await fetch(origin, {
			method: 'POST',
			body: JSON.stringify({a: 1, b: 2, c: 3}),
		});
		assert.equal(res.status, 500);
	}
	await new Promise(resolve => {
		app.server.close(resolve);
	});

})();
