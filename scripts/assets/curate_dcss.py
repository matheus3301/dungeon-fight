from pathlib import Path
import shutil,json,hashlib,struct,re
root=Path(__file__).resolve().parents[2]/'assets/library/games';root.mkdir(parents=True,exist_ok=True);project=root.parents[2];src=root/'dcss/releases/Nov-2015';out=project/'public/assets/games/dcss';out.mkdir(parents=True,exist_ok=True)
unknown=(root/'dcss/TILES_UNDER_UNKNOWN_LICENSE.md').read_text();excluded=set(re.findall(r'^-\s+([^\s]+\.png)',unknown,re.M))
selection={'heroes':{'knight':'mon/vault_guard.png','wizard':'mon/deep_elf_mage.png','ranger':'mon/deep_elf_fighter.png','rogue':'mon/spriggan/spriggan.png','cleric':'mon/orc_priest.png','bard':'mon/satyr.png','chef':'mon/gnoll_shaman.png','barbarian':'mon/iron_troll.png'},'bosses':{'dragon':'mon/dragons/golden_dragon.png','demon':'mon/demons/brimstone_fiend.png','necromancer':'mon/undead/ancient_lich.png','minotaur':'player/base/minotaur_brown2_m.png','ghost':'mon/undead/ghost.png','slime':'mon/amorphous/azure_jelly.png'}}
files=[];mapping={}
for group,items in selection.items():
 mapping[group]={}
 for name,relative in items.items():
  f=src/relative;assert f.exists(),relative;assert f.name not in excluded,(relative,'unclear rights')
  dest=out/group/(name+'.png');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
  b=f.read_bytes();w,h=struct.unpack('>II',b[16:24]);entry={'id':f'dcss-{group}-{name}','role':group,'archetype':name,'url':'/assets/games/dcss/'+group+'/'+name+'.png','width':w,'height':h,'sourcePath':relative,'sourceUrl':'https://github.com/crawl/tiles/blob/a6ea1655db5c044829d9eea19a232fa6fcac87b0/releases/Nov-2015/'+relative,'license':'CC0-1.0','author':'Dungeon Crawl Stone Soup tile artists (see ARTISTS.md)','sha256':hashlib.sha256(b).hexdigest(),'modified':False}
  files.append(entry);mapping[group][name]=entry
# Small thematic texture/effect library, unchanged files with cleared basenames.
for group,folder,limit in [('textures','dngn/floor',12),('walls','dngn/wall',8),('effects','effect',12)]:
 candidates=sorted((src/folder).rglob('*.png')) if (src/folder).exists() else []
 for f in [f for f in candidates if f.name not in excluded][:limit]:
  dest=out/group/f.name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest);b=f.read_bytes();w,h=struct.unpack('>II',b[16:24]);files.append({'id':'dcss-'+group+'-'+f.stem,'role':group,'url':'/assets/games/dcss/'+group+'/'+f.name,'width':w,'height':h,'sourcePath':str(f.relative_to(src)),'sourceUrl':'https://github.com/crawl/tiles/blob/a6ea1655db5c044829d9eea19a232fa6fcac87b0/releases/Nov-2015/'+str(f.relative_to(src)),'license':'CC0-1.0','author':'Dungeon Crawl Stone Soup tile artists (see ARTISTS.md)','sha256':hashlib.sha256(b).hexdigest(),'modified':False})
for n in ['README.md','ARTISTS.md','TILES_UNDER_UNKNOWN_LICENSE.md']:shutil.copy2(root/'dcss'/n,out/n)
(out/'NOTICE.md').write_text('# Dungeon Crawl Stone Soup tiles\n\nUnmodified files from crawl/tiles CC0 export Nov-2015, revision a6ea1655db5c044829d9eea19a232fa6fcac87b0.\n\nSource: https://github.com/crawl/tiles\n\nLicense: CC0-1.0, https://creativecommons.org/publicdomain/zero/1.0/\n\nArtists and exclusion lists are included. Files whose basenames occur on the unknown-license list were excluded from this public selection. This is an alternative art pack, not artwork from Dungeon Fighter.\n')
(root/'dcss-curated.json').write_text(json.dumps(files,indent=2)+'\n');(project/'docs/asset-mapping.json').write_text(json.dumps({'schemaVersion':1,'purpose':'Optional game-derived art, separate from primary 0x72 palette','dcss':mapping},indent=2)+'\n')
print(project,'curated',len(files),'files')
