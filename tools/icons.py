# Makes simple app icons: dark blue square, gold check badge, "LSA".
from PIL import Image, ImageDraw, ImageFont
import os
os.makedirs('site/icons', exist_ok=True)
def make(n, pad, name):
    im = Image.new('RGB', (n, n), '#10202e'); d = ImageDraw.Draw(im)
    r = n * (0.5 - pad); c = n / 2
    d.ellipse([c - r, c - r, c + r, c + r], fill='#ffd257')
    w = max(2, int(n * 0.06))
    d.line([(c - r * .5, c), (c - r * .1, c + r * .4), (c + r * .55, c - r * .45)], fill='#10202e', width=w, joint='curve')
    im.save('site/icons/' + name + '.png')
make(192, .12, 'icon-192'); make(512, .12, 'icon-512'); make(192, .25, 'maskable-192'); make(512, .25, 'maskable-512'); make(180, .12, 'apple-touch-icon')
