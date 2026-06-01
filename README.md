# JJ Read-only Subgrid

**Exactly the model-driven subgrid your users already know — same look, same feel, same sort/group/filter/lookup behaviour — minus only the buttons we deliberately left out (New, Add Existing, Delete, inline edit).** A drop-in, per-instance read-only replacement for the standard subgrid.

Built with the [Power Apps Component Framework](https://learn.microsoft.com/power-apps/developer/component-framework/overview), React 16 and Fluent UI v8.

> Logical name in Dataverse: **`jj_Grids.ReadOnlySubgrid`** (publisher prefix `jj`, namespace `Grids`).

<!-- DEMO:START -->
![JJ Read-only Subgrid in action](media/demo.gif)
<!-- DEMO:END -->

---

## Why this exists

Every Power Platform pro has run into this: you want a subgrid of a related entity on a form, but **on this one specific spot** users should not be able to add, remove or edit rows. It is reference data, audit context, a parent-child read-out, a "related" tab that should be informational only — pick your scenario. At the same time, on *every other* place the same entity's subgrid appears, the ribbon needs to stay fully functional so users can still create / add / delete there.

Stripping the table-level ribbon kills it everywhere. Hiding the command bar via host-level configuration is inconsistent across surfaces and bleeds across views. JJ Read-only Subgrid fixes this the right way: **apply it only where you want read-only**. The global ribbon stays intact for every other instance of the same subgrid.

What you get is the exact same subgrid your users are used to — sorting, grouping, filtering, lookup links, click-through to open the record, the modern grid pitch and feel — only **without** the command bar (New / Add Existing / Delete) and **without** inline editing. That's it. Nothing more removed, nothing extra bolted on.

## Features

- **Read-only by design** — no command bar, no toolbar, no New/Add/Delete, no inline edit.
- **Native-grid look** — row/header pitch calibrated to the standard Power Apps modern grid (42&nbsp;px), native scrollbars, sticky header.
- **Click-through navigation** — click a row to open the record; lookup cells render as links that open the *related* record (click stops propagation so it never double-opens).
- **Column tools** — per-column dropdown: A→Z / Z→A (server-side sort), Group by / Ungroup, Filter by (client-side contains), Column width dialog, Move left / Move right, drag-resize.
- **Smart paging** — eagerly pre-loads past the host's tiny default page size, then lazy-loads more as you scroll.
- **Lookup-aware** — resolves single, customer, owner and party-list lookups into navigable links.
- **Resilient** — a single malformed record or unreadable column never blanks the whole grid.
- **Localized strings** — Dutch UI labels (easily extendable via the resx).

## Demo

A recorded demo (and the GIF embedded above) shows: opening a record from a row, following a lookup link, sorting, grouping, filtering and resizing columns.

> The GIF is produced from a short screen recording of the control on a live form, converted with `ffmpeg`. See the [Demo & Media](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki/Demo-and-Media) wiki page for the exact command.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Power Platform CLI (`pac`)](https://learn.microsoft.com/power-platform/developer/cli/introduction)
- A Dataverse environment where you can import controls

## Build

```bash
npm install
npm run build      # production bundle via pcf-scripts
npm run lint       # eslint
npm test           # jest unit + render tests
```

## Deploy

Push the control straight into a Dataverse environment with your publisher prefix:

```bash
pac auth create --environment https://<your-org>.crm.dynamics.com
pac pcf push --publisher-prefix jj
```

This builds and imports the control as `jj_Grids.ReadOnlySubgrid`. After import, edit a form, select a subgrid, and set its control to **Read-only Subgrid**.

> Alternatively, build the managed/unmanaged solution from `Solution/` and import the `.zip`.

## Configure on a form

1. Open the form in the modern form designer.
2. Select (or add) a subgrid bound to the related table + view.
3. In the subgrid properties, choose **Read-only Subgrid** as the control for Web / Phone / Tablet.
4. Save & publish.

The bound view's columns, order and widths drive what the grid shows.

## Project structure

```
ReadOnlySubgrid/
  index.ts                       PCF lifecycle bridge (side effects only)
  components/
    ReadOnlySubgridComponent.tsx Fluent UI rendering + interaction
  gridLogic.ts                   Pure, framework-agnostic data shaping (unit-tested)
  css/ReadOnlySubgrid.css        Native-grid-calibrated styling
  strings/ReadOnlySubgrid.1033.resx  Display strings
  ControlManifest.Input.xml      Control + dataset definition
tests/                           Jest unit (gridLogic) + render tests
Solution/                        Dataverse solution wrapper (.cdsproj)
```

The split is deliberate: **`gridLogic.ts` is pure** (no React/DOM) so it can be unit-tested directly, **the component** owns rendering, and **`index.ts`** owns PCF lifecycle and side effects. See the [Architecture](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki/Architecture) wiki page.

## Testing

```bash
npm test
```

- `tests/gridLogic.test.ts` — pure-logic unit tests (column ordering, width resolution, lookup extraction, row building, filtering, grouping, sizing math).
- `tests/ReadOnlySubgridComponent.test.tsx` — render/interaction tests with a mocked dataset (rows, empty/loading states, row & lookup navigation, eager paging).

## Documentation

Full docs live in the [**Wiki**](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki):

- [Home](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki)
- [Installation & Deployment](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki/Installation-and-Deployment)
- [Configuration](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki/Configuration)
- [Architecture](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki/Architecture)
- [Development & Testing](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki/Development-and-Testing)
- [Troubleshooting](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki/Troubleshooting)
- [Naming Convention](https://github.com/JeroenJonckheer/jj-readonlysubgrid/wiki/Naming-Convention)

## Author & License

Built by **Jeroen Jonckheer**.

Released under the [MIT License](LICENSE).
