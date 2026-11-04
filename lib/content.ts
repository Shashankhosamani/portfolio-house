export const ROOMS = ["Home", "About", "Workshop", "Contact"] as const;

export const EMAIL = "shashankhosamani1109@gmail.com";
export const LINKS = {
  github: "https://github.com/Shashankhosamani",
  linkedin: "https://www.linkedin.com/in/shashank-l-h",
  resume: "Shashank_Hosamani_Resume.pdf",
};

export const TIMELINE = [
  { when: "2025 – now", what: "Software Development Engineer I", where: "OneCap Technologies" },
  { when: "2025", what: "Software Development Intern", where: "OneCap Technologies" },
  { when: "2024", what: "Developer Intern", where: "Cave Labs, PES University" },
  { when: "2021 – 25", what: "B.Tech, Computer Science", where: "PES University · CGPA 8.27" },
];

export const STACK = [
  "TypeScript", "Python", "JavaScript", "SQL", "C++", "Next.js", "React", "Tailwind",
  "FastAPI", "REST APIs", "PostgreSQL", "MySQL", "LLM APIs", "Agent SDKs", "MCP", "GA4",
];

export type Project = {
  id: string; n: string; title: string; short: string; tag: string;
  line: string; points: string[]; tags: string[]; thumb: string; art: string;
};

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64"><rect width="96" height="64" fill="#1A1A1C"/>${body}</svg>`;

export const PROJECTS: Project[] = [
  {
    id: "recon", n: "01", title: "Reconciliation engine", short: "fintech", tag: "OneCap · Fintech",
    line: "I own the matching logic in OneCap's AI-native bank reconciliation engine, the part that decides which ledger entries belong to which bank lines.",
    points: [
      "Handles one-to-one, one-to-many, partial and credit/debit-note (CN/DN) matches.",
      "Validated on more than 2,000 ledger pairs.",
      "Built inside a single Next.js app I architected that now serves 10–11 products.",
    ],
    tags: ["TypeScript", "Python", "PostgreSQL", "Next.js"],
    thumb: svg('<g fill="#3A3A3F"><rect x="8" y="10" width="26" height="8" rx="1"/><rect x="8" y="24" width="26" height="8" rx="1"/><rect x="8" y="38" width="26" height="8" rx="1"/><rect x="62" y="10" width="26" height="8" rx="1"/><rect x="62" y="31" width="26" height="8" rx="1"/><rect x="62" y="46" width="26" height="8" rx="1"/></g><g stroke="#C8FF5A" stroke-width="1.6" fill="none"><path d="M34 14 H62"/><path d="M34 28 L62 35"/><path d="M34 42 L62 35"/></g>'),
    art: '<div class="viz" role="img" aria-label="Illustration of ledger entries matched to bank lines"><span class="illo">Illustration</span><div class="in recon"><div class="hd"><span>Ledger</span><span></span><span>Bank statement</span></div><div class="r"><span>INV-2041<small>₹48,000.00</small></span><span class="chip">1 : 1</span><span>NEFT<small>₹48,000.00</small></span></div><div class="r"><span>INV-2042 + 43<small>₹12,500 + ₹7,500</small></span><span class="chip">1 : n</span><span>IMPS<small>₹20,000.00</small></span></div><div class="r"><span>INV-2050<small>₹30,000.00</small></span><span class="chip ghost">partial</span><span>NEFT<small>₹29,988.00</small></span></div><div class="r"><span>CN-0113<small>−₹4,200.00</small></span><span class="chip">CN/DN</span><span>Adjustment<small>−₹4,200.00</small></span></div></div></div>',
  },
  {
    id: "query", n: "02", title: "Ask your statements", short: "LLM", tag: "LLM · Data",
    line: "A self-serve feature I built end to end. Customers upload a CSV, XLS or PDF statement from any ERP and ask questions about it in plain English.",
    points: [
      "No API integration or manual processing needed, which removed a key onboarding hurdle.",
      "Works with exports from any ERP.",
    ],
    tags: ["LLM APIs", "FastAPI", "Next.js", "PostgreSQL"],
    thumb: svg('<rect x="8" y="8" width="20" height="10" rx="2" fill="#3A3A3F"/><rect x="31" y="8" width="20" height="10" rx="2" fill="#3A3A3F"/><rect x="40" y="24" width="48" height="12" rx="5" fill="#ECE9E2"/><rect x="8" y="40" width="56" height="14" rx="5" fill="#2C2C30" stroke="#3A3A3F"/><circle cx="16" cy="47" r="2" fill="#C8FF5A"/><circle cx="23" cy="47" r="2" fill="#C8FF5A"/><circle cx="30" cy="47" r="2" fill="#C8FF5A"/>'),
    art: '<div class="viz" role="img" aria-label="Illustration of uploaded files and a question answered in plain English"><span class="illo">Illustration</span><div class="in"><div class="files"><span class="file"><b>PDF</b>bank_sep.pdf</span><span class="file"><b>XLS</b>vendors.xlsx</span><span class="file"><b>CSV</b>erp_export.csv</span></div><div class="bub me">Which vendors did we pay twice in September?</div><div class="bub ai">Two: Rao Traders on 4 and 19 Sep, and Metro Supplies on 11 and 12 Sep.</div><div class="ask"><span>Ask about your data…</span><i>↑</i></div></div></div>',
  },
  {
    id: "agent", n: "03", title: "Debug console", short: "AI agents", tag: "AI agents",
    line: "An internal chat tool on Claude's Agent SDK for investigating reconciliation issues in one conversation.",
    points: [
      "Replaced downloading and cross-referencing several files by hand.",
      "Skills generate their instructions from the uploaded files.",
      "Uses the AskUserQuestion tool so the agent checks with the engineer before deciding.",
    ],
    tags: ["Claude Agent SDK", "Skills", "MCP"],
    thumb: svg('<g font-family="monospace" font-size="8"><text x="8" y="16" fill="#C8FF5A">› <tspan fill="#ECE9E2">why unmatched?</tspan></text><text x="8" y="28" fill="#C8FF5A">› <tspan fill="#B4B0A8">diff 12</tspan></text></g><rect x="8" y="36" width="80" height="20" rx="3" fill="none" stroke="#C8FF5A"/><rect x="12" y="44" width="18" height="7" rx="3.5" fill="#C8FF5A"/><rect x="33" y="44" width="18" height="7" rx="3.5" fill="none" stroke="#5A5A60"/>'),
    art: '<div class="viz" role="img" aria-label="Illustration of an engineer chatting with a debugging agent"><span class="illo">Illustration</span><div class="in term"><div class="u"><span class="k">you ›</span> why is BRS-0912 unmatched?</div><div class="a"><span class="k">agent ›</span> reading ledger_export.csv, bank_sep.pdf</div><div class="a"><span class="k">agent ›</span> amounts differ by ₹12, likely a bank charge</div><div class="q"><span class="t">Treat bank charges as partial matches for this customer?</span><div class="opts"><span>Yes, always</span><span>Only under ₹50</span><span>Ask each time</span></div></div></div></div>',
  },
  {
    id: "costiq", n: "04", title: "Costiq", short: "live", tag: "Side project · Live",
    line: "An expense tracker that reads my bank SMS and logs every transaction, so I never type one in.",
    points: [
      "Version 1 is live and I use it every day.",
      "Now adding multi-tenancy and security hardening so other people can use it.",
    ],
    tags: ["Python", "FastAPI", "PostgreSQL"],
    thumb: svg('<rect x="6" y="14" width="36" height="34" rx="5" fill="#2C2C30"/><g fill="#5A5A60"><rect x="11" y="20" width="26" height="3"/><rect x="11" y="27" width="22" height="3"/><rect x="11" y="34" width="24" height="3"/></g><path d="M45 31 h8 m-3 -3 l3 3 l-3 3" stroke="#C8FF5A" stroke-width="1.6" fill="none"/><rect x="56" y="16" width="34" height="30" rx="4" fill="#ECE9E2"/><rect x="61" y="22" width="16" height="4" rx="2" fill="#141210"/><rect x="61" y="31" width="24" height="8" rx="1" fill="#141210"/>'),
    art: '<div class="viz" role="img" aria-label="Illustration of a bank SMS turned into a logged expense"><span class="illo">Illustration</span><div class="in cq"><div class="sms"><small>VK-HDFCBK · 8:42 PM</small>Rs.450.00 debited from A/c XX4821 to SWIGGY via UPI. Ref 431209.</div><span class="arrow">→</span><div class="txn"><span class="cat">Food &amp; dining</span><span class="amt">₹450</span><small>Swiggy · UPI · logged automatically</small></div></div></div>',
  },
  {
    id: "sched", n: "05", title: "Priority scheduler", short: "IEEE", tag: "Research · IEEE",
    line: 'IEEE paper: "An Efficient Priority-Aware Scheduling Approach for Federated Data Center Scheduling Frameworks".',
    points: [
      "A priority-aware strategy that balances short and long-running jobs across federated data centers.",
      "Improves resource utilization and the performance of latency-sensitive workloads.",
      "Published on IEEE Xplore.",
    ],
    tags: ["Distributed systems", "Scheduling", "IEEE Xplore"],
    thumb: svg('<g fill="#2C2C30"><rect x="8" y="12" width="80" height="10" rx="2"/><rect x="8" y="27" width="80" height="10" rx="2"/><rect x="8" y="42" width="80" height="10" rx="2"/></g><g fill="#C8FF5A"><rect x="10" y="14" width="8" height="6" rx="1"/><rect x="58" y="14" width="7" height="6" rx="1"/><rect x="10" y="29" width="6" height="6" rx="1"/><rect x="18" y="29" width="6" height="6" rx="1"/><rect x="46" y="44" width="6" height="6" rx="1"/></g><g fill="#5A5A60"><rect x="20" y="14" width="36" height="6" rx="1"/><rect x="26" y="29" width="52" height="6" rx="1"/><rect x="10" y="44" width="34" height="6" rx="1"/><rect x="54" y="44" width="30" height="6" rx="1"/></g>'),
    art: '<div class="viz" role="img" aria-label="Illustration of short and long jobs across three data centers"><span class="illo">Illustration</span><div class="in"><div class="lanes"><div class="lane"><span>DC-1</span><div class="track"><b class="s" style="left:2%;width:9%"></b><b style="left:13%;width:46%"></b><b class="s" style="left:61%;width:7%"></b><b class="s" style="left:70%;width:10%"></b></div></div><div class="lane"><span>DC-2</span><div class="track"><b class="s" style="left:2%;width:6%"></b><b class="s" style="left:10%;width:8%"></b><b style="left:20%;width:58%"></b><b class="s" style="left:80%;width:9%"></b></div></div><div class="lane"><span>DC-3</span><div class="track"><b style="left:2%;width:38%"></b><b class="s" style="left:42%;width:6%"></b><b class="s" style="left:50%;width:11%"></b><b style="left:63%;width:30%"></b></div></div></div><div class="legend"><span>short · latency-sensitive</span><span>long-running</span></div></div></div>',
  },
];

/** Third-party 3D models, all from the Khronos glTF Sample Assets collection. */
export const CREDITS = [
  { what: "Glam Velvet Sofa, Damask Chair, Barn Lamp, Potted Plant", who: "Eric Chadwick / Wayfair", license: "CC BY 4.0" },
  { what: "Floor Lamp (LightsPunctualLamp)", who: "DGG", license: "CC BY 4.0" },
  { what: "Sheen Chair, Glass Vase with Flowers", who: "Eric Chadwick, Rico Cilliers", license: "CC0" },
  { what: "Antique Camera", who: "Maximilian Kamps", license: "CC0" },
  { what: "Wood & Leather Sofa, Iridescent Dish with Olives", who: "Eric Chadwick", license: "CC BY 4.0" },
  { what: "Teacup", who: "Poly Haven, Eric Chadwick", license: "CC0" },
  { what: "Toy Car", who: "Guido Odendahl, Eric Chadwick", license: "CC0" },
  { what: "BoomBox, Water Bottle", who: "Microsoft", license: "CC0" },
  { what: "Hardwood floor texture", who: "three.js examples", license: "MIT" },
];
