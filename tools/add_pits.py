# Генерация приямков 2×2×2 м под каждым боксом в изометрической схеме.
# Запуск (на версии без приямков): python3 tools/add_pits.py index.html
# Положение и размеры — переменные Y0, Y1, D, T и список bays ниже. Проекция: P(X,Y,Z), метры от левого-переднего угла здания, Z от пола.
import re,sys,xml.etree.ElementTree as ET
SRC=sys.argv[1]
s=open(SRC,encoding='utf-8').read()
assert 'data-pit' not in s, 'pits already present'
def P(X,Y,Z): return (113.9+15.752*X+7.682*Y, 238.3+5.142*X-10.549*Y-13.0*Z)
def f(p): return f"{p[0]:.1f} {p[1]:.1f}"
def poly(*pts): return "M"+"L".join(f(P(*q)) for q in pts)+"Z"
def line(*pts): return "M"+"L".join(f(P(*q)) for q in pts)

Y0,Y1,D,T=5.4,7.4,2.0,0.2   # приямок у конца лотка, перед задней лентой
ZW=-0.9                     # уровень воды = низ выпуска в коллектор
ZS=-1.65                    # осадок
def pit(xc,n):
  X0,X1=xc-1,xc+1; Zb=-D
  o=(X0-T,X1+T,Y0-T,Y1+T,Zb-T)
  OX0,OX1,OY0,OY1,OZ=o
  g=[]
  g.append(f'<g class="mp-pit" data-pit="{n}">')
  # скрытые наружные рёбра бетонного корпуса
  g.append(f'<path class="pit-hid" d="{line((OX0,OY0,OZ),(OX1,OY0,OZ),(OX1,OY1,OZ))}{line((OX0,OY0,OZ),(OX0,OY1,OZ))}{line((OX0,OY0,0),(OX0,OY0,OZ))}{line((OX1,OY0,0),(OX1,OY0,OZ))}{line((OX1,OY1,0),(OX1,OY1,OZ))}"/>')
  # внутренние грани: дно, задняя стенка, левая стенка
  g.append(f'<path class="pit-bot" d="{poly((X0,Y0,Zb),(X1,Y0,Zb),(X1,Y1,Zb),(X0,Y1,Zb))}"/>')
  g.append(f'<path class="pit-back" d="{poly((X0,Y1,0),(X1,Y1,0),(X1,Y1,Zb),(X0,Y1,Zb))}"/>')
  g.append(f'<path class="pit-left" d="{poly((X0,Y0,0),(X0,Y1,0),(X0,Y1,Zb),(X0,Y0,Zb))}"/>')
  # скобы-ступени на левой стенке
  steps="".join(line((X0+0.02,Y0+0.7,z),(X0+0.02,Y0+1.1,z)) for z in (-0.4,-0.8,-1.2,-1.6))
  g.append(f'<path class="pit-rung" d="{steps}"/>')
  # стоки: осадок, вода, выпуск в коллектор
  g.append('<g class="mp" data-sys="drain">')
  g.append(f'<path class="pit-sludge" d="{poly((X0,Y0,ZS),(X1,Y0,ZS),(X1,Y1,ZS),(X0,Y1,ZS))}{poly((X0,Y0,ZS),(X1,Y0,ZS),(X1,Y0,Zb),(X0,Y0,Zb))}{poly((X1,Y0,ZS),(X1,Y1,ZS),(X1,Y1,Zb),(X1,Y0,Zb))}"/>')
  g.append(f'<path class="pit-water" d="{poly((X0,Y0,ZW),(X1,Y0,ZW),(X1,Y1,ZW),(X0,Y1,ZW))}"/>')
  g.append(f'<path class="pit-wline" d="{line((X0,Y0,ZW),(X1,Y0,ZW),(X1,Y1,ZW))}"/>')
  c=P(xc+0.5,Y1,ZW+0.08)
  g.append(f'<ellipse class="pit-out" cx="{c[0]:.1f}" cy="{c[1]:.1f}" rx="1.5" ry="1.1"/>')
  # струя из лотка
  a=P(xc,Y1-0.05,-0.05);b=P(xc,Y1-0.15,ZW)
  g.append(f'<path class="pit-fall mp-flow" d="M{f(a)}L{f(b)}"/>')
  g.append('</g>')
  # передняя и правая стенки — «рентген»: полупрозрачно
  g.append(f'<path class="pit-xray" d="{poly((X0,Y0,0),(X1,Y0,0),(X1,Y0,Zb),(X0,Y0,Zb))}{poly((X1,Y0,0),(X1,Y1,0),(X1,Y1,Zb),(X1,Y0,Zb))}"/>')
  # видимые внутренние рёбра
  g.append(f'<path class="pit-edge" d="{line((X0,Y1,0),(X0,Y1,Zb),(X1,Y1,Zb))}{line((X0,Y1,Zb),(X0,Y0,Zb))}"/>')
  g.append(f'<path class="pit-hid" d="{line((X0,Y0,Zb),(X1,Y0,Zb),(X1,Y1,Zb))}{line((X1,Y0,0),(X1,Y0,Zb))}"/>')
  # бортик (срез стенок 200 мм по верху)
  g.append(f'<path class="pit-rim" fill-rule="evenodd" d="{poly((OX0,OY0,0),(OX1,OY0,0),(OX1,OY1,0),(OX0,OY1,0))}{poly((X0,Y0,0),(X1,Y0,0),(X1,Y1,0),(X0,Y1,0))}"/>')
  g.append(f'<path class="pit-edge pit-edge-hi" d="{poly((X0,Y0,0),(X1,Y0,0),(X1,Y1,0),(X0,Y1,0))}{poly((OX0,OY0,0),(OX1,OY0,0),(OX1,OY1,0),(OX0,OY1,0))}"/>')
  # решётка по краю (уголок под съёмную решётку)
  g.append('</g>')
  return "".join(g)

bays=[2.5,7.5,12.5,17.5,26.5,31.5,36.5,41.5]
i=s.index('<svg xmlns',s.index('<div class="iso-stage'));j=s.index('</svg>',i)+6
svg=s[i:j]
# точки вставки: сразу после решётки лотка каждого бокса (рисуется поверх пола и тёплого пола, под оборудованием)
root=ET.fromstring(svg);kids=list(root)
grates=[]
for n,k in enumerate(kids):
  if k.tag.endswith('path') and k.get('class')=='iso-line' and k.get('data-tone')=='mid' and len(k.get('d'))>500 and n>200:
    grates.append(n)
print('grates',grates)
assert len(grates)==8
# режем исходный текст по верхнеуровневым элементам
body=svg[svg.index('>',4)+1:svg.rindex('</svg>')]
# найдём строковые позиции верхнеуровневых детей
pos=[];depth=0;k=0
for m in re.finditer(r'<(/?)([a-zA-Z]+)\b[^>]*?(/?)>',body):
  close,tag,selfc=m.groups()
  if close: depth-=1; 
  else:
    if depth==0: pos.append(m.start())
    if not selfc: depth+=1
  if close and depth==0: pass
assert len(pos)==len(kids),(len(pos),len(kids))
ins={}
for b,(xc,gi) in enumerate(zip(bays,grates)):
  # сортируем гр. по экранному x, чтобы сопоставить боксам
  pass
gx=sorted(grates,key=lambda n: float(kids[n].get('d')[1:].split()[0]))
for b,(xc,gi) in enumerate(zip(bays,gx)):
  ins[gi+1]=pit(xc,b+1)
out=[];last=0
for n,p in enumerate(pos):
  if n in ins: out.append(body[last:p]); out.append(ins[n]); last=p
out.append(body[last:])
newbody="".join(out)
newsvg=svg[:svg.index('>',4)+1]+newbody+'</svg>'
# метка 28 в боксе 1
px,py=P(2.5-1.0,Y0,0)
newsvg=newsvg.replace('<g class="mp-pins">',f'<g class="mp-pins"><g class="mp-pin" data-pin="28" transform="translate({px-1:.1f} {py-9:.1f})"><path class="mp-pin-stem" d="M0 4.6V7"/><circle r="4.6"/><text y="1.7" text-anchor="middle">28</text></g>',1)
s=s[:i]+newsvg+s[j:]
open(SRC,'w',encoding='utf-8').write(s)
print('ok')
