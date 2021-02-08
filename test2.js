let KoaRoute = require('@seregpie/koa-route');
let assert = require('assert').strict;
let FormData = require('form-data');
let Koa = require('koa');
let fetch = require('node-fetch');
let {URLSearchParams} = require('url');
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
	app.use(KoaRoute.post('/test-form', async ctx => {
		console.log(ctx.headers);
		console.log(await KoaBody.text(ctx));
		/*let {i, s, f} = await KoaBody.form(ctx);
		if (i !== '1') {
			throw 0;
		}
		if (s !== 'a') {
			throw 0;
		}
		if (!util.isDeepStrictEqual(
			{
				size: f.size,
				name: f.name,
				type: f.type,
			},
			{

			},
		)) {
			throw 0;
		}*/
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
		{
			let data = new URLSearchParams();
			{
				data.append('i', 1);
				data.append('s', 'a');
			}
			let res = await fetch(`${origin}/test-form`, {
				method: 'POST',
				body: data,
			});
			assert(res.ok);
		}
		{
			let data = new FormData();
			{
				//data.append('i', 1);
				data.append('s', 'a');
				//data.append('f', Buffer.alloc(8), {filename: 'my-file.png'});
			}
			let res = await fetch(`${origin}/test-form`, {
				method: 'POST',
				body: data,
			});
			assert(res.ok);
		}
	} finally {
		await new Promise(resolve => {
			app.server.close(resolve);
		});
	}

})();
