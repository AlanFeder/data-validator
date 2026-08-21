# Excel Validation Mock

An end-to-end TypeScript mock for validating `.xlsx` workbooks in either a
browser or Node while sharing the same framework-independent validation core.

## Temporary schema

The current columns are development placeholders:

| Column | Rule |
| --- | --- |
| `Name` | Required |
| `Email` | Required |
| `Legacy Code` | Must be blank; populated values are cleared and audited |
| `Some Code` | Blank allowed; populated strings are normalized to uppercase and audited |

The exact column order is required. A workbook containing exactly these unique
columns in a different order is safely reordered and that change is audited.
No warning condition has been invented for the mock.

## Browser mock

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The page can generate a deliberately
imperfect sample workbook, validate it in a Web Worker, show all results, and
download a safely corrected copy. Workbook bytes remain in the browser.

Build and locally preview the static output with:

```bash
npm run build
npm run preview
```

## Node path

The Node CLI calls the same Excel adapter and validation core:

```bash
npm run validate:workbook -- ./workbook.xlsx
```

If safe fixes exist, it writes `workbook.corrected.xlsx` beside the input. An
optional second path overrides the corrected output location. The command exits
with status `2` when hard validation errors remain.

## Checks

```bash
npm run validate
```

This runs strict TypeScript checking and the Vitest suite.
