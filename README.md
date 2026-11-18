<!-- glassbox:start -->
<!-- Generated from glassbox.json by the Glassbox hub (npm run readme -- damclear). Edit glassbox.json, not this block. -->

<h1 align="center">DamClear</h1>

<p align="center"><b>How does a dam work?</b><br>A dam is a wall that holds back a lake, and the whole trick is pressure. See why the push grows with depth, how weight, arches and props answer it, how power is made, and how dams fail.</p>

<p align="center"><a href="https://glassbox.how/damclear/"><b>▶ Play with it</b></a> &nbsp;·&nbsp; <a href="https://glassbox.how/e/damclear/">Read the 60-second explainer</a></p>

<p align="center">
  <a href="https://glassbox.how/e/damclear/"><img alt="Glassbox No. 229" src="https://img.shields.io/badge/Glassbox-No.%20229-8ef0ff"></a>
  <a href="https://glassbox.how/e/damclear/"><img alt="Machines" src="https://img.shields.io/badge/field-Machines-ff7a59"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-3fb950"></a>
  <a href="LICENSE-CONTENT.md"><img alt="Content: CC BY 4.0" src="https://img.shields.io/badge/content-CC%20BY%204.0-ef9421"></a>
  <a href="#privacy"><img alt="Privacy: explained" src="https://img.shields.io/badge/privacy-explained-555"></a>
</p>

## In 60 seconds

1. **Pressure grows with depth.** Water pushes on a wall with a pressure of density times gravity times depth. It is zero at the surface and biggest at the bottom, so the load on a dam is a triangle. The total force per metre is half density times gravity times depth squared, and it acts one third of the way up. Double the depth and the force is four times bigger. The length of the lake does not matter.
2. **Weight, arches and props.** A gravity dam holds the lake with its own weight, using friction on the rock. An arch dam is a thin curve that turns the push sideways into the valley walls, so it needs a narrow gorge with strong rock. A buttress dam is a sloping deck on triangular walls. Water also seeps under a dam and pushes up, so drains and grout curtains keep that uplift low.
3. **Mounds that leak on purpose.** Most big dams are embankments of earth or rock. Water always seeps through them, so a core of clay blocks most of it and filter drains carry the rest out without taking soil along. Without a core, seepage can come out of the downstream face and start to wash soil away.
4. **Falling water makes power.** Water drops through a penstock to a turbine, which spins a generator. Power is efficiency times density times gravity times flow times head. Twice the head or twice the flow gives twice the power. A good modern turbine turns about 90 percent of the water energy into electricity.
5. **Spillways, silt and fish.** A reservoir is a bucket: its level changes with inflow minus outflow. A spillway passes floods safely down a chute to a stilling basin. Sediment settles in the still water and slowly fills the lake, and fish need a pass or a lift to get by. Some old dams are now taken down to free the river.
6. **How dams fail.** Dams fail in a few known ways. Water can go over the top, through the middle (piping, a tunnel that grows by erosion), or under the base (uplift on weak rock). St. Francis Dam in California failed in 1928 on a weak foundation, and at least 431 people died. Banqiao in China failed in a typhoon flood in 1975, with estimates of 26,000 to 240,000 deaths. Each failure changed how dams are checked.

## Words worth knowing

| Term | Meaning |
|---|---|
| **Hydrostatic pressure** | The pressure of still water: density times gravity times depth. |
| **Resultant force** | The single force equal to a whole spread-out load. For a dam it acts one third of the way up. |
| **Gravity dam** | A dam that resists the water by its own weight. |
| **Arch dam** | A thin curved dam that sends the water load sideways into the valley walls. |
| **Uplift** | Water pressure under a dam that pushes up and reduces friction. |
| **Phreatic line** | The top of the saturated zone of seepage inside an embankment. |
| **Head** | The height water falls from the lake to the turbine. |
| **Penstock** | The large pipe that carries water from the lake to the turbine. |
| **Spillway** | The safety valve that lets floods pass a dam. |
| **Piping** | Internal erosion that grows a tunnel through an embankment. |

## A short history

**From a desert wall in Jordan to the biggest power station on Earth, and the dams now coming down.**

- **2650 BCE** · A dam breaks before it is finished (Egyptian builders, Wadi al-Garawi, Egypt)
- **100** · Kallanai: a stone weir on the Kaveri (King Karikalan (by tradition), Tamil Nadu, India)
- **1300** · Persia builds the first big thin arch dams (Il-Khanid Mongol builders, Iran)
- **1882** · Appleton opens the Vulcan Street plant (H. J. Rogers, Appleton, Wisconsin, USA)
- **1928** · St. Francis Dam collapses (William Mulholland, California, USA)
- **1936** · Hoover Dam is finished (Frank Crowe and Six Companies, Nevada and Arizona, USA)
- **1963** · Vajont: the dam stands but the wave kills (Italian engineers, Veneto, Italy)
- **1975** · Banqiao and the typhoon flood (Typhoon Nina, Henan, China)

The full story, with 36 moments, charts, people and 49 sources: [glassbox.how/e/damclear/history](https://glassbox.how/e/damclear/history/). The data lives in [`history.json`](history.json).

## Privacy

This box has no accounts and no ads, and it ships its own fonts and libraries. When you run it yourself it sends nothing anywhere. On glassbox.how, the site's `/bar.js` also loads Glassbox's analytics: **Google Analytics** to count visits (it asks first in the EU, UK and Switzerland, and stays off when your browser sends Global Privacy Control or Do Not Track) and **ClickTrust** to detect bots.

It remembers a few things **in your own browser only**, and never sends them anywhere:

| Browser storage key | What it holds |
|---|---|
| `damclear.v1` | Which chapters you have opened, your best quiz scores, and sound on or off. |

Exactly what each one sees is at [glassbox.how/privacy](https://glassbox.how/privacy/).

## Licences

- **Code:** [MIT](LICENSE). Use it, change it, ship it.
- **Explanations, text, images and videos** (`glassbox.json`, `glassbox/`): [CC BY 4.0](LICENSE-CONTENT.md). Credit “Glassbox, glassbox.how/e/damclear”.
- **Third-party parts** keep their own licences: [three.js](https://threejs.org) (MIT), [Geist, Instrument Serif](https://openfontlicense.org) (SIL OFL 1.1).
- The Glassbox name and logo aren't covered by either licence. See the [terms](https://glassbox.how/terms/).

Found a mistake? [Open an issue](https://github.com/bdeeps/damclear/issues). Corrections happen in public.
<!-- glassbox:end -->

## Run it

It's plain HTML, CSS and JavaScript. No build step and no dependencies. Run locally, it contacts no other website.

```bash
python3 -m http.server 8000
```

Three.js and the fonts ship in `vendor/` and `fonts/`, so it also works offline.

Then open http://localhost:8000.

## How it's built

| File | What |
|---|---|
| `index.html`, `css/app.css` | The page and its styles |
| `js/app.js`, `js/stage.js`, `js/ui.js`, `js/kit.js` | The shared Glassbox 3D engine: chapters, 3D stage, controls, quiz, video director |
| `js/chapters/*.js` | One file per chapter: the 3D model, controls, text, key terms, quiz and video scenes |
| `glassbox.json` | Title, question, explainer beats, key terms, browser storage and credits shown on glassbox.how |
| `reel` in each chapter | The storyboard the Glassbox studio records into short videos |
| `glassbox/` | The published video, slides, thumbnail and post copy |
| `fonts/`, `vendor/three/` | Self-hosted Geist and Instrument Serif (SIL OFL 1.1) and three.js (MIT) |
