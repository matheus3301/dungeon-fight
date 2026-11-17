import urllib.request, pathlib, json, hashlib, tarfile, concurrent.futures, time
root=pathlib.Path(__file__).resolve().parents[2]/'assets/library/games';root.mkdir(parents=True,exist_ok=True)
repos=[('dcss','crawl/tiles','a6ea1655db5c044829d9eea19a232fa6fcac87b0'),('flare','flareteam/flare-game','c641d2ac2801617f6be3e327454de39250d489b9'),('flare-art','flareteam/flare-game-art-src','8830c68b420b631e09a459e5b0bf87c0e068a558'),('wesnoth','wesnoth/wesnoth','d95858d3638d87c89a415aeb7ce02997179a8b90')]
def download(e):
 key,repo,sha=e;url=f'https://codeload.github.com/{repo}/tar.gz/{sha}';f=root/(key+'.tar.gz');dest=root/key
 receipt=root/(key+'-source.json')
 if receipt.exists() and f.exists() and dest.exists():
  record=json.loads(receipt.read_text())
  if hashlib.file_digest(f.open('rb'),'sha256').hexdigest()==record['sha256']:
   print('CACHED',key,flush=True);return record
 print('BEGIN',key,url,flush=True)
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Dungeon-Fighter-asset-research'}),timeout=180) as r, f.open('wb') as out:
  while True:
   b=r.read(1024*1024)
   if not b: break
   out.write(b)
 print('DOWNLOADED',key,f.stat().st_size,flush=True)
 with tarfile.open(f,'r:gz') as t:
  dest.mkdir(exist_ok=True)
  for m in t.getmembers():
   parts=pathlib.PurePosixPath(m.name).parts[1:]
   if not parts: continue
   if '..' in parts or m.issym() or m.islnk():continue
   m.name=str(pathlib.PurePosixPath(*parts));t.extract(m,dest,filter='data')
 files=[x for x in dest.rglob('*') if x.is_file()];size=sum(x.stat().st_size for x in files)
 record=dict(id=key,repository=f'https://github.com/{repo}',revision=sha,download_url=url,archive=f.name,sha256=hashlib.file_digest(f.open('rb'),'sha256').hexdigest(),archive_bytes=f.stat().st_size,extracted_bytes=size,files=len(files),retrieved_at='2026-11-16')
 (root/(key+'-source.json')).write_text(json.dumps(record,indent=2)+'\n');print('DONE',key,len(files),size,flush=True)
 return record
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
 results=[]
 for fut in concurrent.futures.as_completed([ex.submit(download,e) for e in repos]):
  try:results.append(fut.result())
  except Exception as exc:print('ERROR',type(exc).__name__,str(exc),flush=True)
(root/'sources.json').write_text(json.dumps(results,indent=2)+'\n')
