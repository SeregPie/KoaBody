let KoaRoute = require('@seregpie/koa-route');
let assert = require('assert').strict;
let Koa = require('koa');
let fetch = require('node-fetch');
let util = require('util');

let KoaBody = require('./index');

(async () => {

	let app = new Koa();
	app.on('error', () => {
		// pass
	});
	app.use(KoaRoute.post('/test-text', async ctx => {
		let body = await KoaBody(ctx);
		if (body != 'a') {
			throw 0;
		}
		ctx.body = null;
	}));
	app.use(KoaRoute.post('/test-text-with-limit', async ctx => {
		await KoaBody(ctx, {limit: '2b'});
		ctx.body = null;
	}));
	app.use(KoaRoute.post('/test-json', async ctx => {
		let body = await KoaBody(ctx);
		if (!util.isDeepStrictEqual(body, {a: 1})) {
			throw 0;
		}
		ctx.body = null;
	}));
	app.use(KoaRoute.post('/test-json-with-limit', async ctx => {
		await KoaBody(ctx, {limit: '8b'});
		ctx.body = null;
	}));
	await new Promise(resolve => {
		app.server = app.listen(resolve);
	});
	try {
		let {port} = app.server.address();
		let origin = `http://localhost:${port}`;
		{
			let res = await fetch(`${origin}/test-text`, {
				method: 'POST',
				body: 'a',
			});
			assert(res.ok);
		}
		{
			let res = await fetch(`${origin}/test-text`, {
				method: 'POST',
				body: 'b',
			});
			assert(!res.ok);
		}
		{
			let res = await fetch(`${origin}/test-text-with-limit`, {
				method: 'POST',
				body: 'a',
			});
			assert(res.ok);
		}
		{
			let res = await fetch(`${origin}/test-text-with-limit`, {
				method: 'POST',
				body: 'abc',
			});
			assert(!res.ok);
		}
		{
			let res = await fetch(`${origin}/test-json`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({a: 1}),
			});
			assert(res.ok);
		}
		{
			let res = await fetch(`${origin}/test-json`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({b: 2}),
			});
			assert(!res.ok);
		}
		{
			let res = await fetch(`${origin}/test-json-with-limit`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({a: 1}),
			});
			assert(res.ok);
		}
		{
			let res = await fetch(`${origin}/test-json-with-limit`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({a: 1, b: 2, c: 3}),
			});
			assert(!res.ok);
		}
	} finally {
		await new Promise(resolve => {
			app.server.close(resolve);
		});
	}

})();
