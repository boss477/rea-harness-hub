import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const port = Number(process.env.PORT || 10000);
const reaRoot = process.env.REA_ROOT || '/opt/rea';
const token = process.env.WORKER_TOKEN || '';

function send(res, status, body) { res.writeHead(status, {'content-type':'application/json','access-control-allow-origin':'*'}); res.end(JSON.stringify(body)); }
function run(cmd, args, cwd, timeoutMs=10*60*1000) { return new Promise((resolve,reject)=>{ const p=spawn(cmd,args,{cwd,env:process.env}); let out='',err=''; const timer=setTimeout(()=>{p.kill('SIGKILL');reject(new Error('REA job timed out'));},timeoutMs); p.stdout.on('data',d=>out+=d); p.stderr.on('data',d=>err+=d); p.on('error',reject); p.on('close',code=>{clearTimeout(timer); if(code===0)resolve({out,err}); else reject(new Error(err||`REA exited with ${code}`));}); }); }
async function body(req) { let raw=''; for await (const chunk of req) raw+=chunk; if(raw.length>50*1024*1024) throw new Error('Payload too large'); return JSON.parse(raw||'{}'); }
async function handle(req,res) {
  if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-worker-token'});return res.end();}
  if(req.method==='GET'&&req.url==='/health') return send(res,200,{ok:true,service:'rea-worker'});
  if(req.method!=='POST'||req.url!=='/jobs') return send(res,404,{error:'not_found'});
  if(token && req.headers['x-worker-token']!==token) return send(res,401,{error:'unauthorized'});
  let temp;
  try {
    const input=await body(req); const id=crypto.randomUUID(); temp=await fs.mkdtemp(path.join(os.tmpdir(),`rea-${id}-`));
    const filename=path.basename(input.filename||'artifact.bin'); const artifact=path.join(temp,filename);
    if(input.contentBase64) await fs.writeFile(artifact,Buffer.from(input.contentBase64,'base64'));
    else if(input.url) await run('curl',['-L','--fail','--max-time','60','-o',artifact,input.url],temp,90000);
    else throw new Error('Provide url or contentBase64');
    const provider=input.provider||'ghidra'; const result=await run('node',['scripts/rea.mjs','analyze',artifact,'--provider',provider,'--json'],reaRoot);
    return send(res,200,{id,status:'completed',provider,artifact:input.filename||input.url,evidence:result.out,stderr:result.err});
  } catch(error) { return send(res,500,{status:'failed',error:String(error.message||error)}); }
  finally { if(temp) await fs.rm(temp,{recursive:true,force:true}); }
}
http.createServer((req,res)=>handle(req,res).catch(e=>send(res,500,{error:e.message}))).listen(port,'0.0.0.0',()=>console.log(`rea-worker listening on ${port}`));
