import subprocess,re,json,sys
pdf,idx,out=sys.argv[1:4]
ix=json.load(open(idx))
n=int(re.search(r'Pages:\s+(\d+)',subprocess.check_output(['pdfinfo',pdf]).decode()).group(1))
pages=[subprocess.check_output(['pdftotext','-f',str(i),'-l',str(i),'-layout',pdf,'-']).decode() for i in range(1,n+1)]
norm=[re.sub(r'\s+',' ',p) for p in pages]
def roman(k):
  v=[(10,'x'),(9,'ix'),(5,'v'),(4,'iv'),(1,'i')];r=''
  for a,b in v:
    while k>=a: r+=b;k-=a
  return r
body_start=next(i for i,p in enumerate(norm) if 'CHAPTER 1 ' in p)
res={}
def find(pat,start=0):
  for i in range(start,n):
    if re.search(pat,norm[i]): return i
  return None
for key,pat in [('abs','^\\s*ABSTRACT'),('lof','^\\s*LIST OF FIGURES AND TABLES')]:
  i=find(pat); res[key]=roman(i) if i is not None else '?'
def body(i): return str(i-body_start+1) if i is not None else '?'
for t,k,l in ix['toc']:
  if k.startswith('ch'): res[k]=body(find(r'CHAPTER %s '%k[2:],body_start))
  elif k=='appA': res[k]=body(find(r'APPENDIX A DEMO LOGIN CREDENTIALS All accounts',body_start))
  elif k=='refs': res[k]=body(find(r'REFERENCES \[1\]',body_start))
  else:
    sid=k[1:]; title=t.split('  ',1)[1]
    res[k]=body(find(re.escape(sid)+r'\s+'+re.escape(title[:25]).replace('\\ ',r'\s+'),body_start))
for f in ix['figs']: res['f'+f['id']]=body(find(r'Figure %s:'%re.escape(f['id']),body_start))
for t in ix['tabs']: res['t'+t['id']]=body(find(r'Table %s:'%re.escape(t['id']),body_start))
json.dump(res,open(out,'w'),indent=0); print(n,'pages; body starts pdf page',body_start+1); print({k:v for k,v in res.items() if v=='?'})
