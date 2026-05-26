# Treasure Hunt — Five Challenges, Five Stories

For each challenge currently defined in `Website/src/content/treasure-hunt.json`, this document compiles:

1. **The challenge as-is** — what the player sees and what answer the app accepts.
2. **The story behind it** — historical context that should feed `feedback.correct` text, "Ask Luca" follow-ups, and any expanded-detail panel.
3. **A recommended image set** — marker (for AR hint), reveal (shown on a correct answer), and a small "look here" hint thumbnail. All verified public-domain or CC-licensed where indicated.

Each challenge currently has a `markerImage` path under `Website/public/markers/`; the recommended images below would supplement those for the **hint**, **reveal**, and **success-celebration** states.

---

## Challenge 1 — *The Golden Lady on Top*

**Landmark** · Duomo di Milano
**Type** · Photo
**Prompt** · "Take a photo of La Madonnina — the golden statue on top of the Duomo's tallest spire. Point your camera upward at the central spire."
**Marker image (in repo)** · `/markers/duomo-facade.jpg`
**Points** · 100

### The story

The **Madonnina** is a 4.16 m gilded copper statue of the Virgin Mary, placed on the central spire of the Duomo on **30 December 1774**. Her real name is *Maria Nascente* (Mary Newly-Born), and she stands **108.5 m above ground**. The sculptor was Giuseppe Perego and the goldsmith Giuseppe Bini; the gilding is renewed every few decades with thin sheets of gold leaf.

For nearly two centuries, an **unwritten Milanese rule** held that no Milanese building should rise above her. When the **Pirelli Tower** (127 m, 1960) broke the rule, the Milanese demanded — and got — a small replica of the Madonnina installed on its roof. The **UniCredit Tower** (231 m, 2011) did the same. She is now technically at the highest point of the city in three places at once.

A song from the early 20th century — *"O mia bela Madunina"* by Giovanni D'Anzi (1934) — became Milan's unofficial anthem.

> **Use this in app:** the `feedback.correct` already explains height and date well. Add the unwritten skyscraper-rule as a "Tell me more" reveal, and the D'Anzi song lyric as an optional audio Easter egg.

### Image set

| Slot | Image | Source | License |
|---|---|---|---|
| **Marker / hint** | Modern photo of the Duomo's central facade with the spire pointing up | [Wikimedia · Category:Duomo di Milano](https://commons.wikimedia.org/wiki/Category:Duomo_di_Milano) | CC-BY |
| **Reveal — close-up** | High-res close-up of the Madonnina statue itself, gilded against the sky | [Wikimedia · Category:Madonnina](https://commons.wikimedia.org/wiki/Category:Madonnina) | CC-BY |
| **Bonus — historical** | 1774 engraving of the statue being raised onto the spire | Civica Raccolta Bertarelli (Castello Sforzesco) · also on Wikimedia | PD |
| **Bonus — comparison** | Modern photo of the Pirelli Tower with its rooftop Madonnina replica | Wikimedia · search "Pirelli Tower Madonnina" | CC-BY |

Filename suggestions for `Website/src/assets/hunt/`:
```
madonnina-spire.jpg          ← marker / look-up cue
madonnina-closeup.jpg        ← reveal
madonnina-1774-engraving.jpg ← bonus
pirelli-replica.jpg          ← bonus
```

---

## Challenge 2 — *The Floor That Brings Luck*

**Landmark** · Galleria Vittorio Emanuele II
**Type** · Photo
**Prompt** · "Find the mosaic bull emblem on the Galleria floor and take a photo of it. Tip: look near the centre of the octagonal crossing."
**Marker image (in repo)** · `/markers/galleria-crossing.jpg`
**Points** · 120

### The story

At the centre of the Galleria's **octagonal crossing**, where the two arms of the arcade meet, four mosaic medallions carry the coats of arms of the four pre-unification Italian capitals:

- **Milan** — a red cross on a white field
- **Florence** — a red lily on a white field
- **Rome** — the Capitoline she-wolf with Romulus and Remus
- **Turin** — a prancing bull on a blue field

The mosaics were produced in Venice and laid in **1875–76**. They were a deliberate political statement: with the kingdom unified in 1861 and Rome added in 1870, the Galleria became a stone declaration of the new Italy's four capitals.

The **bull-spinning tradition** has no clear origin — it appears to have started in the late 19th or early 20th century. Tourists are told to plant a heel on the bull's testicles and **spin three times** for good luck. The wear on the marble has been so continuous and severe that the tile has been **re-cut and replaced multiple times** — most recently a complete restoration in **2015**.

The Galleria itself was designed by **Giuseppe Mengoni**, with construction from **1865 to 1877**. The architect died falling from his own scaffolding on **30 December 1877**, two days before the planned inauguration.

> **Use this in app:** the current `feedback.correct` is solid but very short. Add a follow-up reveal explaining the *four cities* meaning of the four mosaics (most tourists know about the bull but not its three companions), and a "Tell me more" panel on the spinning tradition with the 2015 restoration photo.

### Image set

| Slot | Image | Source | License |
|---|---|---|---|
| **Marker / hint** | Wide shot of the central octagon floor from above (or from a side café) | [Wikimedia · Category:Floor mosaics of the Galleria](https://commons.wikimedia.org/wiki/Category:Floor_mosaics_of_the_Galleria_Vittorio_Emanuele_II) | CC-BY |
| **Reveal — close-up** | Hi-res close-up of the bull mosaic itself | Same category | CC-BY |
| **Bonus — all four crests** | Composite or grid showing all four city emblems | Wikimedia category above | CC-BY |
| **Bonus — restoration** | News photos of the 2015 restoration | *Corriere della Sera* archive · also on Wikimedia | mixed |

Filename suggestions:
```
galleria-octagon-wide.jpg
galleria-bull-mosaic.jpg
galleria-four-cities-mosaic.jpg
galleria-2015-restoration.jpg
```

---

## Challenge 3 — *The Ballroom That Was Never Rebuilt*

**Landmark** · Palazzo Reale
**Type** · Photo
**Prompt** · "Enter Palazzo Reale and find the Sala delle Cariatidi — the bombed ballroom left unrestored since 1943. Take a photo of the room."
**Marker image (in repo)** · `/markers/palazzo-reale-facade.jpg`
**Points** · 100

### The story

The **Sala delle Cariatidi** was the great reception hall of Palazzo Reale, designed by **Giuseppe Piermarini** between 1773 and 1778, with 40 caryatid columns sculpted by Gaetano Callani. It was 46 m long and 17 m wide, lit by up to 5,000 candles during ceremonial evenings. Maria Theresa's son Ferdinand was married here in 1771; Napoleon's stepson Eugène de Beauharnais held court here as Viceroy of Italy from 1805.

On the night of **15 August 1943**, Allied incendiary bombs hit the palace. The wooden roof above the hall caught fire, and the vault and parts of the balcony collapsed. The caryatids themselves survived, blackened and damaged. After the war, **architects and the city deliberately chose not to restore the hall fully**. The damage was stabilised; the room was cleaned but the marks of fire and shrapnel were left visible, as a permanent memorial.

In **1953**, the still-blackened hall hosted Pablo Picasso's *Guernica* on its European tour. The pairing of the painting about war with a room destroyed by war became one of the most-discussed museum experiences of 20th-century Italy. *Guernica* itself remains under copyright until 2044, but **photographs of the empty hall**, before and after the bombing, are public domain.

Today the Palazzo is Milan's principal exhibition venue, drawing over 600,000 visitors a year for blockbuster shows.

> **Use this in app:** the current `feedback.correct` covers the basics; the **before/after pair** of the hall (Brogi photo c. 1900 versus today) would be the most emotional addition. Optional: a "Tell me more" reveal about the 1953 Guernica exhibition.

### Image set

| Slot | Image | Source | License |
|---|---|---|---|
| **Marker / hint** | Palazzo Reale facade from Piazza del Duomo | [Wikimedia · Category:Palazzo Reale (Milan)](https://commons.wikimedia.org/wiki/Category:Palazzo_Reale_(Milan)) | CC-BY |
| **Reveal — Sala delle Cariatidi today** | Modern photo showing the scarred caryatids | [Wikimedia · Category:Sala delle Cariatidi](https://commons.wikimedia.org/wiki/Category:Sala_delle_Cariatidi_(Milan)) | CC-BY |
| **Bonus — the before** | Brogi photo c. 1900 showing the hall intact | [Lombardia Beni Culturali · Brogi photograph](https://www.lombardiabeniculturali.it/fotografie/schede/IMM-LMD90-0000056/) | PD |
| **Bonus — wartime** | 1943 bombing-damage photos | Wikimedia · search "Milano bombardamenti 1943" | PD (state archive) |

Filename suggestions:
```
palazzo-facade.jpg
cariatidi-today.jpg          ← reveal
cariatidi-brogi-1900.jpg     ← before
palazzo-bombing-1943.jpg     ← wartime
```

---

## Challenge 4 — *When the First Stone Was Laid*

**Landmark** · Duomo di Milano
**Type** · Question
**Question** · "In what year did construction of the Duomo di Milano begin?"
**Accepted answer** · **1386** (the app also accepts "thirteen eighty-six", "1386 AD", "in 1386", "year 1386")
**Marker image (in repo)** · `/markers/duomo-facade.jpg`
**Points** · 80

### The story

On **5 August 1386**, Archbishop **Antonio da Saluzzo** initiated construction of a new cathedral to replace two older churches on the site, Santa Maria Maggiore and Santa Tecla. The project was political as much as religious: Duke **Gian Galeazzo Visconti** adopted it as a state enterprise, intending Milan to have a cathedral rivalling Cologne and Reims.

Choosing **Gothic** style was unusual for Lombardy, which had built in Romanesque for centuries. The cathedral's marble was — and still is — quarried from **Candoglia** in Piedmont, a site Visconti granted to the Fabbrica in perpetuity. The first chief architect was **Simone da Orsenigo**, whose plan all six centuries of construction would follow.

A dedicated institution, the **Veneranda Fabbrica del Duomo**, was founded in 1387 to manage construction. It is one of the longest-running building organisations in human history and **still operates today**.

The cathedral was declared "complete" in **1965**, when the final bronze door was installed, **579 years** after the first stone — though scaffolding remains permanently visible on some part of the building, and the Fabbrica still employs marble cutters, restorers, and sculptors.

> **Use this in app:** the current `feedback.correct` is good. A natural follow-up reveal: "How long did it take?" → "579 years" with a small timeline graphic.

### Image set

| Slot | Image | Source | License |
|---|---|---|---|
| **Marker / hint** | The Duomo's modern facade, the surface the player is looking at | [Wikimedia · Category:Duomo di Milano](https://commons.wikimedia.org/wiki/Category:Duomo_di_Milano) | CC-BY |
| **Reveal — historic plan** | Cesare Cesariano's 1521 architectural elevation — the earliest published technical drawing | Wikimedia · search "Cesariano Duomo" | PD |
| **Bonus — construction-era engraving** | 14th–15th century print showing the cathedral mid-construction | [Wikimedia · Category:Construction of Duomo di Milano](https://commons.wikimedia.org/wiki/Category:Construction_of_Duomo_di_Milano) | PD |
| **Bonus — Candoglia marble** | Modern photo of the AUF-marked Fabbrica trucks transporting marble | Wikimedia · search "Candoglia AUF" | mixed |

Filename suggestions:
```
duomo-facade-modern.jpg
cesariano-1521-plan.jpg
duomo-construction-engraving.jpg
candoglia-marble-truck.jpg
```

---

## Challenge 5 — *The Architect of the Arcade*

**Landmark** · Galleria Vittorio Emanuele II
**Type** · Question
**Question** · "Who is the architect that designed the Galleria Vittorio Emanuele II?"
**Accepted answer** · **Giuseppe Mengoni** (the app also accepts "mengoni", "g. mengoni", "mengoni giuseppe")
**Marker image (in repo)** · `/markers/galleria-crossing.jpg`
**Points** · 80

### The story

**Giuseppe Mengoni** (1829–1877) was a young architect from Fontanelice, near Bologna, when he won the 1860 national competition to design a covered passage between the Duomo and La Scala. His proposal — a **cross-shaped iron-and-glass arcade**, fusing Renaissance palazzo façades with the engineering language of London's Crystal Palace — was unlike anything Italy had built.

The first stone was laid on **7 March 1865** by King Vittorio Emanuele II in person, who would lend his name to the arcade. The **iron skeleton was prefabricated in London** by Henry Grissell's Regent's Canal Ironworks; the marble façades were cut and assembled by Milanese stonemasons. Construction lasted twelve years.

On the evening of **30 December 1877**, just two days before the formal inauguration, **Mengoni fell from the scaffolding** of the triumphal arch facing Piazza del Duomo. He died on the spot, aged 47. Whether the fall was accidental, a heart attack at altitude, or — as some whispered — suicide brought on by mounting financial pressures, has never been resolved.

The Galleria opened the following month and immediately became Milan's **social centre**. The Camparino bar at the Duomo end (founded 1867 by Gaspare Campari, father of Davide Campari) saw the birth of the **aperitivo** ritual. The Galleria is the world's **oldest still-operating shopping arcade**.

> **Use this in app:** the current `feedback.correct` covers dates well. The story of Mengoni's death deserves its own reveal — it's the kind of detail visitors remember for years. Pair it with a portrait of the architect.

### Image set

| Slot | Image | Source | License |
|---|---|---|---|
| **Marker / hint** | The Galleria's central octagonal crossing under the iron-and-glass dome | [Wikimedia · Category:Interior of Galleria Vittorio Emanuele II](https://commons.wikimedia.org/wiki/Category:Interior_of_the_Galleria_Vittorio_Emanuele_II_(Milan)) | CC-BY |
| **Reveal — portrait of Mengoni** | Period engraving or photograph of the architect | Wikimedia · search "Giuseppe Mengoni" | PD |
| **Reveal — original drawings** | Mengoni's 1861 competition entry — facade elevation and plan | [Wikimedia · Drawings of the Galleria](https://commons.wikimedia.org/wiki/Category:Drawings_of_Galleria_Vittorio_Emanuele_II) | PD |
| **Bonus — construction site** | Photo or print of the Galleria mid-construction, with scaffolding | [Wikimedia · Galleria construction images](https://commons.wikimedia.org/wiki/Category:Galleria_Vittorio_Emanuele_II) | PD |
| **Bonus — the fatal arch** | Photo of the triumphal arch facing Piazza del Duomo (where he fell) | Wikimedia · same category | CC-BY |

Filename suggestions:
```
galleria-octagon-dome.jpg
mengoni-portrait.jpg
mengoni-drawing-1861.jpg
galleria-construction.jpg
galleria-mengoni-arch.jpg
```

---

## Recommended changes to the JSON

The current `treasure-hunt.json` has `markerImage` only. I suggest extending each challenge with a small `media` block so the app can show different images at different states:

```jsonc
{
  "id": 1,
  // ... existing fields ...
  "media": {
    "hint":   "/hunt/madonnina-spire.jpg",         // shown alongside the prompt
    "reveal": "/hunt/madonnina-closeup.jpg",       // shown on a correct answer
    "bonus":  ["/hunt/madonnina-1774-engraving.jpg",
               "/hunt/pirelli-replica.jpg"]        // "Tell me more" panel
  }
}
```

If you add the JPEGs to `Website/public/hunt/`, I can:

1. Update the `RawChallenge` interface in `TreasureHunt.tsx` to include the `media` field.
2. Wire the **hint image** into the challenge prompt panel.
3. Wire the **reveal image** into the correct-answer success state (the "Well done!" panel).
4. Add an optional **"Tell me more"** drawer that shows the bonus images with their captions.

This would turn the treasure hunt from a mostly-text experience into a properly **visual** one — which is the spirit of a tourist app on a phone in front of a 600-year-old cathedral.

---

## Summary table — what to download first

If you grab eight files, you'll have full visual coverage of the hunt:

| Challenge | Must-have image | Where |
|---|---|---|
| 1 · Madonnina | Madonnina close-up (modern hi-res) | [Wikimedia · Madonnina](https://commons.wikimedia.org/wiki/Category:Madonnina) |
| 1 · bonus | 1774 raising engraving | Bertarelli archive via Wikimedia |
| 2 · Bull | Mosaic bull close-up | [Wikimedia · Galleria mosaics](https://commons.wikimedia.org/wiki/Category:Floor_mosaics_of_the_Galleria_Vittorio_Emanuele_II) |
| 3 · Cariatidi | Modern photo (the after) | [Wikimedia · Sala delle Cariatidi](https://commons.wikimedia.org/wiki/Category:Sala_delle_Cariatidi_(Milan)) |
| 3 · Cariatidi | Brogi 1900 photo (the before) | [Lombardia Beni Culturali](https://www.lombardiabeniculturali.it/fotografie/schede/IMM-LMD90-0000056/) |
| 4 · 1386 | Cesariano 1521 elevation | Wikimedia · search Cesariano |
| 5 · Mengoni | Portrait of the architect | Wikimedia · Giuseppe Mengoni |
| 5 · Mengoni | Original Galleria competition drawing | Wikimedia · Drawings of the Galleria |

---

*Document created for HeritEdge · Polimi MITA · Piazza del Duomo project.*
