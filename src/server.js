import fs from 'fs';

import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';
import Docker from 'dockerode';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

const docker = Docker();

const CONTAINER_NAME = 'renothing/libreoffice'

try {
	fs.statSync('./tmp')
} catch {
	fs.mkdirSync('./tmp')
}

const startPolka = () => {
	const app = polka() // You can also use Express
	
	app.post('/odt/:sum', (req, res) => {
		let data = '';
		req.on('data', chunk => data += chunk)
		req.on('end', async () => {
			console.error(`processing: ${req.params.sum}`)

			const dirname = `./tmp/${req.params.sum}`


			try {
				fs.statSync(dirname)
				fs.statSync(`${dirname}/data.odt`)
			} catch {
				try {
					fs.mkdirSync(dirname)
				} catch {
					// pass
				}

				fs.writeFileSync(`${dirname}/data`, data)
				
				const run = await docker.run(
					CONTAINER_NAME,
					[
						'loffice',
						'--headless',
						'--convert-to', 'odt',
						'--outdir', `/tmp/${req.params.sum}/`, `${dirname}/data`],
					process.stdout,
					{
						"HostConfig": {
							"Binds": [
								`${process.cwd()}/tmp:/tmp`,
						]},
						"Mounts": [
							{
								"Type": "bind",
								"Source": "./tmp",
								"Destination": "/tmp",
								"Mode": "",
								"RW": true,
								"Propagation": "rprivate"
							}
						]
				})
			}

			const file = fs.readFileSync(`${dirname}/data.odt`)
			res.end(file)
		})
		
	})
	
	app.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		sapper.middleware()
	)
	   .listen(PORT, err => {
		   if (err) console.log('error', err);
	   });	
}

docker.pull(CONTAINER_NAME, (err, stream) => docker.modem.followProgress(
	stream,
	(err, output) => {
		console.error('finished', output);
	},
	(event) => console.error('progress', event)
))


startPolka();

