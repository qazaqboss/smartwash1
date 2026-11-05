# Разметка изометрической схемы на слои «низ» / «верх» и машины, заезжающие в боксы.
# Запуск (один раз, на версии с приямками, но без слоёв): python3 tools/add_layers.py index.html
import re, sys, xml.etree.ElementTree as ET

SRC = sys.argv[1]
s = open(SRC, encoding="utf-8").read()
assert "data-ly=" not in s, "layers already present"

def P(X, Y, Z): return (113.9 + 15.752 * X + 7.682 * Y, 238.3 + 5.142 * X - 10.549 * Y - 13.0 * Z)
def f(p): return f"{p[0]:.1f} {p[1]:.1f}"
def poly(*pts): return "M" + "L".join(f(P(*q)) for q in pts) + "Z"

i = s.index("<svg xmlns", s.index('<div class="iso-stage')); j = s.index("</svg>", i) + 6
svg = s[i:j]
head_end = svg.index(">", 4) + 1
body = svg[head_end:svg.rindex("</svg>")]
kids = list(ET.fromstring(svg))

# позиции верхнеуровневых элементов в тексте
pos = []; depth = 0
for m in re.finditer(r"<(/?)([a-zA-Z]+)\b[^>]*?(/?)>", body):
    close, tag, selfc = m.groups()
    if close: depth -= 1
    else:
        if depth == 0: pos.append(m.start())
        if not selfc: depth += 1
assert len(pos) == len(kids)

# индекс в исходной схеме (без приямков) для каждого элемента
orig = []; k = 0
for el in kids:
    if el.get("class") == "mp-pit": orig.append(None)
    else: orig.append(k); k += 1
assert k == 731, k

LO = set(range(3, 88)) | set(range(89, 99)) | {137, 181, 182, 183, 536}
BOTH = {0, 1, 2, 88} | set(range(99, 137)) | set(range(138, 168))
# лоток, решётка и линии уклона пола в каждом боксе — общие для обоих слоёв
for n, el in enumerate(kids):
    if el.tag.endswith("path") and el.get("class") == "iso-line" and el.get("data-tone") == "mid" and len(el.get("d")) > 500 and orig[n] and orig[n] > 200:
        BOTH.add(orig[n]); BOTH.add(orig[n] - 1)
        nx = kids[n + 1] if kids[n + 1].get("class") != "mp-pit" else kids[n + 2]
        o = orig[n] + 1
        if nx.get("class") == "iso-line" and nx.get("data-tone") == "faint": BOTH.add(o)

def layer(n, el):
    o = orig[n]
    if o is None: return "lo"                      # приямки
    if o == 730: return None                        # метки — отдельно
    if el.get("data-sys") == "heat" and "mp-floorloop" in ET.tostring(el, encoding="unicode"): return "lo"
    if o in LO: return "lo"
    if o in BOTH: return None
    return "hi"

# --- машины ---------------------------------------------------------------
COLORS = ["#d94a3f", "#3b6fd6", "#e9e9e6", "#2c2d31", "#f0b400", "#4f8f5f", "#8d929c", "#b9c2cf"]
DELAY = [0, -5.3, -2.1, -9.7, -3.6, -11.4, -7.2, -13.1]
BAYS = [2.5, 7.5, 12.5, 17.5, 26.5, 31.5, 36.5, 41.5]

def wheel(xc, yc, X, r=0.33):
    import math
    pts = [(X, yc + r * math.cos(t * math.pi / 8), r + r * math.sin(t * math.pi / 8)) for t in range(16)]
    return poly(*pts)

def car(b):
    xc = BAYS[b]; c = COLORS[b]
    x0, x1, y0, y1, z0, z1 = xc - .9, xc + .9, 1.3, 5.8, .25, .95
    cx0, cx1, cy0, cy1, cz1 = xc - .78, xc + .78, 2.4, 4.6, 1.45
    g = [f'<g class="sw-car" style="--d:{DELAY[b]}s;--car:{c}"><g class="sw-car-body">']
    g.append(f'<path class="car-shadow" d="{poly((x0-.1,y0-.1,0),(x1+.15,y0-.1,0),(x1+.15,y1+.1,0),(x0-.1,y1+.1,0))}"/>')
    g.append(f'<path class="car-face car-rear" d="{poly((x0,y0,z0),(x1,y0,z0),(x1,y0,z1),(x0,y0,z1))}"/>')
    g.append(f'<path class="car-face car-side" d="{poly((x1,y0,z0),(x1,y1,z0),(x1,y1,z1),(x1,y0,z1))}"/>')
    g.append(f'<path class="car-face car-top" d="{poly((x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1))}"/>')
    g.append(f'<path class="car-glass" d="{poly((cx0,cy0,z1),(cx1,cy0,z1),(cx1,cy0+.35,cz1),(cx0,cy0+.35,cz1))}"/>')
    g.append(f'<path class="car-glass car-glass-side" d="{poly((cx1,cy0,z1),(cx1,cy1,z1),(cx1,cy1-.3,cz1),(cx1,cy0+.35,cz1))}"/>')
    g.append(f'<path class="car-face car-roof" d="{poly((cx0,cy0+.35,cz1),(cx1,cy0+.35,cz1),(cx1,cy1-.3,cz1),(cx0,cy1-.3,cz1))}"/>')
    g.append(f'<path class="car-light" d="{poly((x0+.08,y0,.7),(x0+.38,y0,.7),(x0+.38,y0,.82),(x0+.08,y0,.82))}{poly((x1-.38,y0,.7),(x1-.08,y0,.7),(x1-.08,y0,.82),(x1-.38,y0,.82))}"/>')
    g.append(f'<path class="car-wheel" d="{wheel(xc, 2.05, x1 + .02)}{wheel(xc, 5.0, x1 + .02)}"/>')
    # пена во время мойки
    g.append(f'<path class="car-foam" d="{poly((x1,y0,z0+.1),(x1,y1,z0+.1),(x1,y1,z1),(x1,y0,z1))}{poly((x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1))}{poly((x0,y0,z0+.1),(x1,y0,z0+.1),(x1,y0,z1),(x0,y0,z1))}"/>')
    g.append("</g>")
    # брызги из пистолета: от левой стены к машине
    sx, sy = P(xc - 2.0, 3.9, 1.1); ex, ey = P(x0 - .05, 3.7, .8)
    g.append(f'<path class="car-spray" d="M{sx:.1f} {sy:.1f}L{ex:.1f} {ey:.1f}"/>')
    g.append("</g>")
    return "".join(g)

# вставка машины перед левой стеной следующего бокса (тогда правая перегородка закрывает машину правильно)
CAR_BEFORE = {270: 0, 306: 1, 342: 2, 378: 3, 580: 4, 616: 5, 652: 6, 682: 7}

out = []; last = 0
for n, el in enumerate(kids):
    p = pos[n]
    chunk_start = p
    if orig[n] in CAR_BEFORE:
        out.append(body[last:p]); out.append(car(CAR_BEFORE[orig[n]])); last = p
    ly = layer(n, el)
    if ly:
        # дописываем атрибут в открывающий тег
        tag_end = body.index(">", p)
        selfclose = body[tag_end - 1] == "/"
        ins_at = tag_end - 1 if selfclose else tag_end
        out.append(body[last:ins_at]); out.append(f' data-ly="{ly}"'); last = ins_at
out.append(body[last:])
newbody = "".join(out)

# метки: какой слой
PIN_LO = {14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 28}
PIN_BOTH = {3, 27}
def pin_tag(m):
    n = int(m.group(1))
    ly = "" if n in PIN_BOTH else (' data-ly="lo"' if n in PIN_LO else ' data-ly="hi"')
    return m.group(0) + ly
newbody = re.sub(r'<g class="mp-pin" data-pin="(\d+)"', pin_tag, newbody)

newsvg = svg[:head_end] + newbody + "</svg>"
ET.fromstring(newsvg)  # проверка XML
s = s[:i] + newsvg + s[j:]

# светофоры боксов: синхронно с машинами (красный — занято)
def tl_tag(m):
    cx = float(re.search(r'cx="([-\d.]+)"', m.group(0)).group(1))
    b = min(range(8), key=lambda q: abs(cx - P(BAYS[q] + 2.4, 0.1, 1.6)[0]))
    return m.group(0).replace("<circle", f'<circle style="--d:{DELAY[b]}s"', 1)
s, ntl = re.subn(r'<circle class="mp-tl"[^>]*/>', tl_tag, s)
print("traffic lights", ntl)
open(SRC, "w", encoding="utf-8").write(s)
print("ok")
