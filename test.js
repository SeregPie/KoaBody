let KoaRoute = require('@seregpie/koa-route');
let assert = require('assert').strict;
let FormData = require('form-data');
let JustMyLuck = require('just-my-luck');
let Koa = require('koa');
let fetch = require('node-fetch');
let {URLSearchParams} = require('url');
let util = require('util');

let KoaBody = require('./index');

(async () => {

	let app = new Koa();
	let handle;
	app.use(ctx => handle(ctx));
	await new Promise(resolve => {
		app.server = app.listen(resolve);
	});
	try {
		let {port} = app.server.address();
		let origin = `http://localhost:${port}`;
		{
			let value;
			handle = (async ctx => {
				let body = await KoaBody(ctx);
				if (!util.isDeepStrictEqual(body, value)) {
					throw 0;
				}
				ctx.body = null;
			});
			{
				value = 'aaa';
				{
					let res = await fetch(origin, {
						method: 'POST',
						body: value,
					});
					assert(res.ok);
				}
				{
					let value = 'bbb';
					let res = await fetch(origin, {
						method: 'POST',
						body: value,
					});
					assert(!res.ok);
				}
			}
			{
				value = {a: 1, b: 2};
				{
					let res = await fetch(origin, {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify(value),
					});
					assert(res.ok);
				}
				{
					let value = {a: 2, b: 1};
					let res = await fetch(origin, {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify(value),
					});
					assert(!res.ok);
				}
			}
		}
		{
			handle = (async ctx => {
				console.log(ctx.headers)
				await KoaBody(ctx, {limit: '4b'});
			});
			{
				let res = await fetch(origin, {
					method: 'POST',
					body: 'a',
				});
				assert(res.ok);
			}
			{
				let res = await fetch(origin, {
					method: 'POST',
					body: 'aa',
				});
				assert(res.ok);
			}
			{
				let res = await fetch(origin, {
					method: 'POST',
					body: 'aaa',
				});
				assert(!res.ok);
			}
		}
	} finally {
		await new Promise(resolve => {
			app.server.close(resolve);
		});
	}

})();
