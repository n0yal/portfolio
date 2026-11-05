// All human-readable copy for the portfolio lives in this file.
// Anything marked EDIT is a placeholder worth replacing with confirmed details.

export type ProjectColor = "pink" | "yellow" | "green" | "cream";

export type Project = {
  slug: string;
  index: string;
  title: string;
  role: string;
  year: string;
  meta: string[];
  tech: string[];
  description: string;
  longDescription: string;
  highlights: string[];
  color: ProjectColor;
  preview: "rag" | "fid" | "taco" | "blog" | "warehouse";
  exploreLabel: string;
  visitLabel: string;
  visitUrl: string;
};

export const content = {
  person: {
    firstName: "NOYAL",
    lastName: "MARTIN",
    fullName: "Noyal Martin",
    role: "AI Quality Engineer", // EDIT: confirm the title you want to use publicly
    location: "KERALA, INDIA",
    email: "noyalmartin7@gmail.com",
    year: "2026",
  },

  links: {
    github: "https://github.com/n0yal",
    linkedin: "https://linkedin.com/in/noyal-martin-3301n",
    resume: "/Noyal_Martin_Resume_AI_Quality_Engineer.pdf",
    bookCall: "mailto:noyalmartin7@gmail.com?subject=Book%20a%20call",
  },

  nav: {
    github: "GITHUB",
    linkedin: "LINKEDIN",
    resume: "RÉSUMÉ",
    arrow: "↗",
    top: "↑ TOP",
  },

  hero: {
    openToWork: "OPEN TO WORK",
    roleLine: "AI QUALITY ENGINEER — KERALA, INDIA", // EDIT: location and title
    tagline: "I BUILD CALM, USEFUL THINGS FOR THE WEB.",
  },

  cursor: {
    view: "VIEW",
    separator: "·",
  },

  controls: {
    play: "PLAY",
    pause: "PAUSE",
    draw: "DRAW",
    drawing: "DRAWING",
    pencilLabel: "DRAW ON THE WALL",
    colorsLabel: "INK COLOR",
    hint: "PICK A COLOR, THEN DRAW ON THE WALL",
    playAria: "Play the ball simulation",
    pauseAria: "Pause the ball simulation",
  },

  a11y: {
    intro: "Introduction",
    socialLinks: "Social links",
    footerLinks: "Footer links",
    signatureCanvas:
      "Visitor signature wall. Enable drawing with the pencil button.",
    inkNames: {
      pink: "Pink ink",
      yellow: "Yellow ink",
      green: "Green ink",
      cream: "Cream ink",
    },
  },

  work: {
    kicker: "SELECTED WORK (05)",
    heading: "Products I've built and shipped.",
    yearLabel: "YEAR",
    explore: "EXPLORE PROJECT →",
    moreLabel: "MORE",
    moreLink: "VIEW FULL RÉSUMÉ ↗",
    moreHeading: "The other things I make time for.",
    moreItems: [
      {
        role: "LEARNING COORDINATOR",
        place: "TINKERHUB",
        period: "2026 — PRESENT",
      },
      {
        role: "TECH TEAM COORDINATOR",
        place: "ACM FISAT",
        period: "2025",
      },
      {
        role: "B.TECH CSE",
        place: "FISAT, ANGAMALY",
        period: "2023 — 2027",
      },
    ],
  },

  projects: [
    {
      slug: "rag-mate",
      index: "01",
      title: "RAG-Mate",
      role: "FINAL-YEAR TEAM PROJECT",
      year: "2026",
      meta: ["FINAL-YEAR TEAM PROJECT", "RAG", "LITERAG", "LONGLLMLINGUA"],
      tech: ["RAG", "LiteRAG", "LongLLMLingua"],
      description:
        "A query-adaptive RAG copilot that compresses context before it reaches the model — keeping the useful parts, losing the noise.",
      longDescription:
        "RAG-Mate is a query-adaptive Retrieval-Augmented Generation copilot built as a final-year team project. It adapts retrieval to the shape of each question, then uses context compression to keep prompts lean without sacrificing the details an answer needs.",
      highlights: [
        "Built around the LiteRAG framework from the Journal of Manufacturing Systems (2026).",
        "Integrated LongLLMLingua to reduce context length while preserving answer-relevant information.",
        "Explored query-adaptive retrieval as a way to make RAG responses more focused and reliable.",
      ],
      color: "pink",
      preview: "rag",
      exploreLabel: "EXPLORE PROJECT →",
      visitLabel: "VISIT RAG-MATE ↗",
      visitUrl: "https://github.com/n0yal",
    },
    {
      slug: "fid-tool",
      index: "02",
      title: "FID Tool",
      role: "ACADEMIC PROJECT",
      year: "2026",
      meta: ["ACADEMIC PROJECT", "DESIGN FAIRNESS", "RESEARCH"],
      tech: ["Python", "Design Fairness", "Research"], // EDIT: confirm the remaining stack
      description:
        "An academic experiment in making fairness visible during design, inspired by Zhang, Shu and Yu's 2023 work.",
      longDescription:
        "FID Tool is an academic project exploring how fairness can be examined earlier in the design process. It draws on the ideas in “Fairness in Design” (Zhang, Shu and Yu, 2023) and turns them into a small, legible prototype.",
      highlights: [
        "Framed around the Fairness in Design paper published in 2023.",
        "Explored practical ways to surface fairness concerns before a design is shipped.",
        "Built as an academic prototype — the next step is a fuller evaluation.",
      ],
      color: "yellow",
      preview: "fid",
      exploreLabel: "EXPLORE PROJECT →",
      visitLabel: "VISIT FID TOOL ↗",
      visitUrl: "https://github.com/n0yal",
    },
    {
      slug: "taco-cloud",
      index: "03",
      title: "Taco Cloud",
      role: "LEARNING PROJECT",
      year: "2025",
      meta: ["LEARNING PROJECT", "JAVA", "SPRING BOOT"],
      tech: ["Java", "Spring Boot"],
      description:
        "A deliberate learning project: a Spring Boot application built to understand the framework from the inside out.",
      longDescription:
        "Taco Cloud is a hands-on Spring Boot learning project. It is where I practised the fundamentals of Java web applications — from request handling and templates to data and application structure.",
      highlights: [
        "Built while learning Java and Spring Boot.",
        "Focused on understanding the framework rather than rushing a finished product.",
        "A small project with a lot of useful groundwork in it.",
      ],
      color: "green",
      preview: "taco",
      exploreLabel: "EXPLORE PROJECT →",
      visitLabel: "VISIT TACO CLOUD ↗",
      visitUrl: "https://github.com/n0yal",
    },
    {
      slug: "self-hosted-blog",
      index: "04",
      title: "Self-Hosted Blog",
      role: "PERSONAL PROJECT",
      year: "2025",
      meta: ["PERSONAL PROJECT", "RASPBERRY PI 4B", "DOCKER"],
      tech: ["Raspberry Pi 4B", "Docker"],
      description:
        "A little corner of the internet, running on a Raspberry Pi 4B and packed into Docker containers.",
      longDescription:
        "A personal blog hosted at home on a Raspberry Pi 4B. It is part writing project, part home-lab exercise, and a practical way to understand deployment, containers and keeping a small service alive.",
      highlights: [
        "Self-hosted on a Raspberry Pi 4B.",
        "Everything containerised with Docker.",
        "A continuing experiment in owning my own corner of the web.",
      ],
      color: "cream",
      preview: "blog",
      exploreLabel: "EXPLORE PROJECT →",
      visitLabel: "VISIT THE BLOG ↗",
      visitUrl: "https://github.com/n0yal",
    },
    {
      slug: "warehouse-management-system",
      index: "05",
      title: "Warehouse Management System",
      role: "FULL-STACK PROJECT",
      year: "2026",
      meta: [
        "FULL-STACK PROJECT",
        "REACT",
        "NODE.JS",
        "POSTGRESQL",
        "PRISMA",
      ], // EDIT: confirm project status
      tech: ["React", "Node.js", "Express", "PostgreSQL", "Prisma", "FastAPI"],
      description:
        "A full-stack warehouse system — inventory, orders, racks and forecasting — with a little machine learning in the middle.",
      longDescription:
        "StockPilot is a full-stack warehouse management system covering the whole operational loop: inventory, receiving, putaway, picking, packing, shipping, returns, orders and rack management. It also adds AI-assisted classification and demand forecasting to support safer, better-informed decisions.",
      highlights: [
        "Built with React, Node.js/Express, Prisma and PostgreSQL.",
        "Integrated an AI-powered product classifier for handling, hazard, risk and storage conditions.",
        "Added SKU-level demand forecasting and replenishment recommendations with scikit-learn.",
      ],
      color: "pink",
      preview: "warehouse",
      exploreLabel: "EXPLORE PROJECT →",
      visitLabel: "VISIT STOCKPILOT ↗",
      visitUrl: "https://github.com/n0yal",
    },
  ] satisfies Project[],

  signatures: {
    count: 286,
    hereNow: 12,
    label: "SIGNATURES",
    onlineLabel: "HERE NOW",
    redDot: "●",
    canvasNote: "be a star",
    introCopy: "LEAVE A MARK",
    yourInk: "YOUR INK",
    saved: "SIGNATURE ADDED",
    countSuffix: "+",
  },

  footer: {
    heading: "Everything ends up here.",
    sayHi: "SAY HI",
    copy: "COPY",
    copied: "COPIED",
    bookCall: "BOOK A CALL ↗",
    note: "Available for select freelance projects, collaborations and interesting problems.",
    copyright: "© 2026 NOYAL MARTIN",
    digitsLabel: "TAP TO FEED IT",
    digitStream: "0 1 1 0 0 1 0 1 1 1 0 0 1 0 1 0 0 1 1 0 1 ",
    madeWith: "BUILT WITH REACT, MATTER.JS & TOO MUCH CURIOSITY",
  },

  caseStudy: {
    back: "← BACK TO SELECTED WORK",
    overview: "OVERVIEW",
    notes: "NOTES",
    stack: "STACK",
    year: "YEAR",
    next: "NEXT PROJECT",
    visit: "VISIT PROJECT",
  },
} as const;

export type SiteContent = typeof content;
