import Link from "next/link";

import { ContentLanguageNote } from "@/components/HomeGuide/ContentLanguageNote";
import { SiteProgressMap } from "@/components/SiteProgressMap";
import type { MessageKey } from "@/i18n/messages";
import { L, T } from "@/i18n/T";
import { getModuleSummaries, type ModuleSummary } from "@/lib/content/modules";
import { REVIEW_AFTER_DAYS } from "@/lib/progress";

import "./home.css";

type Step = { title: MessageKey; body: MessageKey };

const STEPS: Step[] = [
  { title: "home.step1.title", body: "home.step1.body" },
  { title: "home.step2.title", body: "home.step2.body" },
  { title: "home.step3.title", body: "home.step3.body" },
  { title: "home.step4.title", body: "home.step4.body" },
];

type LearningPath = {
  id: string;
  title: MessageKey;
  who: MessageKey;
  body: MessageKey;
  /** 建議的題庫順序；不存在的 slug 會被略過，題庫改名時不會整頁壞掉。 */
  modules: string[];
};

const PATHS: LearningPath[] = [
  {
    id: "algo",
    title: "home.path.algo.title",
    who: "home.path.algo.who",
    body: "home.path.algo.body",
    modules: ["algorithms", "leetcode-patterns"],
  },
  {
    id: "backend",
    title: "home.path.backend.title",
    who: "home.path.backend.who",
    body: "home.path.backend.body",
    modules: [
      "java",
      "jvm",
      "java-concurrency",
      "spring",
      "database",
      "redis",
      "message-queue",
      "real-interviews",
    ],
  },
  {
    id: "design",
    title: "home.path.design.title",
    who: "home.path.design.who",
    body: "home.path.design.body",
    modules: ["backend-engineering", "computer-network", "system-design", "kubernetes"],
  },
  {
    id: "ai",
    title: "home.path.ai.title",
    who: "home.path.ai.who",
    body: "home.path.ai.body",
    modules: ["ai-llm", "ai-agent"],
  },
  {
    id: "soft",
    title: "home.path.soft.title",
    who: "home.path.soft.who",
    body: "home.path.soft.body",
    modules: ["behavioral"],
  },
];

const TIPS: MessageKey[] = [
  "home.tip.keys",
  "home.tip.local",
  "home.tip.cheatsheets",
  "home.tip.prefs",
];

/** 路線卡上的題庫短名：去掉「面試題」字樣，卡片才排得下。 */
function shortZh(module: ModuleSummary): string {
  return module.nameZh.replace("面試題", "").trim();
}

/** 首頁：使用指南。先說明怎麼用、從哪裡開始，再帶進題庫。 */
export default function HomePage() {
  const modules = getModuleSummaries();
  const bySlug = new Map(modules.map((module) => [module.slug, module]));
  const totalQuestions = modules.reduce((sum, module) => sum + module.units.length, 0);

  return (
    <div id="homePage" className="max-width-content">
      <section className="guide-hero hud-panel hud-brackets">
        <p className="hud-eyebrow">
          <T k="home.eyebrow" />
        </p>
        <h1 className="guide-hero__title">
          <T k="home.title" />
        </h1>
        <p className="guide-hero__lede">
          <T k="home.lede" />
        </p>
        <p className="guide-hero__stats font-display">
          <T
            k="home.stats"
            vars={{ questions: totalQuestions, modules: modules.length }}
          />
        </p>
        <div className="guide-hero__actions">
          <Link className="hud-cta" href="/categories/">
            <T k="home.ctaPrimary" />
          </Link>
          <Link className="guide-link" href="/questions/">
            <T k="home.ctaSecondary" />
          </Link>
        </div>
        <ContentLanguageNote className="guide-hero__note" />
      </section>

      <div className="section-head">
        <p className="hud-eyebrow">
          <T k="home.howEyebrow" />
        </p>
      </div>
      <ol className="guide-steps">
        {STEPS.map((step, index) => (
          <li className="guide-step hud-panel" key={step.title}>
            <span className="guide-step__num font-display" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="guide-step__title">
              <T k={step.title} />
            </h2>
            <p className="guide-step__body">
              <T k={step.body} vars={{ days: REVIEW_AFTER_DAYS }} />
            </p>
          </li>
        ))}
      </ol>

      <div className="section-head">
        <p className="hud-eyebrow">
          <T k="home.pathsEyebrow" />
        </p>
      </div>
      <p className="page-lede guide-paths__lede">
        <T k="home.pathsLede" />
      </p>
      <div className="guide-paths">
        {PATHS.map((path) => {
          const steps = path.modules
            .map((slug) => bySlug.get(slug))
            .filter((module): module is ModuleSummary => Boolean(module));

          return (
            <section className="guide-path hud-panel hud-brackets" key={path.id}>
              <h2 className="guide-path__title">
                <T k={path.title} />
              </h2>
              <p className="guide-path__who">
                <T k={path.who} />
              </p>
              <p className="guide-path__body">
                <T k={path.body} />
              </p>
              <ol className="guide-path__modules">
                {steps.map((module, index) => (
                  <li key={module.slug}>
                    <Link className="guide-chip" href={`/category/${module.slug}/`}>
                      <span className="guide-chip__num" aria-hidden>
                        {index + 1}
                      </span>
                      <span className="guide-chip__name">
                        <L zh={shortZh(module)} en={module.nameEn} />
                      </span>
                      <span className="guide-chip__count">{module.units.length}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <div className="section-head">
        <p className="hud-eyebrow">
          <T k="home.tipsEyebrow" />
        </p>
      </div>
      <ul className="guide-tips">
        {TIPS.map((tip) => (
          <li key={tip}>
            <T k={tip} />
          </li>
        ))}
      </ul>

      <div className="section-head">
        <p className="hud-eyebrow">
          <T k="home.progressEyebrow" />
        </p>
        <Link className="section-more" href="/categories/">
          <T k="home.progressMore" />
        </Link>
      </div>
      <SiteProgressMap modules={modules} />
    </div>
  );
}
