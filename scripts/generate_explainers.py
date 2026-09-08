#!/usr/bin/env python3
"""Original Stackscroll silent diagram videos. Requires Python 3, Pillow and ffmpeg.

Run: python3 scripts/generate_explainers.py /path/to/output
Rebuilds MP4, poster PNG, WebVTT, scene/transcript JSON and ffprobe metadata.
No source imagery, voices, likenesses or copied diagrams are used.
"""
from pathlib import Path
import json, math, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

OUT = Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1] / "public" / "media"
OUT.mkdir(parents=True,exist_ok=True)
W, H, FPS = 720, 900, 20
INK = '#101d2e'
MUTED = '#576778'
CYAN = '#0dd2e4'
PALE = '#e7fafc'
LINE = '#b8cbd3'
WHITE = '#ffffff'
GREEN = '#0b8067'
FONT_DIR = Path('/usr/share/fonts/truetype/dejavu')

def font(size=36, bold=False, mono=False):
    name = 'DejaVuSansMono.ttf' if mono else ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')
    return ImageFont.truetype(str(FONT_DIR / name), size)

def text(d, xy, value, size=36, color=INK, bold=False, mono=False, anchor=None):
    d.multiline_text(xy, value, font=font(size,bold,mono), fill=color,
                     spacing=9, anchor=anchor, stroke_width=0)

def center(d, box, value, size=36, color=INK, bold=False):
    f = font(size,bold)
    b = d.multiline_textbbox((0,0), value, font=f, spacing=7, align='center')
    x = (box[0]+box[2]-(b[2]-b[0]))/2
    y = (box[1]+box[3]-(b[3]-b[1]))/2-b[1]
    d.multiline_text((x,y),value,font=f,fill=color,spacing=7,align='center')

def card(d, box, value, active=False, dark=False, size=36, color=None):
    d.rounded_rectangle(box, radius=21, fill=INK if dark else PALE if active else WHITE,
                        outline=CYAN if active else LINE, width=3)
    center(d,box,value,size,color or (WHITE if dark else INK),True)

def arrow(d, a, b, color=LINE, width=4):
    d.line([a,b],fill=color,width=width)
    ang=math.atan2(b[1]-a[1],b[0]-a[0]); n=13
    d.polygon([b,(b[0]-n*math.cos(ang-.45),b[1]-n*math.sin(ang-.45)),
                 (b[0]-n*math.cos(ang+.45),b[1]-n*math.sin(ang+.45))],fill=color)

def dot(d, path, p, color=CYAN):
    lengths=[math.dist(a,b) for a,b in zip(path,path[1:])]
    target = p*sum(lengths)
    for a,b,length in zip(path,path[1:],lengths):
        if target <= length:
            r=target/length if length else 0
            x=a[0]+(b[0]-a[0])*r; y=a[1]+(b[1]-a[1])*r
            d.ellipse((x-8,y-8,x+8,y+8),fill=color)
            return
        target-=length

DNS=[
    ('Start with a name.', 'Your app needs an address\nfor a name before it connects.'),
    ('Ask the resolver.', 'The client sends the question\nto its configured DNS resolver.'),
    ('A cached answer?', 'The resolver may already have\na usable answer in its cache.'),
    ('Or do a lookup.', 'If needed, it asks other DNS\nservers to find the answer.'),
    ('Return an address.', 'If found, the resolver replies\nwith the requested address.'),
    ('Check name resolution.', 'Use nslookup to query a name\nand inspect the DNS response.'),
    ('A failure is a clue.', 'Name resolution failure is not\nproof the app server is broken.'),
]
AGENT=[
    ('The coding-agent loop.', 'A coding agent makes progress\nby checking what its tools did.'),
    ('Define the boundary.', 'Start with a bounded task\nand a clear success condition.'),
    ('Take a tool action.', 'Use a tool to inspect code,\nmake an edit, or run a check.'),
    ('Check the evidence.', 'Choose tests that check\nthe intended behavior.'),
    ('Revise with feedback.', 'Read failures, revise the change,\nand run relevant checks again.'),
    ('Finish with evidence.', 'Finish when the task is met.\nReport checks and remaining limits.'),
    ('Pause at the boundary.', 'Ask for authorization before\nconsequential production actions.'),
    ('Confidence ≠ evidence.', 'Confident text is not\na passed check.'),
]

def base(topic, title, caption, scene, total, t):
    im=Image.new('RGB',(W,H),WHITE); d=ImageDraw.Draw(im)
    # Stackscroll mark, matching the three bars in the supplied 28 × 28 SVG.
    for x,y in [(3,3),(7,12),(3,21)]:
        d.rectangle((36+x,37+y,36+x+17,37+y+3),fill=CYAN)
    text(d,(69,34),'Stackscroll',26,bold=True)
    text(d,(36,84),'AI-authored animation',24,color=MUTED)
    text(d,(36,144),topic.upper(),30,color=GREEN,bold=True)
    text(d,(36,199),title,46,bold=True)
    d.rounded_rectangle((24,722,696,858),18,fill=INK)
    center(d,(38,735,682,846),caption,36,WHITE)
    # The full-width progress line also animates continuously during silent playback.
    d.rounded_rectangle((36,878,684,883),2,fill=PALE)
    d.rounded_rectangle((36,878,36+648*t/(total*4),883),2,fill=CYAN)
    return im,d

def dns_frame(t):
    idx=min(int(t/4),len(DNS)-1); local=t-idx*4
    title,caption=DNS[idx]
    im,d=base('Simplified DNS flow',title,caption,idx,len(DNS),t)
    p=(local*.48)%1
    if idx==0:
        card(d,(46,311,674,425),'app.example.com',True,False,44)
        arrow(d,(360,425),(360,501),INK)
        card(d,(120,504,600,628),'Which address?',False,True,40)
        dot(d,[(360,437),(360,487)],p)
    elif idx==1:
        card(d,(145,303,575,414),'Client',True,False,42)
        arrow(d,(360,414),(360,491),INK)
        card(d,(78,494,642,620),'Configured\nDNS resolver',True)
        dot(d,[(360,426),(360,477)],p)
    elif idx in (2,3):
        card(d,(155,290,565,397),'DNS resolver',True)
        d.line([(360,397),(360,446),(187,446)],fill=LINE,width=4)
        d.line([(360,446),(533,446)],fill=LINE,width=4)
        arrow(d,(187,446),(187,494),INK if idx==2 else LINE)
        arrow(d,(533,446),(533,494),INK if idx==3 else LINE)
        card(d,(39,496,335,645),'Cached\nanswer',idx==2,size=36)
        card(d,(385,496,681,645),'Other DNS\nservers',idx==3,size=36)
        text(d,(326,664),'OR',30,color=MUTED,bold=True)
        x=187 if idx==2 else 533
        dot(d,[(360,410),(360,446),(x,446),(x,479)],p)
    elif idx==4:
        card(d,(140,284,580,375),'DNS resolver',True)
        arrow(d,(360,375),(360,440),INK)
        card(d,(50,443,670,554),'203.0.113.42',True,True,46)
        arrow(d,(360,554),(360,604),INK)
        card(d,(210,607,510,689),'Client',False,size=36)
        text(d,(58,562),'Example address',25,color=MUTED)
        dot(d,[(360,385),(360,430)],p)
        dot(d,[(360,566),(360,589)],p)
    elif idx==5:
        d.rounded_rectangle((33,310,687,542),20,fill=INK)
        text(d,(56,337),'EXAMPLE COMMAND',27,color=CYAN,bold=True)
        text(d,(54,421),'nslookup app.example.com',36,color=WHITE,mono=True)
        text(d,(45,587),'Inspect the returned answer',36,bold=True)
        text(d,(45,637),'or error before concluding.',36,color=MUTED)
        d.rectangle((554,476,574,480),fill=CYAN if local%1<.6 else INK)
    else:
        card(d,(50,298,670,389),'Client configuration',True)
        card(d,(50,416,670,507),'Network path',True)
        card(d,(50,534,670,625),'DNS service',True)
        text(d,(48,663),'Different causes. Investigate.',36,color=MUTED)
        y=[344,462,580][int(local/.7)%3]
        d.ellipse((23,y-7,37,y+7),fill=CYAN)
    return im

def loop(d,active=0,p=.5,finish=False):
    boxes=[(155,289,565,362),(155,402,565,475),(155,515,565,588),
           (44,636,328,705),(392,636,676,705)]
    labels=['Bounded task','Tool action','Check results','Revise','Finish']
    arrow(d,(360,362),(360,402),INK)
    arrow(d,(360,475),(360,515),INK)
    d.line([(360,588),(360,611),(186,611)],fill=LINE,width=4)
    d.line([(360,611),(534,611)],fill=LINE,width=4)
    arrow(d,(186,611),(186,636),INK)
    arrow(d,(534,611),(534,636),INK)
    # Revision returns to tool work; a completed task has no outgoing loop.
    d.line([(44,670),(24,670),(24,438)],fill=LINE,width=4)
    arrow(d,(24,438),(155,438),INK)
    selected=4 if finish and active==3 else active
    for i,(box,label) in enumerate(zip(boxes,labels)): card(d,box,label,i==selected,False,36)
    paths=[[(360,365),(360,395)],[(360,478),(360,508)],
           [(360,593),(360,611),(534 if finish else 186,611),(534 if finish else 186,628)],
           [(44,670),(24,670),(24,438),(143,438)]]
    if selected!=4: dot(d,paths[active],p)

def agent_frame(t):
    idx=min(int(t/4),len(AGENT)-1); local=t-idx*4
    title,caption=AGENT[idx]
    im,d=base('Coding agents',title,caption,idx,len(AGENT),t)
    p=(local*.5)%1
    if idx==0:
        loop(d,int(local)%4,p)
    elif idx==1:
        text(d,(45,298),'TASK',27,color=GREEN,bold=True)
        card(d,(39,345,681,447),'Fix input validation',True,False,40)
        text(d,(46,486),'Success condition',36,bold=True)
        text(d,(46,537),'Empty input is rejected.',36)
        text(d,(46,600),'Scope: one component',36,color=MUTED)
        d.line([(46,659),(46+590*min(local/2,1),659)],fill=CYAN,width=6)
    elif idx==2:
        card(d,(47,305,673,429),'Bounded task',False,False,40)
        arrow(d,(360,429),(360,508),INK)
        card(d,(47,511,673,643),'Inspect · edit · run',True,True,36)
        dot(d,[(360,442),(360,493)],p)
    elif idx==3:
        labels=['Intended behavior','Relevant tests','Observed results']
        for i,label in enumerate(labels):
            y=293+i*136
            card(d,(55,y,665,y+98),label,i==int(local*.8)%3)
            if i<2: arrow(d,(360,y+99),(360,y+135),INK)
    elif idx==4:
        card(d,(44,298,676,398),'Check failed',False,True,40)
        arrow(d,(360,398),(360,442),INK)
        card(d,(44,445,676,545),'Revise the change',True,False,40)
        arrow(d,(360,545),(360,589),INK)
        card(d,(44,592,676,689),'Run the check again',True,size=36)
        dot(d,[(360,405),(360,434)],p)
        dot(d,[(360,553),(360,583)],p)
    elif idx==5:
        loop(d,2 if local<2 else 3,p,True)
    elif idx==6:
        card(d,(44,303,676,425),'Production action',False,True,40)
        arrow(d,(360,425),(360,500),INK)
        card(d,(44,503,676,653),'Ask for\nauthorization',True,size=40)
        # The marker stops at the authorization boundary; no deploy is portrayed.
        dot(d,[(360,438),(360,483)],min(local/1.5,1))
    else:
        card(d,(48,302,672,416),'“Looks correct.”',False,False,44)
        center(d,(200,432,520,512),'≠',70,color=GREEN,bold=True)
        card(d,(48,529,672,661),'A check\nactually passed',True,True,40)
        d.line([(84,684),(84+552*min(local/2,1),684)],fill=CYAN,width=6)
    return im

def timestamp(s):
    return f'{int(s)//3600:02}:{int(s)//60%60:02}:{int(s)%60:02}.000'

def build(slug,scenes,renderer,sources,extra):
    duration=len(scenes)*4
    out=OUT/f'{slug}.mp4'
    command=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-vcodec','rawvideo',
             '-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-',
             '-an','-c:v','libx264','-preset','slow','-crf','25','-pix_fmt','yuv420p',
             '-movflags','+faststart','-metadata','title='+extra['title'],str(out)]
    process=subprocess.Popen(command,stdin=subprocess.PIPE)
    for frame in range(duration*FPS):
        process.stdin.write(renderer(frame/FPS).tobytes())
    process.stdin.close()
    if process.wait(): raise RuntimeError('ffmpeg encoding failed')
    renderer(1.2).save(OUT/f'{slug}.png',optimize=True)
    qa=OUT/'qa'; qa.mkdir(exist_ok=True)
    for i in range(len(scenes)):
        renderer(i*4+2).save(qa/f'{slug}-{i+1:02}.png',optimize=True)
    captions=['WEBVTT','']
    timeline=[]
    for i,(heading,caption) in enumerate(scenes):
        extended = caption.replace('\n',' ')
        if slug=='dns-in-motion' and i==5:
            extended+=' Example command: nslookup app.example.com.'
        captions += [str(i+1),f'{timestamp(i*4)} --> {timestamp((i+1)*4)}',extended,'']
        timeline.append({'start':i*4,'end':(i+1)*4,'heading':heading,'caption':caption.replace('\n',' '),
                         'accessible_transcript':extended})
    (OUT/f'{slug}.vtt').write_text('\n'.join(captions),encoding='utf-8')
    data={'slug':slug,'duration_seconds':duration,'width':W,'height':H,'fps':FPS,
          'audio':False,'authorship':'Original AI-authored technical animation for Stackscroll',
          'sources_checked':'2026-09-08','sources':sources,'scenes':timeline,**extra}
    (OUT/f'{slug}.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
    metadata=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-show_streams','-of','json',str(out)]))
    (OUT/f'{slug}.ffprobe.json').write_text(json.dumps(metadata,indent=2)+'\n')
    print(f'{out.name}: {duration}s, {out.stat().st_size:,} bytes',flush=True)
    if out.stat().st_size>=3_000_000: raise RuntimeError('Requested size budget exceeded')

def write_transcripts():
    diagram_text = {
        'dns-in-motion': [
            ['app.example.com','Which address?'],
            ['Client','Configured DNS resolver'],
            ['DNS resolver','Cached answer','Other DNS servers','OR'],
            ['DNS resolver','Cached answer','Other DNS servers','OR'],
            ['DNS resolver','203.0.113.42','Example address','Client'],
            ['EXAMPLE COMMAND','nslookup app.example.com','Inspect the returned answer','or error before concluding.'],
            ['Client configuration','Network path','DNS service','Different causes. Investigate.']],
        'agent-feedback-loop': [
            ['Bounded task','Tool action','Check results','Revise','Finish'],
            ['TASK','Fix input validation','Success condition','Empty input is rejected.','Scope: one component'],
            ['Bounded task','Inspect · edit · run'],
            ['Intended behavior','Relevant tests','Observed results'],
            ['Check failed','Revise the change','Run the check again'],
            ['Bounded task','Tool action','Check results','Revise','Finish'],
            ['Production action','Ask for authorization'],
            ['“Looks correct.”','≠','A check actually passed']]
    }
    transcripts=[]
    for slug in diagram_text:
        data=json.loads((OUT/f'{slug}.json').read_text())
        for scene,labels in zip(data['scenes'],diagram_text[slug]):
            scene['diagram_text']=labels
        data['persistent_text']=['Stackscroll','AI-authored animation',
                                  'Simplified DNS flow' if slug=='dns-in-motion' else 'Coding agents']
        data['transcript']=' '.join(scene['accessible_transcript'] for scene in data['scenes'])
        (OUT/f'{slug}.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
        transcripts.append(data)
    (OUT/'transcripts.json').write_text(json.dumps(transcripts,indent=2,ensure_ascii=False)+'\n')

if __name__=='__main__':
    build('dns-in-motion',DNS,dns_frame,[
        {'title':'Microsoft Learn — Troubleshoot DNS client name resolution issues',
         'url':'https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/troubleshoot-dns-client-resolution-issues',
         'supports':'Resolution failure can arise from client, DNS server or intermediate network problems.'},
        {'title':'Microsoft Learn — nslookup',
         'url':'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup',
         'supports':'Single-name lookup uses the default DNS server when a server is not specified; DNS lookup and error inspection.'}],
        {'title':'DNS, in motion','summary':'A simplified DNS flow: client, configured resolver, cached answer or lookup, address reply if found.',
         'example_command':'nslookup app.example.com',
         'scope_note':'Simplified flow. Local hosts files, client caches, record types, referrals and transport details are omitted. The example address is illustrative.'})
    build('agent-feedback-loop',AGENT,agent_frame,[
        {'title':'Anthropic — Building effective agents',
         'url':'https://www.anthropic.com/engineering/building-effective-agents',
         'supports':'Tools and environmental feedback form an agent loop; coding agents use tests; stopping conditions and human checkpoints preserve control.'}],
        {'title':'The coding-agent feedback loop','summary':'Bounded task, tool action, result check and revision or completion.',
         'editorial_guidance':'Relevant behavior tests and explicit authorization for consequential production actions are Stackscroll recommendations informed by source principles.'})
    write_transcripts()
