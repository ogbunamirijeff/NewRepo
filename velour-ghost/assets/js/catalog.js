/* =========================================================================
   VELOUR GHOST — CATALOG
   CMS-ready content model. Each object maps 1:1 to a headless-CMS entry
   (Sanity / Contentful / Shopify metafields). See README.md for schema.

   Product images: leave `images` null to use the generated artwork, or
   provide real photography:
     images: { front: '/img/x-front.jpg', back: '/img/x-back.jpg',
               detail: '/img/x-detail.jpg', plate: '/img/x-plate.jpg' }
   ========================================================================= */
window.VG_CATALOG = {
  currency: 'USD',

  chapters: [
    {
      slug: 'the-creatures', num: 'I', code: '001', title: 'The Creatures', theme: 'creatures', cover: 'masquerade',
      line: 'Mysterious beings, ancient guardians and creatures existing between mythology and the unknown.',
      intro: 'Six figures recovered from the margins of memory — guardians that stood at the edge of the village, things that moved beneath the lagoon, a face older than every name given to it. Each is rendered as a wearable artefact. None of them asked to be seen.'
    },
    {
      slug: 'forbidden-science', num: 'II', code: '002', title: 'Forbidden Science', theme: 'science', cover: 'specimen',
      line: 'Extraterrestrial biology, unidentified organisms, strange anatomy and speculative technology.',
      intro: 'A collection assembled from a file that was never meant to be opened. Specimens in jars, signals without origin, organisms that obey a symmetry no textbook describes. Every garment carries its classification number. Some of the records are incomplete. That is deliberate.'
    },
    {
      slug: 'body-of-horror', num: 'III', code: '003', title: 'Body of Horror', theme: 'body', cover: 'heart',
      line: 'Human anatomy, skeletal structures, organs and the relationship between beauty and mortality.',
      intro: 'The body, examined down to the bone. Ribs as architecture, a heart with roots, a spine missing one segment, a hand with one finger too many. Engraved in the language of the old anatomy theatres — beauty, and the quiet arithmetic of mortality.'
    },
    {
      slug: 'experimental-typography', num: 'IV', code: '004', title: 'Experimental Typography', theme: 'type', cover: 'illegible',
      line: 'Oversized, distorted, deconstructed letterforms and unconventional graphic compositions.',
      intro: 'Language pushed past legibility. Letterforms stretched, sliced, misregistered and examined until they stop meaning and start looking back.'
    }
  ],

  products: [
    /* ---------- CHAPTER I ---------- */
    {
      slug: 'the-last-masquerade', name: 'The Last Masquerade', chapter: 'the-creatures', code: 'VG-C-001', art: 'masquerade',
      garment: 'hoodie', price: 240, edition: 150, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: ['XS'],
      detail: [250, 160, 300, 300], images: null,
      description: 'A guardian draped in a thousand strands, its face carved into a field of contour lines. The last to leave before the lights went out. The crown of quills is printed at hairline weight; a single tier of the fringe is struck in blood red.',
      fabric: ['520gsm brushed-back cotton fleece', 'Garment-dyed, enzyme washed', 'Water-based discharge print, bone ink', 'Double-layer hood, flat waxed drawcords', 'Made in limited runs. Each piece numbered at dispatch.'],
      fit: 'Oversized with a dropped shoulder and long body. Take your usual size for the intended drape; size down for a closer fit.'
    },
    {
      slug: 'coil', name: 'Coil', chapter: 'the-creatures', code: 'VG-C-002', art: 'coil',
      garment: 'tee', price: 110, edition: 200, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [80, 560, 340, 340], images: null,
      description: 'Four and a quarter turns of a body without beginning. Its granulated edge is a quiet nod to the coiled bronze work of the Lower Niger — patient, precise, ancient. It does not bite. It waits.',
      fabric: ['280gsm heavyweight combed cotton jersey', 'Pre-shrunk, garment-dyed', 'Screen printed, bone and blood-red inks', 'Taped neck seam, ribbed collar'],
      fit: 'Boxy, slightly cropped body with dropped shoulders. True to size.'
    },
    {
      slug: 'the-leopard', name: 'The Leopard', chapter: 'the-creatures', code: 'VG-C-003', art: 'leopard',
      garment: 'longsleeve', price: 145, edition: 150, colors: ['black', 'blood'], sizes: ['S', 'M', 'L', 'XL'], soldOut: [],
      detail: [250, 260, 300, 300], images: null,
      description: 'Three eyes. One sewn shut. The leopard has always been a keeper of secrets; this one keeps a few of its own. Printed with phosphor-green eyes that hold the light a fraction longer than they should.',
      fabric: ['240gsm cotton jersey', 'Long sleeves with 8cm ribbed cuffs', 'Screen printed, phosphor-green accent ink', 'Garment-dyed'],
      fit: 'Relaxed through the body, extended sleeves designed to stack at the wrist.'
    },
    {
      slug: 'lagoon-beast', name: 'Lagoon Beast', chapter: 'the-creatures', code: 'VG-C-004', art: 'lagoon',
      garment: 'tee', price: 115, edition: 200, colors: ['black'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: ['XXL'],
      detail: [120, 330, 420, 420], images: null,
      description: 'Something long moves beneath the lagoon at the hour the city forgets to look. Its reflection arrives before it does. In the distance, more of it — further than it should reasonably extend.',
      fabric: ['280gsm heavyweight combed cotton jersey', 'Pre-shrunk, garment-dyed', 'Screen printed, bone ink with green eye', 'Taped neck seam'],
      fit: 'Boxy, slightly cropped body with dropped shoulders. True to size.'
    },
    {
      slug: 'zuma-titan', name: 'Zuma Titan', chapter: 'the-creatures', code: 'VG-C-005', art: 'zuma',
      garment: 'hoodie', price: 230, edition: 120, colors: ['black', 'bone'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [250, 400, 300, 300], images: null,
      description: 'A granite face older than every name given to it, streaked by ten thousand rains. It has watched the road for longer than the road has existed. The small figure at its foot is for scale.',
      fabric: ['520gsm brushed-back cotton fleece', 'Garment-dyed, enzyme washed', 'Water-based discharge print', 'Double-layer hood, flat waxed drawcords'],
      fit: 'Oversized with a dropped shoulder and long body.'
    },
    {
      slug: 'night-rider', name: 'Night Rider', chapter: 'the-creatures', code: 'VG-C-006', art: 'rider',
      garment: 'jacket', price: 420, edition: 60, colors: ['black'], sizes: ['S', 'M', 'L', 'XL'], soldOut: [],
      detail: [100, 300, 360, 360], images: null,
      description: 'Out of the festival dust and into the moon: a horseman in quilted armour, his horse a little too tall, his pennant the colour of old blood. Full back print, embroidered chest mark, tonal hardware.',
      fabric: ['Waxed cotton canvas shell, 12oz', 'Quilted satin lining', 'Two-way metal zip, tonal snaps', 'Full back print with embroidered chest code', 'Edition of 60'],
      fit: 'Structured, slightly boxy work-jacket fit. Sits at the hip. True to size; size up to layer over a hoodie.'
    },

    /* ---------- CHAPTER II ---------- */
    {
      slug: 'specimen-001', name: 'Specimen 001', chapter: 'forbidden-science', code: 'VG-FS-001', art: 'specimen',
      garment: 'tee', price: 120, edition: 200, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [280, 380, 300, 300], images: null,
      description: 'Recovered 1987. Origin unknown. The label on the jar says do not open, and so far, no one has. Printed with an archival specimen label and a measurement scale down the side seam.',
      fabric: ['280gsm heavyweight combed cotton jersey', 'Screen printed, three inks', 'Taped neck seam', 'Specimen tag woven at hem'],
      fit: 'Boxy, slightly cropped body with dropped shoulders. True to size.'
    },
    {
      slug: 'the-first-contact', name: 'The First Contact', chapter: 'forbidden-science', code: 'VG-FS-002', art: 'contact',
      garment: 'longsleeve', price: 150, edition: 150, colors: ['black', 'bone'], sizes: ['S', 'M', 'L', 'XL'], soldOut: [],
      detail: [250, 300, 300, 300], images: null,
      description: 'Signal 77, 03:17:44. One hand with six fingers and too many joints; one hand that did not pull away. The space between them is the only thing printed in phosphor green.',
      fabric: ['240gsm cotton jersey', 'Long sleeves with ribbed cuffs', 'Screen printed with phosphor-green accent', 'Garment-dyed'],
      fit: 'Relaxed through the body, extended sleeves.'
    },
    {
      slug: 'unknown-organism', name: 'Unknown Organism', chapter: 'forbidden-science', code: 'VG-FS-003', art: 'organism',
      garment: 'hoodie', price: 235, edition: 120, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [250, 350, 300, 300], images: null,
      description: 'Radial symmetry, one to eleven. Four hundred pores, eighteen spines and a single eye at its centre that remains — according to the file — open.',
      fabric: ['520gsm brushed-back cotton fleece', 'Garment-dyed', 'High-density screen print', 'Double-layer hood'],
      fit: 'Oversized with a dropped shoulder and long body.'
    },
    {
      slug: 'anatomy-of-the-unknown', name: 'Anatomy of the Unknown', chapter: 'forbidden-science', code: 'VG-FS-004', art: 'anatomy',
      garment: 'tee', price: 120, edition: 200, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: ['XS', 'S'],
      detail: [300, 380, 260, 260], images: null,
      description: 'Fig. 3. Two hearts, one vestigial. A spiral gut. Thirty-one vertebrae. An unknown gland whose purpose the annotator declined to guess. Printed as a full technical plate.',
      fabric: ['280gsm heavyweight combed cotton jersey', 'Screen printed, three inks', 'Taped neck seam'],
      fit: 'Boxy, slightly cropped. True to size.'
    },
    {
      slug: 'classified-biology', name: 'Classified Biology', chapter: 'forbidden-science', code: 'VG-FS-005', art: 'classified',
      garment: 'jacket', price: 395, edition: 60, colors: ['black'], sizes: ['S', 'M', 'L', 'XL'], soldOut: [],
      detail: [170, 140, 460, 460], images: null,
      description: 'File 7 of 7. Declassification date: never. A redacted document printed across the back of a waxed work jacket — most of what matters is under the black bars.',
      fabric: ['Waxed cotton canvas shell, 12oz', 'Quilted satin lining', 'Two-way metal zip', 'Full back print, embroidered chest code', 'Edition of 60'],
      fit: 'Structured, slightly boxy work-jacket fit. True to size.'
    },

    /* ---------- CHAPTER III ---------- */
    {
      slug: 'ossuary', name: 'Ossuary', chapter: 'body-of-horror', code: 'VG-BH-001', art: 'ribcage',
      garment: 'tee', price: 115, edition: 200, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [250, 260, 300, 300], images: null,
      description: 'Twenty-four ribs and the faint red shape of what they were built to protect. Printed to sit exactly where your own ribcage sits.',
      fabric: ['280gsm heavyweight combed cotton jersey', 'Screen printed, bone and blood-red', 'Taped neck seam'],
      fit: 'Boxy, slightly cropped. True to size.'
    },
    {
      slug: 'cardiac', name: 'Cardiac', chapter: 'body-of-horror', code: 'VG-BH-002', art: 'heart',
      garment: 'hoodie', price: 235, edition: 120, colors: ['black', 'blood'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [270, 300, 300, 300], images: null,
      description: 'A heart that has grown roots. Engraved contour by contour in the manner of the old anatomy plates, its vessels trailing down into the hem. Seventy-two per minute.',
      fabric: ['520gsm brushed-back cotton fleece', 'Garment-dyed', 'Discharge print with blood-red overprint', 'Double-layer hood'],
      fit: 'Oversized with a dropped shoulder and long body.'
    },
    {
      slug: 'vertebra', name: 'Vertebra', chapter: 'body-of-horror', code: 'VG-BH-003', art: 'spine',
      garment: 'longsleeve', price: 145, edition: 150, colors: ['black', 'bone'], sizes: ['S', 'M', 'L', 'XL'], soldOut: [],
      detail: [250, 350, 300, 300], images: null,
      description: 'Twenty-six segments. One missing. One marked. Nerves branching out across the chest like roots in search of water.',
      fabric: ['240gsm cotton jersey', 'Long sleeves, ribbed cuffs', 'Screen printed', 'Garment-dyed'],
      fit: 'Relaxed through the body, extended sleeves.'
    },
    {
      slug: 'the-orbit', name: 'The Orbit', chapter: 'body-of-horror', code: 'VG-BH-004', art: 'eye',
      garment: 'tee', price: 115, edition: 200, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [40, 700, 280, 280], images: null,
      description: 'A cross-section of the eye, lens to optic nerve — and in the corner, an iris with a slit pupil that no human has. Look closer. It already has.',
      fabric: ['280gsm heavyweight combed cotton jersey', 'Screen printed, three inks', 'Taped neck seam'],
      fit: 'Boxy, slightly cropped. True to size.'
    },
    {
      slug: 'carpal', name: 'Carpal', chapter: 'body-of-horror', code: 'VG-BH-005', art: 'hand',
      garment: 'tee', price: 110, edition: 200, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [380, 480, 300, 300], images: null,
      description: 'Plate 6. Twenty-seven bones and four more that should not be there. Count the fingers twice.',
      fabric: ['280gsm heavyweight combed cotton jersey', 'Screen printed, bone and blood-red', 'Taped neck seam'],
      fit: 'Boxy, slightly cropped. True to size.'
    },

    /* ---------- CHAPTER IV ---------- */
    {
      slug: 'illegible', name: 'Illegible', chapter: 'experimental-typography', code: 'VG-ET-001', art: 'illegible',
      garment: 'tee', price: 105, edition: 250, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [100, 300, 400, 400], images: null,
      description: 'A word sliced into twenty-two strips and shuffled until it stopped being a word. Read at your own risk.',
      fabric: ['280gsm heavyweight combed cotton jersey', 'High-density screen print', 'Taped neck seam'],
      fit: 'Boxy, slightly cropped. True to size.'
    },
    {
      slug: 'no-signal', name: 'No Signal', chapter: 'experimental-typography', code: 'VG-ET-002', art: 'signal',
      garment: 'longsleeve', price: 140, edition: 150, colors: ['black'], sizes: ['S', 'M', 'L', 'XL'], soldOut: [],
      detail: [150, 300, 400, 400], images: null,
      description: 'Transmission lost at 03:17. Nine repetitions of the same two words, fading in and out of a broken broadcast.',
      fabric: ['240gsm cotton jersey', 'Long sleeves, ribbed cuffs', 'Screen printed', 'Garment-dyed'],
      fit: 'Relaxed through the body, extended sleeves.'
    },
    {
      slug: 'misregistered', name: 'Misregistered', chapter: 'experimental-typography', code: 'VG-ET-003', art: 'misreg',
      garment: 'hoodie', price: 225, edition: 120, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [80, 120, 400, 400], images: null,
      description: 'Two print plates, zero alignment. The name of the house scattered and struck twice — once in bone, once in blood — exactly the wrong distance apart.',
      fabric: ['520gsm brushed-back cotton fleece', 'Two-plate screen print, intentionally offset', 'Double-layer hood'],
      fit: 'Oversized with a dropped shoulder and long body.'
    },
    {
      slug: 'letterform-004', name: 'Letterform 004', chapter: 'experimental-typography', code: 'VG-ET-004', art: 'letterform',
      garment: 'tee', price: 105, edition: 250, colors: ['black', 'bone'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], soldOut: [],
      detail: [250, 380, 300, 300], images: null,
      description: 'The construction drawing for the eye — the lowercase o at the centre of the house mark — with its baseline, its handles and its slit. A type specimen for a letter that watches.',
      fabric: ['280gsm heavyweight combed cotton jersey', 'Phosphor-green screen print', 'Taped neck seam'],
      fit: 'Boxy, slightly cropped. True to size.'
    }
  ],

  /* THE ARCHIVE — research records. `product` links to a piece when one exists. */
  archive: [
    { id: 'VG-0001', name: 'The Last Masquerade', art: 'masquerade', classification: 'Guardian / Ancestral entity', origin: 'Forest belt, south-east. Seen at dusk.', status: 'Dormant', product: 'the-last-masquerade', year: '—', description: 'Observed only at the edge of gatherings, never within them. Its face carries no expression because it is the expression. Witnesses agree it was taller on the way out.' },
    { id: 'VG-0002', name: 'Coil', art: 'coil', classification: 'Serpentine / Ouroboric', origin: 'Lower Niger basin. Excavation layer IV.', status: 'Contained', product: 'coil', year: 'c. 9th C. form', description: 'A body of no fixed length recorded in coiled form only. When uncoiled for measurement the figure did not match the previous measurement. It has not been uncoiled since.' },
    { id: 'VG-0003', name: 'The Leopard', art: 'leopard', classification: 'Feline / Keeper of secrets', origin: 'Cross River rainforest canopy', status: 'Under observation', product: 'the-leopard', year: '—', description: 'Three eyes, one deliberately closed by an unknown hand. Field notes record that the stitches were renewed between visits.' },
    { id: 'VG-0004', name: 'Lagoon Beast', art: 'lagoon', classification: 'Aquatic / Colossal', origin: 'Lagoon, 14m depth, west of the third bridge', status: 'At large', product: 'lagoon-beast', year: '1996 — present', description: 'Head length estimated at 9 metres from reflection alone. Additional humps recorded 600 metres away on the same evening; it is assumed these belong to the same animal.' },
    { id: 'VG-0005', name: 'Zuma Titan', art: 'zuma', classification: 'Lithic / Monumental', origin: 'Granite monolith, north-central plateau', status: 'Awake', product: 'zuma-titan', year: 'Pre-history', description: 'Not a creature in the conventional sense. Records describe the face as having been there before the stone. Night-time photographs show light in the eyes that no surveyor could account for.' },
    { id: 'VG-0006', name: 'Night Rider', art: 'rider', classification: 'Mounted / Ceremonial', origin: 'Northern plains, festival season', status: 'Recurring', product: 'night-rider', year: 'Annual', description: 'Appears at the close of the festival, after the last of the horsemen have dispersed. The horse leaves tracks approximately twice the expected stride.' },
    { id: 'VG-0101', name: 'Specimen 001', art: 'specimen', classification: 'Cephalopod-adjacent / Non-terrestrial', origin: 'Recovered 1987. Site redacted.', status: 'Contained', product: 'specimen-001', year: '1987', description: 'Five eyes, nine to eleven prehensile limbs (count varies by observer). Suspended in an unknown preserving fluid that does not evaporate.' },
    { id: 'VG-0102', name: 'Specimen 002', art: 'specimen', seed: 4, variant: 2, jarLabel: 'SPECIMEN 002', classification: 'Cephalopod-adjacent / Juvenile', origin: 'Recovered 1987. Same site.', status: 'Missing', product: null, year: '1987', description: 'Catalogued alongside Specimen 001. The jar was found intact and empty during the 2004 audit. The lid had not been opened.' },
    { id: 'VG-0103', name: 'Signal 77', art: 'contact', classification: 'Event / First contact', origin: 'Receiving station, 03:17:44', status: 'Classified', product: 'the-first-contact', year: '1977', description: 'A transmission lasting 72 seconds with no identifiable origin. Recorded alongside a sketch made by the operator, reproduced here. The operator did not return the following night.' },
    { id: 'VG-0104', name: 'Unknown Organism U-01', art: 'organism', classification: 'Radiolarian-type / Sentient?', origin: 'Deep-sea sediment core', status: 'Under observation', product: 'unknown-organism', year: '2011', description: 'Microscopic in sample, enormous in the plate. The central structure resembles an eye. It tracks the light source used to photograph it.' },
    { id: 'VG-0105', name: 'Organism B-7', art: 'organism', seed: 7, variant: 3, code: 'B-7', classification: 'Radiolarian-type / Colonial', origin: 'Deep-sea sediment core, sample B', status: 'Deceased', product: null, year: '2011', description: 'Sibling sample to U-01. Ceased to respond after 41 days in observation. Its eye remained open.' },
    { id: 'VG-0106', name: 'Anatomy of the Unknown', art: 'anatomy', classification: 'Humanoid / Dissection record', origin: 'Annotated plate, Room B', status: 'Classified', product: 'anatomy-of-the-unknown', year: '—', description: 'Two hearts, one vestigial. Thirty-one vertebrae. One gland that the annotator declined to name. The plate is unsigned.' },
    { id: 'VG-0107', name: 'File 7/7', art: 'classified', classification: 'Document / Redacted', origin: 'Records office, sub-level', status: 'Sealed', product: 'classified-biology', year: 'Never', description: 'The only page of seven to be recovered. Approximately 34% of its text is legible. None of the legible text is useful.' },
    { id: 'VG-0201', name: 'Ossuary', art: 'ribcage', classification: 'Human / Skeletal study', origin: 'Anatomy theatre, Plate 2', status: 'Preserved', product: 'ossuary', year: '—', description: 'A study of the ribcage as architecture: twenty-four ribs, one sternum, and the faint red memory of the organ they housed.' },
    { id: 'VG-0202', name: 'Cardiac', art: 'heart', classification: 'Human / Organ study', origin: 'Anatomy theatre, Plate 11', status: 'Beating', product: 'cardiac', year: '—', description: 'The vessels below the apex were drawn as roots by the original engraver. When asked why, the engraver said: that is what they are.' },
    { id: 'VG-0203', name: 'Vertebra', art: 'spine', classification: 'Human / Skeletal study', origin: 'Anatomy theatre, Plate 4', status: 'Incomplete', product: 'vertebra', year: '—', description: 'Twenty-six segments of an expected twenty-seven. The missing segment has never been located.' },
    { id: 'VG-0204', name: 'The Orbit', art: 'eye', classification: 'Human? / Ocular study', origin: 'Anatomy theatre, Plate 9', status: 'Watching', product: 'the-orbit', year: '—', description: 'A standard cross-section of the human eye. The inset iris is not standard. Its pupil is vertical.' },
    { id: 'VG-0205', name: 'Carpal', art: 'hand', classification: 'Human / Polydactyl study', origin: 'Anatomy theatre, Plate 6', status: 'Preserved', product: 'carpal', year: '—', description: 'A hand with six digits, drawn without comment. The sixth is circled in red in a different ink, by a different hand.' },
    { id: 'VG-0206', name: 'Study for a Face', art: 'skull', classification: 'Human / Cranial study', origin: 'Anatomy theatre, Plate 1', status: 'Archived', product: null, year: '—', description: 'Study for a face that remains. The first plate in the anatomy series, and the only one never released as a garment. Two faint lights in the sockets were added later.' },
    { id: 'VG-0301', name: 'Letterform 004 — The Eye', art: 'letterform', classification: 'Glyph / House mark', origin: 'Type laboratory', status: 'Active', product: 'letterform-004', year: '—', description: 'The construction drawing for the lowercase o at the centre of the VELOUR GHOST mark. It is the only letter in the house alphabet with a pupil.' },
    { id: 'VG-0302', name: 'Illegible', art: 'illegible', classification: 'Glyph / Deconstruction', origin: 'Type laboratory', status: 'Unreadable', product: 'illegible', year: '—', description: 'Twenty-two strips of one word, rearranged by hand. A reading test that no participant has passed.' },
    { id: 'VG-0303', name: 'No Signal', art: 'signal', classification: 'Transmission / Lost', origin: 'Broadcast, 03:17', status: 'Lost', product: 'no-signal', year: '—', description: 'The last frame of a broadcast that ended at the same time Signal 77 began. Coincidence has not been ruled out. It has not been ruled in either.' }
  ]
};
