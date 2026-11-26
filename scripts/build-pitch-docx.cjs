const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  LevelFormat,
  PageOrientation,
} = require("docx");

const ACCENT = "A86209";
const INK = "171B16";
const MUTED = "5D6359";
const LINE = "D9DED1";
const CREAM = "F7F4EA";
const SAGE = "E6ECDD";
const WHITE = "FFFFFF";

const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const MARGIN = 720;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const body = (text, options = {}) =>
  new Paragraph({
    children: [
      new TextRun({
        text,
        size: options.size ?? 21,
        color: options.color ?? INK,
        bold: options.bold ?? false,
        italics: options.italics ?? false,
      }),
    ],
    spacing: { after: options.after ?? 55, line: options.line ?? 260 },
    alignment: options.alignment ?? AlignmentType.LEFT,
  });

const runParagraph = (runs, options = {}) =>
  new Paragraph({
    children: runs,
    spacing: { after: options.after ?? 55, line: options.line ?? 260 },
    alignment: options.alignment ?? AlignmentType.LEFT,
  });

const bullet = (runs, last = false) =>
  new Paragraph({
    children: runs,
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: last ? 60 : 40, line: 255 },
  });

const sectionHeading = (text) =>
  new Paragraph({
    children: [
      new TextRun({
        text,
        size: 25,
        bold: true,
        color: ACCENT,
        allCaps: true,
      }),
    ],
    spacing: { before: 220, after: 85, line: 250 },
    border: {
      bottom: { color: LINE, style: BorderStyle.SINGLE, size: 8, space: 4 },
    },
    keepNext: true,
  });

const cell = (width, children, fill = WHITE, bold = false) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      left: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      right: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    },
    children: [
      new Paragraph({
        children: children.map(
          (item) =>
            new TextRun({
              text: item.text,
              bold: item.bold ?? bold,
              size: item.size ?? 18,
              color: item.color ?? INK,
            }),
        ),
        spacing: { after: 0, line: 235 },
      }),
    ],
  });

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 21, color: INK },
        paragraph: { spacing: { after: 40, line: 252 } },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 260, hanging: 180 } },
              run: { color: ACCENT, bold: true },
            },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT, orientation: PageOrientation.PORTRAIT },
          margin: { top: MARGIN, right: MARGIN, bottom: 620, left: MARGIN },
        },
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "PROJECT SPARKL  \u00b7  TEAM SYNDICATE  \u00b7  ONE-PAGE PITCH",
              size: 16,
              bold: true,
              color: ACCENT,
              characterSpacing: 20,
            }),
          ],
          spacing: { after: 45 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "SparkL Lens", size: 60, bold: true, color: INK }),
          ],
          spacing: { after: 20, line: 250 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "One laptop. One phone. Every child's verbal and written ability, clearly seen.",
              size: 24,
              italics: true,
              color: MUTED,
            }),
          ],
          spacing: { after: 130, line: 250 },
        }),

        sectionHeading("1. Problem & solution"),
        runParagraph([
          new TextRun({ text: "Problem. ", bold: true, size: 21, color: ACCENT }),
          new TextRun({
            text:
              "100 children, 8 hours, twice a year. That is under five minutes per child across Kannada, English and Maths, with one laptop, one smartphone, paper notes and patchy internet.",
            size: 21,
            color: INK,
          }),
        ]),
        bullet([
          new TextRun({
            text: "Volunteers spend the session listening, marking, writing notes and reconstructing results later.",
            size: 20,
          }),
        ]),
        bullet(
          [
            new TextRun({
              text: "Paper and spreadsheets survive offline, but do not produce comparable subject-wise reports.",
              size: 20,
            }),
          ],
          true,
        ),
        runParagraph([
          new TextRun({ text: "Solution. ", bold: true, size: 21, color: ACCENT }),
          new TextRun({
            text:
              "SparkL Lens is an offline-first assessment app. The child speaks or writes; the app captures the evidence, scores the verbal response with low-confidence flags, stores a photo of the written page and builds one report. The volunteer starts the session and reviews the result.",
            size: 21,
          }),
        ]),
        bullet([
          new TextRun({
            text: "Runs on the existing laptop and phone. Records and page photos stay available without internet.",
            size: 20,
          }),
        ]),
        bullet(
          [
            new TextRun({
              text: "Written work is paper-first: page photo + a three-criterion teacher rubric. No handwriting OCR dependency.",
              size: 20,
            }),
          ],
          true,
        ),

        new Paragraph({
          children: [
            new ImageRun({
              type: "png",
              data: fs.readFileSync("docs/pitch-flow.png"),
              transformation: { width: 690, height: 171 },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 55, after: 25 },
        }),

        sectionHeading("2. Impact & business plan"),
        runParagraph([
          new TextRun({ text: "For the child. ", bold: true, size: 20, color: ACCENT }),
          new TextRun({
            text:
              "A consistent baseline twice a year, with a clear next teaching step instead of a one-off mark.",
            size: 20,
          }),
        ]),
        runParagraph([
          new TextRun({ text: "For the NGO. ", bold: true, size: 20, color: ACCENT }),
          new TextRun({
            text:
              "Up to 600 comparable subject records a year (100 children \u00d7 2 visits \u00d7 3 subjects), less admin, and one workflow for verbal and written evidence.",
            size: 20,
          }),
        ]),

        new Table({
          columnWidths: [2500, 7900],
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          rows: [
            new TableRow({
              children: [
                cell(2500, [{ text: "Pilot economics", bold: true, size: 18, color: ACCENT }], CREAM),
                cell(7900, [{ text: "Keep it small", bold: true, size: 18, color: ACCENT }], CREAM),
              ],
            }),
            new TableRow({
              children: [
                cell(2500, [{ text: "Build", bold: true }]),
                cell(7900, [
                  { text: "\u20b90 cash: student team + existing laptop/phone. No software licences." },
                ]),
              ],
            }),
            new TableRow({
              children: [
                cell(2500, [{ text: "Cloud run", bold: true }]),
                cell(7900, [
                  {
                    text:
                      "\u20b90 on Supabase free tier; about \u20b94,200/year if Pro ($25/month) is enabled for two assessment months.",
                  },
                ]),
              ],
            }),
            new TableRow({
              children: [
                cell(2500, [{ text: "Optional hardware", bold: true }]),
                cell(7900, [
                  { text: "\u20b9200 writing pad per station. Not required for the paper-photo flow." },
                ]),
              ],
            }),
            new TableRow({
              children: [
                cell(2500, [{ text: "Who pays", bold: true }]),
                cell(7900, [
                  { text: "NGO, CSR/community sponsor or a small grant. No per-child licence." },
                ]),
              ],
            }),
          ],
        }),
        body(
          "Free projects pause after seven idle days. Enabling Pro only around the two visits avoids that.",
          { size: 18, color: MUTED, after: 40 },
        ),
        body(
          "Sustainability: existing devices, a tiny annual cloud budget, and a form factor the NGO already carries.",
          { size: 18, color: MUTED, after: 50 },
        ),

        sectionHeading("3. Proof, edge & the ask"),
        runParagraph([
          new TextRun({ text: "Proof. ", bold: true, size: 20, color: ACCENT }),
          new TextRun({
            text:
              "Working prototype with verbal capture, paper-first written checks, offline PWA and queued Supabase sync. Offline and sync flows tested; no field pilot yet.",
            size: 20,
          }),
        ]),
        runParagraph([
          new TextRun({ text: "Evidence base. ", bold: true, size: 20, color: ACCENT }),
          new TextRun({
            text: "ASER evidence, 6 stakeholder interviews and 7 existing tools.",
            size: 20,
          }),
        ]),
        runParagraph([
          new TextRun({ text: "Edge. ", bold: true, size: 20, color: ACCENT }),
          new TextRun({
            text:
              "Paper/Excel is offline but cannot produce comparable reports; ASER needs an adult; tablet tools add hardware and connectivity. SparkL Lens fits the existing laptop + phone, works offline and joins verbal + written evidence in one record.",
            size: 20,
          }),
        ]),
        bullet([
          new TextRun({
            text: "Pilot at the next assessment cycle: 100 children, existing devices, volunteer feedback.",
            size: 20,
          }),
        ]),
        bullet(
          [
            new TextRun({
              text: "Modest support for Supabase and optional writing pads; no new hardware required.",
              size: 20,
            }),
          ],
          true,
        ),

        new Table({
          columnWidths: [CONTENT_WIDTH],
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
                  shading: { fill: SAGE, type: ShadingType.CLEAR, color: "auto" },
                  margins: { top: 80, bottom: 80, left: 110, right: 110 },
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: WHITE },
                    bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
                    left: { style: BorderStyle.NONE, size: 0, color: WHITE },
                    right: { style: BorderStyle.NONE, size: 0, color: WHITE },
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Team. ", bold: true, size: 18, color: ACCENT }),
                        new TextRun({
                          text:
                            "Vismay (alignment & story) \u00b7 Aashrith (app & flow) \u00b7 Sufiyan (impact & cost) \u00b7 Hajira (field testing & rollout).",
                          size: 18,
                          color: INK,
                        }),
                      ],
                      spacing: { after: 0, line: 235 },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Prototype for college review \u00b7 draft rubric and thresholds \u00b7 not a validated assessment",
              size: 15,
              color: "7A8075",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 90, after: 0 },
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("docs/SparkL_Lens_One_Page_Pitch.docx", buffer);
  console.log("wrote docs/SparkL_Lens_One_Page_Pitch.docx", buffer.length);
});
