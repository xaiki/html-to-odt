<style>
 h1, figure, p {
	 text-align: center;
	 margin: 0 auto;
 }

 h1 {
	 font-size: 2.8em;
	 text-transform: uppercase;
	 font-weight: 700;
	 margin: 0 0 0.5em 0;
 }

 figure {
	 margin: 0 0 1em 0;
	 display:flex;
	 flex-direction: column;
 }

 img {
	 width: 100%;
	 max-width: 400px;
	 margin: 1em auto;
 }

 p {
	 margin: 1em auto;
 }

 @media (min-width: 480px) {
	 h1 {
		 font-size: 4em;
	 }
 }
</style>

<script>
 import { onMount} from 'svelte';

 let fetch;

 onMount(() => {
	 fetch = window.fetch
 })

 function bufferToHex (buffer) {
     return [...new Uint8Array (buffer)]
         .map (b => b.toString (16).padStart (2, "0"))
         .join ("");
 }

 function download(filename, data) {
	 const element = document.createElement('a');
	 element.setAttribute('href', URL.createObjectURL(data));
	 element.setAttribute('download', filename);

	 element.style.display = 'none';
	 document.body.appendChild(element);

	 element.click();

	 document.body.removeChild(element);
 }

 async function handleClick() {
	 const req = await fetch('/odt/blah', {method: 'POST'})
	 console.error('req', req)
 }


 async function readFile(stream, type="application/vnd.oasis.opendocument.text") {
	 let res = [];
	 let chunk = {done: false};

	 const reader = await stream.getReader()
	 do {
		 chunk = await reader.read();
		 if (chunk.value) res.push(chunk.value.buffer)

	 } while (! chunk.done);

	 console.error('res', res)
	 return new Blob(res, {type});
 }

 async function handleInput() {
	 for (let i in this.files) {
		 const file = this.files[i]
		 const buf = await file.arrayBuffer()
		 const sha256 = await crypto.subtle.digest('SHA-256', buf)

		 const res = await fetch(`/odt/${bufferToHex(sha256)}`, {method: 'POST', body: buf})
		 const body = await readFile(res.body)

		 download(`${file.name}.odt`, body)
	 }
	 console.error(this.files)
 }
</script>

<svelte:head>
	<title>Desodiador de Yas</title>
</svelte:head>

<h1>Sube tu HTML que yo te lo ODTifico</h1>

<figure>
	<p>
		subi tu archivo aca: 
		<input type="file" on:change={handleInput}/>
	</p>
	<img alt='Success Kid' src='successkid.jpg'>
</figure>

