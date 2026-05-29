/*
 * Author: Jeroen Jonckheer
 * Demo harness entry.
 *
 * Mounts the REAL ReadOnlySubgridComponent with a mocked PCF dataset so a
 * headless browser (Playwright) can render and record the actual control -
 * no Dataverse environment required. esbuild bundles this (React, ReactDOM
 * and Fluent UI are bundled in, unlike the PCF build where they are platform
 * libraries).
 *
 * Gotchas handled:
 *   - the control's CSS is normally injected by the PCF runtime via the
 *     manifest; here we import it explicitly so the grid is styled;
 *   - Fluent UI font icons are registered so the header sort chevron and the
 *     dropdown menu icons render instead of empty boxes.
 */
import "../ReadOnlySubgrid/css/ReadOnlySubgrid.css";
import "./demo.styles.css";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { initializeIcons } from "@fluentui/react";
import { ReadOnlySubgridComponent } from "../ReadOnlySubgrid/components/ReadOnlySubgridComponent";
import { makeDataset, MockColumn, MockRecordSpec } from "../tests/mockDataset";

initializeIcons();

const COLUMNS: MockColumn[] = [
    { name: "name", displayName: "Account", order: 0, dataType: "SingleLine.Text", visualSizeFactor: 220 },
    { name: "city", displayName: "City", order: 1, dataType: "SingleLine.Text", visualSizeFactor: 130 },
    { name: "owner", displayName: "Owner", order: 2, dataType: "Lookup.Simple", visualSizeFactor: 160 },
    { name: "segment", displayName: "Segment", order: 3, dataType: "SingleLine.Text", visualSizeFactor: 130 },
    { name: "revenue", displayName: "Revenue", order: 4, dataType: "SingleLine.Text", visualSizeFactor: 120 },
];

function owner(id: string, name: string) {
    return { id: { guid: id }, entityType: "systemuser", name: name };
}

const BASE: MockRecordSpec[] = [
    { id: "r1",  formatted: { name: "Acme Industries",      city: "Gent",      owner: "Lena Maes",     segment: "Enterprise", revenue: "€ 1.2M" }, raw: { owner: owner("u1", "Lena Maes") } },
    { id: "r2",  formatted: { name: "Globex Corporation",   city: "Antwerpen", owner: "Tom Peeters",   segment: "Mid-market", revenue: "€ 840K" }, raw: { owner: owner("u2", "Tom Peeters") } },
    { id: "r3",  formatted: { name: "Initech BV",           city: "Brugge",    owner: "Lena Maes",     segment: "SMB",        revenue: "€ 220K" }, raw: { owner: owner("u1", "Lena Maes") } },
    { id: "r4",  formatted: { name: "Umbrella Health",      city: "Brussel",   owner: "Sara De Wit",   segment: "Enterprise", revenue: "€ 3.4M" }, raw: { owner: owner("u3", "Sara De Wit") } },
    { id: "r5",  formatted: { name: "Soylent Foods",        city: "Gent",      owner: "Tom Peeters",   segment: "Mid-market", revenue: "€ 610K" }, raw: { owner: owner("u2", "Tom Peeters") } },
    { id: "r6",  formatted: { name: "Stark Manufacturing",  city: "Antwerpen", owner: "Sara De Wit",   segment: "Enterprise", revenue: "€ 5.1M" }, raw: { owner: owner("u3", "Sara De Wit") } },
    { id: "r7",  formatted: { name: "Wayne Logistics",      city: "Brugge",    owner: "Lena Maes",     segment: "Mid-market", revenue: "€ 970K" }, raw: { owner: owner("u1", "Lena Maes") } },
    { id: "r8",  formatted: { name: "Hooli Cloud",          city: "Brussel",   owner: "Tom Peeters",   segment: "Enterprise", revenue: "€ 2.7M" }, raw: { owner: owner("u2", "Tom Peeters") } },
    { id: "r9",  formatted: { name: "Pied Piper",           city: "Gent",      owner: "Sara De Wit",   segment: "SMB",        revenue: "€ 180K" }, raw: { owner: owner("u3", "Sara De Wit") } },
    { id: "r10", formatted: { name: "Vandelay Imports",     city: "Antwerpen", owner: "Lena Maes",     segment: "Mid-market", revenue: "€ 530K" }, raw: { owner: owner("u1", "Lena Maes") } },
    { id: "r11", formatted: { name: "Cyberdyne Systems",    city: "Brugge",    owner: "Tom Peeters",   segment: "Enterprise", revenue: "€ 4.2M" }, raw: { owner: owner("u2", "Tom Peeters") } },
    { id: "r12", formatted: { name: "Wonka Industries",     city: "Brussel",   owner: "Sara De Wit",   segment: "SMB",        revenue: "€ 95K"  }, raw: { owner: owner("u3", "Sara De Wit") } },
    { id: "r13", formatted: { name: "Aperture Science",     city: "Gent",      owner: "Lena Maes",     segment: "Enterprise", revenue: "€ 6.8M" }, raw: { owner: owner("u1", "Lena Maes") } },
    { id: "r14", formatted: { name: "Tyrell Corporation",   city: "Antwerpen", owner: "Tom Peeters",   segment: "Mid-market", revenue: "€ 1.9M" }, raw: { owner: owner("u2", "Tom Peeters") } },
];

const DemoApp: React.FC = () => {
    const [sort, setSort] = React.useState<{ name: string | null; desc: boolean }>({
        name: null,
        desc: false,
    });
    const [toast, setToast] = React.useState<string>("");

    // Re-sort the mock records when the user picks a sort, mimicking the
    // server-side refresh the real control triggers via index.ts.
    const records = React.useMemo(() => {
        if (!sort.name) {
            return BASE;
        }
        const key = sort.name;
        const sorted = BASE.slice().sort((a, b) => {
            const av = a.formatted[key] || "";
            const bv = b.formatted[key] || "";
            return av.localeCompare(bv, undefined, { numeric: true });
        });
        return sort.desc ? sorted.reverse() : sorted;
    }, [sort]);

    const dataset = React.useMemo(
        () =>
            makeDataset({
                columns: COLUMNS,
                records,
                targetEntity: "account",
                paging: { pageSize: 100, totalResultCount: BASE.length, hasNextPage: false },
                sorting: sort.name
                    ? [{ name: sort.name, sortDirection: sort.desc ? 1 : 0 }]
                    : [],
            }),
        [records, sort]
    );

    const showToast = (msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(""), 1600);
    };

    return (
        <div className="demo-page">
            <div className="demo-frame">
                <div className="demo-titlebar">
                    <span className="demo-dot demo-dot-r" />
                    <span className="demo-dot demo-dot-y" />
                    <span className="demo-dot demo-dot-g" />
                    <span className="demo-title">Accounts &mdash; Read-only Subgrid</span>
                </div>
                <div className="demo-grid">
                    <ReadOnlySubgridComponent
                        dataset={dataset}
                        width={900}
                        height={470}
                        onOpenRecord={(entity, id) => showToast("Opening " + entity + " " + id)}
                        onLoadMore={() => undefined}
                        onSort={(name, desc) => setSort({ name, desc })}
                    />
                </div>
            </div>
            {toast ? <div className="demo-toast">{toast}</div> : null}
        </div>
    );
};

ReactDOM.render(<DemoApp />, document.getElementById("root"));
