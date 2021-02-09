let bytes = require('bytes');
let formidable = require('formidable');
let qs = require('qs');
let {
	createBrotliDecompress,
	createGunzip,
	createInflate,
} = require('zlib');

let {isArray} = Array;

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
	let {headers} = req;
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
		if (header) {
			switch (header) {
				case 'gzip': {
					let z = createGunzip();
					req = req.pipe(z);
					break;
				}
				case 'deflate': {
					let z = createInflate();
					req = req.pipe(z);
					break;
				}
				case 'identity': {
					break;
				}
				case 'br': {
					let z = createBrotliDecompress();
					req = req.pipe(z);
					break;
				}
				default: {
					throw new Error();
				}
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
	console.log(
		headers['content-length'],
		req.bytesWritten,
		currentLength,
	);
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
	v = JSON.parse(v);
	if (strict) {
		if (!isArray(v) && !isObject(v)) {
			throw new Error();
		}
	}
	return v;
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
	try {
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
		if (ctx.is('multipart/form-data')) {
			let v = await text(ctx, options);
			v = qs.parse(v, {
				depth: Infinity,
				parameterLimit: Infinity,
			});
			console.log(v);
			return v;
		}
		return await blob(ctx, options);
	} catch (error) {
		console.error(error);
		throw error;
	}
}, {
	json,
	text,
	form,
});
