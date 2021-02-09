let bytes = require('bytes');
let formidable = require('formidable');
let qs = require('qs');
let {promisify} = require('util');
let {createGunzip} = require('zlib');

function isObject(value) {
	if (value) {
		let type = typeof value;
		return type === 'object' || type === 'function';
	}
	return false;
}

async function blob(ctx, {
	limit = Infinity,
} = {}) {
	let {req} = ctx;
	let minLength = 0;
	let maxLength = bytes.parse(limit);
	{
		let header = req.headers['content-length'];
		if (header) {
			minLength = Number(header);
			if (minLength > maxLength) {
				throw new Error();
			}
			maxLength = minLength;
		}
	}
	{
		let header = req.headers['content-encoding'];
		switch (header) {
			case 'gzip': {
				let t = createGunzip();
				req = req.pipe(t);
				break;
			}
			case 'compress': {
				break;
			}
			case 'deflate': {
				break;
			}
			case 'identity': {
				break;
			}
			case 'br': {
				break;
			}
		}
	}
	let currentData = [];
	let currentLength = 0;
	let onData;
	let onEnd;
	let onError;
	let onClose;
	try {
		await new Promise((resolve, reject) => {
			(req
				.on('data', onData = (data => {
					currentLength += data.length;
					if (currentLength > maxLength) {
						//reject(new Error());
					}
					currentData.push(data);
				}))
				.on('end', onEnd = resolve)
				.on('error', onError = reject)
				.on('close', onClose = (() => {
					reject(new Error());
				}))
			);
		});
	} finally {
		(req
			.removeListener('data', onData)
			.removeListener('end', onEnd)
			.removeListener('error', onError)
			.removeListener('close', onClose)
		);
	}
	if (currentLength < minLength) {
		//throw new Error();
	}
	let buffer = Buffer.concat(currentData);
	return buffer;
}

async function text(ctx, {
	limit = '56kb',
	...options
} = {}) {
	let v = await blob(ctx, {limit, ...options});
	return `${v}`;
}

async function json(ctx, {
	limit = '1mb',
	strict = false,
	...options
} = {}) {
	let v = await text(ctx, {limit, ...options});
	return JSON.parse(v);
}

// MIME sniffing
async function form(ctx, {
	limit = '56kb',
	...options
} = {}) {
	console.log(ctx.headers);
	let form = formidable({multiples: true});
	await new Promise((resolve, reject) => {
		form.parse(ctx.req, (error, fields, files) => {
			if (error) {
				reject(error);
			} else {
				console.log(fields, files);
				resolve();
			}
		});
	});
	return {};
}

module.exports = Object.assign(async function(ctx, {
	limit,
	json: jsonOptions,
	text: textOptions,
	form: formOptions,
	...options
} = {}) {
	let jsonLimit;
	let textLimit;
	let formLimit;
	if (isObject(limit)) {
		({
			json: jsonLimit,
			text: textLimit,
			form: formLimit,
		} = limit);
	} else {
		jsonLimit = textLimit = formLimit = limit;
	}
	if (ctx.is('json')) {
		return await json(ctx, {
			limit: jsonLimit,
			...jsonOptions,
			...options,
		});
	}
	if (ctx.is('text')) {
		return await text(ctx, {
			limit: textLimit,
			...textOptions,
			...options,
		});
	}
	if (ctx.is('application/x-www-form-urlencoded')) {
		let v = await text(ctx, options);
		v = qs.parse(v, {
			depth: Infinity,
			parameterLimit: Infinity,
		});
		console.log(v);
		return v;
	}
	return await blob(ctx, options);
}, {
	json,
	text,
	form,
});
