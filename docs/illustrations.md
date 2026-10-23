# 插图资源

使用内置 imagegen 生成；保留透明通道，使用项目已有的 sharp 转换为 WebP，未增加依赖。

- `public/illustrations/window-desk.webp`：首页右侧简介上方的小景，672 × 384。装饰性图片使用空 alt，避免重复朗读。
- `public/illustrations/quiet-web.webp`：《让网页安静下来》“让静态内容保持简单”一节的说明图，1200 × 600，提供替代文本与图注。

两图均通过 next/image 预留宽高。首页小图在移动端宽 144px，桌面端宽 224px；文章图不超出正文栏。
首页线稿在深色模式下提高亮度并降低饱和度，浅色模式保留原图。不新增动效。

## 最终生成提示词

### 窗边书桌

Minimal vector-like LINE ART ONLY of a desk with an open notebook, closed laptop, and small window above. Thin medium slate-blue strokes and a single muted dusty-rose bookmark. NO FILLS anywhere: ALL areas between the lines must be fully transparent alpha including inside window and below desk. Absolutely no light, no white wash, no atmospheric haze, no grey blob, no glowing edges, no fuzzy edge, no soft shading, no shadow, no gradients, no opaque background. This is a clean ink drawing to overlay directly on a web page, not a scene rendering. Every mark is a sharp solid thin blue-gray pen line. Window is empty rectangles in line art. Open notebook page is outline with a few short strokes. Desk is slender clean outline. Lots of empty transparent breathing room. No chair. No text. Wide composition.

### 减少网页请求

Use case: illustration-story.
Asset type: in-article editorial illustration for a Chinese technical essay about reducing unnecessary web work.
Primary request: show an isolated left-to-right visual metaphor: a small loose stack of browser-page sheets with tangled thin paths and a few small script/image tiles on the left, paths becoming just one clear short line in the center, ending in one clean open reading page on the right. No arrows pointing in the wrong direction. The right page has only a few abstract horizontal text marks and a generous empty reading area. No literal text.
Style/medium: quiet Japanese editorial pen drawing with sparse flat matte fills, elegant slender lines, very simple and legible. Related to a window-side writer's desk illustration, but this is an abstract explanatory scene.
Composition: wide horizontal approximately 2:1, shapes kept in the center with generous breathing space, legible at 335px wide. Actual transparent background, including all surrounding empty areas and spaces between objects.
Palette: medium slate blue outlines #65759B, cool blue-gray #A0ABC8, pale blue-gray #C6CDE0, tiny dusty rose #CDAFBE detail, low saturation.
Constraints: absolutely no shading outside objects, NO glow, NO haze, NO blur, NO vignette, NO gradient, NO shadows, NO halo; fully transparent clean background, use flat opaque fills INSIDE objects only. No large solid background rectangle. No green, orange or rainbow accents. No people, no rockets, no clocks, no lightning bolts. No text, no logos or watermarks.
