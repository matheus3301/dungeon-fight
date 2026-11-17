from pathlib import Path
import urllib.request,json,concurrent.futures,hashlib,struct,shutil
root=Path(__file__).resolve().parents[2]/'assets/library/games';root.mkdir(parents=True,exist_ok=True);project=root.parents[2];out=project/'public/assets/games/flare';out.mkdir(parents=True,exist_ok=True)
sha='c641d2ac2801617f6be3e327454de39250d489b9';artsha='8830c68b420b631e09a459e5b0bf87c0e068a558'
# Per-file audio credits from upstream Credits.md; explicit licences override defaults.
entries=[
 ('audio/sword.ogg','mods/fantasycore/soundfx/sword.ogg','CC0-1.0','Iwan qubodup Gabovitch; Ljudbank','sfx'),
 ('audio/door.ogg','mods/fantasycore/soundfx/door_open.ogg','CC0-1.0','Iwan qubodup Gabovitch','sfx'),
 ('audio/freeze.ogg','mods/fantasycore/soundfx/freeze.ogg','CC0-1.0','Bart K','sfx'),
 ('audio/skeleton-hit.ogg','mods/fantasycore/soundfx/enemies/skeleton_hit.ogg','CC0-1.0','Ljudbank / Johannes Pinter','sfx'),
 ('audio/zombie-hit.ogg','mods/fantasycore/soundfx/enemies/zombie_hit.ogg','CC0-1.0','Ljudbank / Johannes Pinter','sfx'),
 ('music/battle.ogg','mods/fantasycore/music/battle_theme.ogg','CC-BY-SA-3.0','remaxim','music'),
 ('music/boss.ogg','mods/fantasycore/music/boss_theme.ogg','CC-BY-SA-3.0','remaxim','music'),
 ('music/dungeon.ogg','mods/fantasycore/music/dungeon_theme.ogg','CC-BY-SA-3.0','remaxim','music'),
 ('sprites/minotaur-stance.png','mods/fantasycore/images/enemies/minotaur/minotaur_stance.png','CC-BY-3.0','Clint Bellanger','boss-sheet'),
 ('sprites/wyvern-stance.png','mods/fantasycore/images/enemies/wyvern/wyvern_stance.png','CC-BY-SA-3.0','Clint Bellanger; Justin Nichol (textures)','boss-sheet'),
 ('sprites/goblin.png','mods/fantasycore/images/enemies/goblin.png','CC-BY-3.0','Clint Bellanger','monster-sheet'),
 ('textures/dungeon.png','mods/fantasycore/images/tilesets/tileset_dungeon.png','CC-BY-SA-3.0','Clint Bellanger; Flare contributors, see upstream Credits','tileset')]
model=[('models/goblin.blend','art_src_hd/characters/goblin/goblin.blend','CC-BY-3.0','Clint Bellanger','3d-source'),('models/minotaur.blend','art_src_hd/characters/minotaur/minotaur.blend','CC-BY-3.0','Clint Bellanger','3d-source')]
def fetch(e):
 dest,relative,lic,author,role=e;hd=role=='3d-source';repo='flareteam/flare-game-art-src' if hd else 'flareteam/flare-game';rev=artsha if hd else sha;u=f'https://raw.githubusercontent.com/{repo}/{rev}/{relative}';local=root/('flare-art' if hd else 'flare')/relative
 try:
  if local.exists():b=local.read_bytes()
  else:b=urllib.request.urlopen(u,timeout=60).read()
  f=out/dest;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(b)
  entry=dict(id='flare-'+dest.replace('/','-').replace('.','-'),role=role,url='/assets/games/flare/'+dest,sourcePath=relative,sourceUrl=f'https://github.com/{repo}/blob/{rev}/{relative}',license=lic,author=author,revision=rev,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b),modified=False)
  if dest.endswith('.png'):entry['width'],entry['height']=struct.unpack('>II',b[16:24]);entry['presentation']='Full original spritesheet, use upstream animation metadata for frame coordinates'
  print('FLARE',dest,len(b),lic,flush=True);return entry
 except Exception as e:print('ERROR',relative,str(e),flush=True);return None
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:files=[x for x in ex.map(fetch,entries+model) if x]
for src,dest in [('flare-LICENSE.txt','CC-BY-SA-3.0.txt'),('flare-CREDITS.txt','CREDITS.txt'),('flare-credits.md','CREDITS-PER-FILE.md'),('flare-art-CREDITS.txt','CREDITS-HD-ART.txt'),('flare-art-README.md','README-HD-ART.md')]:shutil.copy2(root/src,out/dest)
# Save CC-BY legal code beside the licensed selection.
try:(out/'CC-BY-3.0.txt').write_bytes(urllib.request.urlopen('https://creativecommons.org/licenses/by/3.0/legalcode.txt',timeout=25).read())
except Exception:(out/'CC-BY-3.0.txt').write_text('Creative Commons Attribution3.0 Unported: https://creativecommons.org/licenses/by/3.0/legalcode\n')
(out/'NOTICE.md').write_text(f'# Flare alternative assets\n\nUnmodified selected Flare files. Per-file attribution, source URL, SHA-256 and licence are in assets/catalog-games.json. CC BY3.0 and CC BY-SA3.0 require attribution and keeping the applicable licence; share-alike applies to adaptations under CC BY-SA. CC0 files are identified separately. The code licence does not replace the art/audio licence.\n\nGame source: https://github.com/flareteam/flare-game/tree/{sha}\n\nHD Blender source: https://github.com/flareteam/flare-game-art-src/tree/{artsha}\n\nAll copied sprite sheets are original full sheets, not cropped previews. The Blender files are source candidates, not browser-ready GLB files; their upstream source project and texture dependencies are retained in assets/library/games/flare-art. No render scripts or executables were run.\n')
(root/'flare-curated.json').write_text(json.dumps(files,indent=2)+'\n');print('Flare curated',len(files),flush=True)
