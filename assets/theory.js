/* Shared music-theory data + helpers, used by the theory pages and the instrument charts.
   Loaded as a classic <script>, so every top-level const/function here is a global
   that page scripts can use directly (CHROMATIC, spellNote, SCALES, MODES, ...). */

/* ---------- Core note data ---------- */
// All 12 pitch classes in chromatic order (sharps only); array index doubles as a 0-11 pitch number.
const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
// Root choices offered in the explorers: the conventional key name for each pitch class
// (flat keys spelled with flats, so e.g. Bb major reads Bb-C-D-Eb, not A#-B#-C##-D#).
const KEY_NAMES = ["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];

const LETTER_ORDER = ["C","D","E","F","G","A","B"];
const LETTER_NATURAL = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };

// Chromatic index (0-11) of a note name; accepts any number of #/b (or ♯/♭) after the letter.
function idx(note) {
  let pitch = LETTER_NATURAL[note[0]];
  for (const ch of note.slice(1)) {
    if (ch === "#" || ch === "♯") pitch++;
    else if (ch === "b" || ch === "♭") pitch--;
  }
  return ((pitch % 12) + 12) % 12;
}

// Display form of a note, chord or degree label: "Bb" -> "B♭", "Ebbm7" -> "E♭♭m7", "b3" -> "♭3", "#4" -> "♯4".
// Only touches a "b" right after a standalone note letter or right before a digit, so prose is left alone.
function pretty(s) {
  return String(s)
    .replace(/(?<![A-Za-z])([A-G])(b{1,2})/g, (_, letter, flats) => letter + "♭".repeat(flats.length))
    .replace(/(?<![A-Za-z])b(?=\d)/g, "♭")
    .replace(/#/g, "♯");
}

function numeralFromDegree(label) {
  return parseInt(label.replace(/[#b]/g, ""), 10);
}

// Spell the note that is `offsetSemitones` above rootNote, using the letter
// that is `numeral` scale-steps above the root's letter (so e.g. a "b3" above
// C is forced to use the letter E — giving Eb, never the enharmonic D#).
function spellNote(rootNote, offsetSemitones, numeral) {
  const rootLetter = rootNote[0];
  const rootPitch = idx(rootNote);
  const targetPitch = ((rootPitch + offsetSemitones) % 12 + 12) % 12;
  const startIdx = LETTER_ORDER.indexOf(rootLetter);
  const targetLetter = LETTER_ORDER[(startIdx + (numeral - 1)) % 7];
  const targetNatural = LETTER_NATURAL[targetLetter];
  let diff = ((targetPitch - targetNatural) % 12 + 12) % 12;
  if (diff > 6) diff -= 12; // fold into -6..6, accidentals should land in -2..2
  const accidental = diff === 0 ? "" : diff === 1 ? "#" : diff === -1 ? "b" : diff === 2 ? "##" : diff === -2 ? "bb" : "";
  return targetLetter + accidental;
}

function formulaFromOffsets(offsets) {
  // Simple scale-degree count, e.g. a 7-note scale reads "1 2 3 4 5 6 7 8" (8 = octave/root again).
  const nums = [];
  for (let i = 1; i <= offsets.length + 1; i++) nums.push(i);
  return nums.join(" ");
}

// Whole/half-step pattern of a scale, e.g. major -> "W W H W W W H" (larger gaps shown as W+H).
function stepPattern(offsets) {
  const names = { 1: "H", 2: "W", 3: "W+H", 4: "2W" };
  return offsets.map((o, i) => names[(offsets[i + 1] ?? 12) - o]).join(" ");
}

// Fill a <select> with options; items may be plain strings or {value, label}-shaped objects.
function populateSelect(selectEl, items, valueKey, labelKey) {
  selectEl.innerHTML = "";
  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = typeof item === "string" ? item : item[valueKey];
    opt.textContent = pretty(typeof item === "string" ? item : item[labelKey]);
    selectEl.appendChild(opt);
  });
}

/* ---------- INTERVALS ---------- */
// Every interval up to an octave: semitone distance, short abbreviation, and the scale-step
// numeral used by spellNote() to pick the correct letter name.
const INTERVALS = [
  { name: "Unison", abbr: "P1", semitones: 0, numeral: 1 },
  { name: "Minor 2nd", abbr: "m2", semitones: 1, numeral: 2 },
  { name: "Major 2nd", abbr: "M2", semitones: 2, numeral: 2 },
  { name: "Minor 3rd", abbr: "m3", semitones: 3, numeral: 3 },
  { name: "Major 3rd", abbr: "M3", semitones: 4, numeral: 3 },
  { name: "Perfect 4th", abbr: "P4", semitones: 5, numeral: 4 },
  { name: "Tritone", abbr: "TT", semitones: 6, numeral: 4 },
  { name: "Perfect 5th", abbr: "P5", semitones: 7, numeral: 5 },
  { name: "Minor 6th", abbr: "m6", semitones: 8, numeral: 6 },
  { name: "Major 6th", abbr: "M6", semitones: 9, numeral: 6 },
  { name: "Minor 7th", abbr: "m7", semitones: 10, numeral: 7 },
  { name: "Major 7th", abbr: "M7", semitones: 11, numeral: 7 },
  { name: "Octave", abbr: "P8", semitones: 12, numeral: 1 },
];

/* ---------- SCALES ---------- */
// Scale definitions: semitone offsets from the root, plus their formula-degree labels (b3, #4, etc.).
const SCALES = [
  { key: "major", label: "Major (Ionian)", offsets: [0,2,4,5,7,9,11], degrees: ["1","2","3","4","5","6","7"], use: "The reference scale; maj7 and I chords." },
  { key: "natminor", label: "Natural Minor (Aeolian)", offsets: [0,2,3,5,7,8,10], degrees: ["1","2","b3","4","5","b6","b7"], use: "Minor keys; the relative minor of a major key." },
  { key: "harmminor", label: "Harmonic Minor", offsets: [0,2,3,5,7,8,11], degrees: ["1","2","b3","4","5","b6","7"], use: "Raised 7th gives minor keys a real V7 chord." },
  { key: "melminor", label: "Melodic Minor (ascending)", offsets: [0,2,3,5,7,9,11], degrees: ["1","2","b3","4","5","6","7"], use: "Jazz minor; m(maj7) and the source of altered sounds." },
  { key: "majpent", label: "Major Pentatonic", offsets: [0,2,4,7,9], degrees: ["1","2","3","5","6"], use: "Five notes, no half steps — safe over major chords." },
  { key: "minpent", label: "Minor Pentatonic", offsets: [0,3,5,7,10], degrees: ["1","b3","4","5","b7"], use: "The core rock/blues soloing scale." },
  { key: "blues", label: "Blues Scale", offsets: [0,3,5,6,7,10], degrees: ["1","b3","4","b5","5","b7"], use: "Minor pentatonic plus the b5 \"blue note\"." },
];

/* ---------- MODES ---------- */
// The seven modes of the major scale: semitone offsets, formula-degree labels, which major-scale
// degree each mode starts on (parentDegree), the matching 7th chord, and a one-line character description.
const MODES = [
  { key: "ionian", label: "Ionian", offsets: [0,2,4,5,7,9,11], degrees: ["1","2","3","4","5","6","7"], parentDegree: 1, chord: "maj7", character: "The major scale itself — bright, resolved, the reference point for every other mode." },
  { key: "dorian", label: "Dorian", offsets: [0,2,3,5,7,9,10], degrees: ["1","2","b3","4","5","6","b7"], parentDegree: 2, chord: "m7", character: "Minor but brighter than natural minor — the natural (raised) 6th gives it a lifted, jazzy minor color." },
  { key: "phrygian", label: "Phrygian", offsets: [0,1,3,5,7,8,10], degrees: ["1","b2","b3","4","5","b6","b7"], parentDegree: 3, chord: "m7", character: "Dark and tense — the b2 gives it a Spanish/flamenco flavor." },
  { key: "lydian", label: "Lydian", offsets: [0,2,4,6,7,9,11], degrees: ["1","2","3","#4","5","6","7"], parentDegree: 4, chord: "maj7", character: "The brightest major mode — the #4 gives it a dreamy, floating quality." },
  { key: "mixolydian", label: "Mixolydian", offsets: [0,2,4,5,7,9,10], degrees: ["1","2","3","4","5","6","b7"], parentDegree: 5, chord: "7", character: "Major with a bluesy, dominant edge from the b7 — classic blues, funk, and rock sound." },
  { key: "aeolian", label: "Aeolian", offsets: [0,2,3,5,7,8,10], degrees: ["1","2","b3","4","5","b6","b7"], parentDegree: 6, chord: "m7", character: "The natural minor scale — the standard sad/serious minor color." },
  { key: "locrian", label: "Locrian", offsets: [0,1,3,5,6,8,10], degrees: ["1","b2","b3","4","b5","b6","b7"], parentDegree: 7, chord: "m7b5", character: "Unstable and dissonant — the diminished 5th keeps it feeling unresolved." },
];

/* ---------- BLUES ---------- */
// Maps each scale degree used in the basic blues forms (1, 4, 5) to its semitone offset,
// scale-step numeral, and roman-numeral label.
const DEGREE_INFO = {
  1: { offset: 0, numeral: 1, roman: "I" },
  4: { offset: 5, numeral: 4, roman: "IV" },
  5: { offset: 7, numeral: 5, roman: "V" },
};

// Each variation is 12 bars, given as scale-degree numbers (1 = I, 4 = IV, 5 = V).
const BLUES_VARIATIONS = [
  { key: "basic", label: "Basic 12-Bar", bars: [1,1,1,1, 4,4,1,1, 5,4,1,1], note: "All dominant 7ths, static for the first four bars — the most common blues form." },
  { key: "quick", label: "Quick-Change", bars: [1,4,1,1, 4,4,1,1, 5,4,1,1], note: "Moves to the IV in bar 2 before returning to I — adds early harmonic motion." },
  { key: "turnaround", label: "Turnaround Ending", bars: [1,1,1,1, 4,4,1,1, 5,4,1,5], note: "Ends on the V in bar 12 instead of I, pulling the ear back around to the top of the form." },
];

/* ---------- EXPLORERS ---------- */
// Wires up whichever explorer panels exist on the page (interval / scale / blues / mode),
// found by their element ids. `buildBoard(container, root, members)` is the page's
// instrument diagram renderer; theory pages pass nothing and get note bubbles instead
// (rendered into an optional "<prefix>-chips" element).
function renderNoteChips(el, root, members) {
  if (!el) return;
  el.innerHTML = members.map(m =>
    `<div class="note-chip${m.offset === 0 ? " is-root" : ""}"><div class="bubble">${pretty(spellNote(root, m.offset, m.numeral))}</div><div class="deg">${pretty(m.label)}</div></div>`
  ).join("");
}

function initExplorers(buildBoard) {
  const $ = id => document.getElementById(id);
  const show = (prefix, root, members) => {
    const board = $(prefix + "-board");
    if (board && buildBoard) buildBoard(board, root, members);
    renderNoteChips($(prefix + "-chips"), root, members);
  };
  const degreeMembers = def => def.offsets.map((o, i) => ({ offset: o, numeral: numeralFromDegree(def.degrees[i]), label: def.degrees[i] }));

  // INTERVALS
  const intervalTableBody = $("interval-table-body");
  if (intervalTableBody) {
    INTERVALS.forEach(iv => {
      const tr = document.createElement("tr");
      const exampleNote = pretty(spellNote("C", iv.semitones, iv.numeral)) + (iv.semitones === 12 ? " (next octave)" : "");
      tr.innerHTML = `<td>${iv.semitones}</td><td class="left">${iv.name}</td><td>${iv.abbr}</td><td>C → ${exampleNote}</td>`;
      intervalTableBody.appendChild(tr);
    });
  }
  const intervalRootSelect = $("interval-root");
  if (intervalRootSelect) {
    const intervalSelect = $("interval-select");
    populateSelect(intervalRootSelect, KEY_NAMES);
    populateSelect(intervalSelect, INTERVALS.map(iv => ({ value: `${iv.semitones}`, label: `${iv.name} (${iv.abbr})` })), "value", "label");
    const renderInterval = () => {
      const root = intervalRootSelect.value;
      const semis = parseInt(intervalSelect.value, 10);
      const iv = INTERVALS.find(i => i.semitones === semis);
      const targetNote = spellNote(root, semis, iv.numeral);
      $("interval-result").innerHTML =
        `<span class="formula-tag">${iv.abbr}</span><span>${semis} semitone${semis === 1 ? "" : "s"}</span><span class="notes-list">${pretty(root)} → ${pretty(targetNote)}</span>`;
      show("interval", root, [
        { offset: 0, numeral: 1, label: "1" },
        { offset: semis % 12, numeral: iv.numeral, label: iv.abbr },
      ]);
    };
    intervalRootSelect.addEventListener("change", renderInterval);
    intervalSelect.addEventListener("change", renderInterval);
    intervalRootSelect.value = "C";
    intervalSelect.value = "7";
    renderInterval();
  }

  // SCALES
  const scaleRootSelect = $("scale-root");
  if (scaleRootSelect) {
    const scaleSelect = $("scale-select");
    populateSelect(scaleRootSelect, KEY_NAMES);
    populateSelect(scaleSelect, SCALES.map(s => ({ value: s.key, label: s.label })), "value", "label");
    const renderScale = () => {
      const root = scaleRootSelect.value;
      const scale = SCALES.find(s => s.key === scaleSelect.value);
      const members = degreeMembers(scale);
      const noteNames = members.map(m => pretty(spellNote(root, m.offset, m.numeral)));
      $("scale-result").innerHTML =
        `<span class="formula-tag">${pretty(scale.degrees.join(" "))}</span><span class="formula-tag">${stepPattern(scale.offsets)}</span><span class="notes-list">${noteNames.join(" – ")}</span>`;
      show("scale", root, members);
    };
    scaleRootSelect.addEventListener("change", renderScale);
    scaleSelect.addEventListener("change", renderScale);
    scaleRootSelect.value = "C";
    scaleSelect.value = "major";
    renderScale();
  }

  // BLUES
  const bluesOverviewBody = $("blues-overview-body");
  if (bluesOverviewBody) {
    BLUES_VARIATIONS.forEach(v => {
      const chunk = arr => arr.map(d => DEGREE_INFO[d].roman + "7").join(" &ndash; ");
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="name-cell">${v.label}</td><td>${chunk(v.bars.slice(0, 4))}</td><td>${chunk(v.bars.slice(4, 8))}</td><td>${chunk(v.bars.slice(8, 12))}</td>`;
      bluesOverviewBody.appendChild(tr);
    });
  }
  const bluesRootSelect = $("blues-root");
  if (bluesRootSelect) {
    const bluesVariationSelect = $("blues-variation");
    populateSelect(bluesRootSelect, KEY_NAMES);
    populateSelect(bluesVariationSelect, BLUES_VARIATIONS.map(v => ({ value: v.key, label: v.label })), "value", "label");
    const renderBlues = () => {
      const root = bluesRootSelect.value;
      const variation = BLUES_VARIATIONS.find(v => v.key === bluesVariationSelect.value);
      const chordNames = variation.bars.map(d => {
        const info = DEGREE_INFO[d];
        return pretty(spellNote(root, info.offset, info.numeral)) + "7";
      });
      const uniqueRoman = [...new Set(variation.bars)].map(d => DEGREE_INFO[d].roman).join(" &ndash; ");
      const uniqueChords = [...new Set(chordNames)].join(" · ");
      $("blues-result").innerHTML =
        `<span class="formula-tag">${uniqueRoman}</span><span class="notes-list">${uniqueChords}</span>`;
      $("blues-description").textContent = variation.note;

      const barsEl = $("blues-bars");
      barsEl.innerHTML = "";
      variation.bars.forEach((d, i) => {
        const info = DEGREE_INFO[d];
        const div = document.createElement("div");
        div.className = "blues-bar fn-" + info.roman;
        div.innerHTML = `<div class="bar-num">Bar ${i + 1}</div><div class="bar-roman">${info.roman}7</div><div class="bar-chord">${chordNames[i]}</div>`;
        barsEl.appendChild(div);
      });

      show("blues", root, [
        { offset: 0, numeral: 1, label: "I" },
        { offset: 5, numeral: 4, label: "IV" },
        { offset: 7, numeral: 5, label: "V" },
      ]);
    };
    bluesRootSelect.addEventListener("change", renderBlues);
    bluesVariationSelect.addEventListener("change", renderBlues);
    bluesRootSelect.value = "C";
    bluesVariationSelect.value = "basic";
    renderBlues();
  }

  // MODES
  const modeTableBody = $("mode-table-body");
  if (modeTableBody) {
    MODES.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="name-cell">${m.label}</td><td>${m.parentDegree}</td><td style="font-family:var(--font-mono);white-space:nowrap">${pretty(m.degrees.join(" "))}</td><td class="left">${pretty(m.character)}</td>`;
      modeTableBody.appendChild(tr);
    });
  }
  const modeRootSelect = $("mode-root");
  if (modeRootSelect) {
    const modeSelect = $("mode-select");
    populateSelect(modeRootSelect, KEY_NAMES);
    populateSelect(modeSelect, MODES.map(m => ({ value: m.key, label: m.label })), "value", "label");
    const renderMode = () => {
      const root = modeRootSelect.value;
      const mode = MODES.find(m => m.key === modeSelect.value);
      const members = degreeMembers(mode);
      const noteNames = members.map(m => pretty(spellNote(root, m.offset, m.numeral)));
      $("mode-result").innerHTML =
        `<span class="formula-tag">${pretty(mode.degrees.join(" "))}</span><span class="formula-tag">${stepPattern(mode.offsets)}</span><span class="notes-list">${noteNames.join(" – ")}</span><span>Chord: <strong>${pretty(root)}${pretty(mode.chord)}</strong></span>`;
      $("mode-character").textContent = pretty(mode.character);
      show("mode", root, members);
    };
    modeRootSelect.addEventListener("change", renderMode);
    modeSelect.addEventListener("change", renderMode);
    modeRootSelect.value = "C";
    modeSelect.value = "ionian";
    renderMode();
  }
}
