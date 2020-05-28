# ol-deltagare
Närvarohantering för Orientering

## URL
https://callebokedal.github.io/ol-deltagare

## Bookmarklet code - Eventor

document.querySelectorAll("#main h3 ~ table tbody tr:nth-child(1n+1) td:nth-child(-n+2)")

```js
var s="";document.querySelectorAll("#main h3 ~ table tbody tr:nth-child(1n+1) td:nth-child(-n+2)").forEach((tds, idx) => {
	if(idx%2 == 0){
		// Name
		s += tds.innerHTML + ";"
	} else {
		// Class
		s += tds.innerHTML + "\n"
	}
});
console.log(s)
```

Condensed
```js
var s="";document.querySelectorAll("#main h3 ~ table tbody tr:nth-child(1n+1) td:nth-child(-n+2)").forEach((tds, idx) => {
if(idx%2 == 0){s += tds.innerHTML + ";"} else {s += tds.innerHTML + "\n"}});
//console.log(s);
var node = document.createElement("textarea");
node.id = "tmpExtra";
document.querySelector("body").appendChild(node);
node = document.querySelector("#tmpExtra");
//console.log(node);
node.value = s;
node.select();
//node.setSelectionRange(0, 99999);
document.execCommand("copy");
```

