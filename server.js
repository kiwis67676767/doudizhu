#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Dou Dizhu table server.

   Deliberately tiny: it is a message relay plus a static file server, with no
   npm dependencies at all.  Game rules live in the browser — whoever creates a
   table is the authority for it and deals each player only their own cards, so
   no hand ever travels to a player who should not see it.

     node server.js [port]
   --------------------------------------------------------------------------- */
"use strict";
const http = require("http");
const fs   = require("fs");
const path = require("path");
const os   = require("os");

const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const ROOT = __dirname;
const ROOM_TTL = 6 * 60 * 60 * 1000;          /* forget idle tables after 6h */

/** code -> { clients: Map<pid, res>, host: pid|null, touched: number } */
const rooms = new Map();

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   /* no I/O/0/1 */
function newCode(){
  let c;
  do {
    c = "";
    for (let i = 0; i < 5; i++) c += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  } while (rooms.has(c));
  return c;
}

function sweep(){
  const now = Date.now();
  for (const [code, room] of rooms){
    if (now - room.touched > ROOM_TTL && room.clients.size === 0) rooms.delete(code);
  }
}
setInterval(sweep, 10 * 60 * 1000).unref();

function send(res, code, body, type){
  res.writeHead(code, {
    "content-type": type || "application/json",
    "cache-control": "no-store"
  });
  res.end(body);
}
function readBody(req){
  return new Promise(function(resolve, reject){
    let n = 0; const chunks = [];
    req.on("data", function(d){
      n += d.length;
      if (n > 1e6){ reject(new Error("body too large")); req.destroy(); return; }
      chunks.push(d);
    });
    req.on("end", function(){
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch(e){ reject(e); }
    });
    req.on("error", reject);
  });
}
/** push one message down a subscriber's event stream */
function push(res, obj){
  try { res.write("data: " + JSON.stringify(obj) + "\n\n"); } catch(e){}
}
function fanout(room, from, to, msg){
  const env = {from: from, msg: msg};
  for (const [pid, res] of room.clients){
    if (pid === from) continue;                 /* never echo to the sender */
    if (to && pid !== to) continue;             /* addressed to one player */
    push(res, env);
  }
}

const TYPES = {".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
               ".css":"text/css; charset=utf-8", ".ico":"image/x-icon"};

const server = http.createServer(async function(req, res){
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const p = url.pathname;

  /* ---- create a table ---- */
  if (p === "/r/new" && req.method === "POST"){
    const code = newCode();
    rooms.set(code, {clients:new Map(), host:null, touched:Date.now()});
    /* hand back reachable base URLs so the share link is not "localhost" */
    const urls = addresses().map(a => "http://" + a + ":" + PORT);
    return send(res, 200, JSON.stringify({room: code, urls: urls}));
  }

  /* ---- subscribe to a table (server-sent events) ---- */
  if (p === "/r/sub" && req.method === "GET"){
    const code = (url.searchParams.get("room") || "").toUpperCase();
    const pid  = url.searchParams.get("pid") || "";
    const room = rooms.get(code);
    if (!room || !pid) return send(res, 404, JSON.stringify({error:"no such table"}));
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "connection": "keep-alive",
      "x-accel-buffering": "no"
    });
    res.write(": connected\n\n");
    room.clients.set(pid, res);
    room.touched = Date.now();
    if (!room.host) room.host = pid;                       /* first in is the dealer */
    push(res, {from:"server", msg:{t:"hello", pid: pid, host: room.host === pid, room: code}});
    fanout(room, pid, null, {t:"peer-joined", pid: pid});

    const beat = setInterval(function(){ push(res, {from:"server", msg:{t:"ping"}}); }, 25000);
    req.on("close", function(){
      clearInterval(beat);
      room.clients.delete(pid);
      room.touched = Date.now();
      fanout(room, pid, null, {t:"peer-left", pid: pid});
    });
    return;
  }

  /* ---- relay a message ---- */
  if (p === "/r/pub" && req.method === "POST"){
    let body;
    try { body = await readBody(req); } catch(e){ return send(res, 400, JSON.stringify({error:"bad body"})); }
    const room = rooms.get((body.room || "").toUpperCase());
    if (!room) return send(res, 404, JSON.stringify({error:"no such table"}));
    room.touched = Date.now();
    fanout(room, body.from, body.to || null, body.msg);
    return send(res, 200, JSON.stringify({ok:true}));
  }

  /* ---- does this table exist? ---- */
  if (p === "/r/check"){
    const room = rooms.get((url.searchParams.get("room") || "").toUpperCase());
    return send(res, 200, JSON.stringify({exists: !!room, players: room ? room.clients.size : 0}));
  }

  /* ---- static files ---- */
  let file = p === "/" ? "/doudizhu.html" : p;
  file = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT)) return send(res, 403, "forbidden", "text/plain");
  fs.readFile(full, function(err, data){
    if (err) return send(res, 404, "not found", "text/plain");
    send(res, 200, data, TYPES[path.extname(full).toLowerCase()] || "application/octet-stream");
  });
});

function addresses(){
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)){
    for (const ni of ifaces[name] || []){
      if (ni.family === "IPv4" && !ni.internal) out.push(ni.address);
    }
  }
  return out;
}

server.listen(PORT, function(){
  const urls = ["http://localhost:" + PORT].concat(addresses().map(a => "http://" + a + ":" + PORT));
  console.log("\n  斗地主 table server running\n");
  urls.forEach(function(u, i){
    console.log("   " + (i === 0 ? "you: " : "lan: ") + u);
  });
  console.log("\n  Open one of those, choose \"Play with friends\", and send the link it gives you");
  console.log("  to the other players. They must be able to reach this machine — same wifi is");
  console.log("  usually enough; over the internet, put a tunnel in front of this port.\n");
});
