# Course hero from a photo

Give this file to ChatGPT (or any image tool) together with **a photo of a hole on the course**. If you have it, also attach one of our existing painted heroes (for example the New England region hero) as a style example. Optionally add one line saying which course and hole it is.

---

## Instructions for the image model

You'll receive a photo of a real golf hole. Turn it into a **hand-painted illustration** of that same hole, in the art style below, for the header image of a golf app's course page.

### 1. Keep the real hole

- Keep the hole recognizable to someone who plays it: the same shape of fairway and green, terrain, tree lines, water, bunkers and buildings, in roughly the same positions as in the photo.
- Simplify fine detail into broad painted shapes. Don't trace or filter the photo: it must look painted, not like a photo with an effect.

### 2. Paint it in this style

Hand-painted gouache illustration with visible brushwork and subtle paper texture, bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Golf scenery with windswept trees and wildflowers in orange, pink and yellow. A small orange flag pennant is the only bright accent. Premium, crafted, collectible feel.

If a painted style example is attached, match its brushwork, palette and light closely.

### 3. Composition

- **Wide landscape, 3:2.** Eye-level view looking down the hole toward the green.
- **A green with a flagstick and a small orange pennant** in the middle distance.
- **Top third: calm, open sky.** The app's status bar and buttons sit over it.
- **Main subject (green, flag, key landmark) in the middle band.** The image is also cropped to a thin horizontal strip through the middle for small cards.
- **Bottom ~15%: nothing important** (simple fairway or rough). It fades into the page.
- Bright, warm daylight, whatever the season or weather in the photo.

### 4. Leave out

People, golf carts, cars, signs, text, logos, flags with writing, yardage markers, tee markers, power lines, fences with signage, watermarks, signatures. No photorealism, no 3D-render look, no neon or oversaturated greens, no borders or frames.

### 5. Output

- Generate a **3:2 landscape** image (e.g. 1536 × 1024).
- Then resize it to **exactly 1290 × 860 pixels** (same 3:2 ratio, no cropping, no padding) and give me that as a **PNG**.
- Name the file `hero.png`.

---

## After you get the image

Send it to Claude with the course name (or save it yourself as `assets/art/courses/<course-id>/hero.png` and run `npm run art:sync`). The course page uses it right away, and every other course keeps its region's painting.

**Quick check before using it:**
- [ ] Someone who plays the course would recognize the hole.
- [ ] It looks painted like our other heroes, not like a filtered photo.
- [ ] Calm sky across the top, subject in the middle, nothing important at the bottom.
- [ ] No people, carts, signs, text or logos.
- [ ] 1290 × 860 PNG.

**If it isn't right, tell the model:**
- *Looks like a photo:* "Looser, broader brushwork; simplify the trees into painted masses."
- *The layout drifted:* "Keep the pond front-left of the green, as in the photo" (name the landmark and where it should be).
- *Too dark or moody:* "Bright late-summer afternoon light."
- *Subject too high or low:* "Put the horizon about 40% from the top."
