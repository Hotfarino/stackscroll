import concurrent.futures,sys,json,hashlib,re
from pathlib import Path
from urllib.parse import urlsplit,parse_qs,quote
sys.path.insert(0,str(Path(__file__).resolve().parent))
from collect import fetch,Page,CHECKED
import argparse
parser=argparse.ArgumentParser(description='Collect repository and creator-link candidates; never publishes a release.')
parser.add_argument('--cache',type=Path,required=True)
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args()
cache=args.cache
cache.mkdir(parents=True,exist_ok=True)
repo_data=[
('ansible/ansible','AI workflows','Automate configuration with repeatable playbooks.'),
('netbox-community/netbox','Data centers','Explore a source of truth for network and infrastructure data.'),
('nornir-automation/nornir','Networking','Investigate Python-based network automation and inventory.'),
('ktbyers/netmiko','Networking','Explore Python connections to network devices.'),
('napalm-automation/napalm','Networking','Compare a unified network automation interface across vendors.'),
('secdev/scapy','Networking','Explore packet construction and inspection in an isolated lab.'),
('mininet/mininet','Networking','Build small virtual networks for repeatable experiments.'),
('srl-labs/containerlab','Networking','Explore container-based network labs.'),
('esnet/iperf','Networking','Measure network performance with a controlled test.'),
('wireshark/wireshark','Networking','Investigate packets and protocols using a network analyzer.'),
('prometheus/prometheus','Data centers','Explore time-series monitoring and alerting.'),
('grafana/grafana','Data centers','Build dashboards around useful operational signals.'),
('netdata/netdata','Data centers','Investigate infrastructure and application monitoring.'),
('openbmc/openbmc','Data centers','Explore open-source software for baseboard management controllers.'),
('opencomputeproject/onie','Data centers','Investigate the Open Network Install Environment.'),
('DMTF/python-redfish-library','Data centers','Explore Python access to Redfish management interfaces.'),
('opentofu/opentofu','Cloud','Explore infrastructure as code and its state model.'),
('kubernetes-sigs/kind','Cloud','Create local Kubernetes clusters for development experiments.'),
('k3s-io/k3s','Cloud','Investigate a lightweight Kubernetes distribution.'),
('helm/helm','Cloud','Explore packages and release management for Kubernetes.'),
('argoproj/argo-cd','Cloud','Investigate declarative continuous delivery for Kubernetes.'),
('langchain-ai/langgraph','Agentic AI','Explore stateful agent workflows and execution control.'),
('pydantic/pydantic-ai','Agentic AI','Investigate typed interfaces for AI agents.'),
('microsoft/autogen','Agentic AI','Explore agent coordination and multi-agent applications.'),
('microsoft/ai-agents-for-beginners','Agentic AI','Work through a structured introduction to AI agents.'),
('huggingface/smolagents','Agentic AI','Explore a compact library for building agents.'),
('microsoft/generative-ai-for-beginners','AI workflows','Investigate lessons for building generative AI applications.'),
('jupyterlab/jupyterlab','Machine learning','Explore an interactive workspace for notebooks and data.'),
('mlflow/mlflow','Machine learning','Investigate experiment tracking and model lifecycle tools.'),
('dvcorg/dvc','Machine learning','Explore data and model versioning alongside source control.'),
('ray-project/ray','Machine learning','Investigate distributed Python workloads.'),
('vllm-project/vllm','Machine learning','Explore large language model serving.'),
('duckdb/duckdb','Development','Investigate an analytical database that runs inside a process.'),
('astral-sh/ruff','Languages','Explore Python linting and formatting.'),
('astral-sh/uv','Languages','Investigate Python package and project management.'),
('fastapi/fastapi','Development','Build and inspect a typed Python API.'),
('pydantic/pydantic','Development','Explore runtime validation of structured data.'),
('microsoft/PowerToys','CompTIA','Explore utilities for improving a Windows workstation workflow.'),
('PowerShell/PowerShell','CompTIA','Investigate cross-platform shell scripting and automation.'),
('microsoft/winget-cli','CompTIA','Explore package installation and management on Windows.'),
]
def repo(row):
 name,topic,body=row;url='https://github.com/'+name;r=fetch(url,cache)
 if 'error' in r:return dict(source=url,error=r['error'])
 p=Page(r['body'])
 if 'Page not found' in p.title:return dict(source=url,error='Not found')
 return dict(sourceId='repository',source=url,sourceName=name.split('/')[0]+' · GitHub',title=name,topic=topic,kind='resource',format='repository',level='Intermediate',body=body,checkedAt=r['checkedAt'],excerpt='')
items=[];failures=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 for r in pool.map(repo,repo_data):
  (failures if 'error' in r else items).append(r)
print('Repositories',len(items),'unavailable',len(failures),flush=True)
# Only take technical/ML videos directly listed by the creator, then validate public oEmbed metadata.
listing='https://statquest.org/video_index.html'
r=fetch(listing,cache)
videos=[]
if 'error' not in r:
 p=Page(r['body']);seen=set()
 for href,title in p.links:
  u=urlsplit(href);v=u.path.strip('/') if u.hostname=='youtu.be' else parse_qs(u.query).get('v',[''])[0]
  if u.hostname not in ['youtu.be','youtube.com','www.youtube.com'] or not re.fullmatch('[A-Za-z0-9_-]{11}',v) or v in seen:continue
  if not re.search('neural|transformer|attention|gradient|machine learning|cross validation|confusion matrix|precision|recall|bias|variance|regression|decision tree|random forest|xgboost|reinforcement|cosine|entropy|pca|clustering|k-means|token|embedding|softmax|backpropagation|language model|deep learning',title,re.I):continue
  if 'deprecated' in title.lower():continue
  seen.add(v);videos.append((v,title))
 def video(row):
  v,title=row;url='https://www.youtube.com/oembed?url='+quote('https://www.youtube.com/watch?v='+v,safe='')+'&format=json';r=fetch(url,cache)
  if 'error' in r:return dict(source='https://youtu.be/'+v,error=r['error'])
  try:d=json.loads(r['body'])
  except ValueError:return dict(source='https://youtu.be/'+v,error='Invalid oEmbed')
  if 'statquest' not in d.get('author_name','').lower():return dict(source='https://youtu.be/'+v,error='Creator mismatch')
  return dict(sourceId='statquest',source='https://youtu.be/'+v,sourceName=d['author_name'],title=d['title'],topic='Machine learning',kind='video',format='video',level='Foundation',checkedAt=r['checkedAt'],excerpt='',listing=listing)
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  for entry in pool.map(video,videos[:50]):
   (failures if 'error' in entry else items).append(entry)
else:failures.append(dict(source=listing,error=r['error']))
print('Total special items',len(items),'failures',len(failures),flush=True)
args.out.parent.mkdir(parents=True,exist_ok=True)
args.out.write_text(json.dumps(dict(items=items,failures=failures),ensure_ascii=False,indent=2)+'\n')
