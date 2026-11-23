import { useEffect, useState } from "react";
import {
  approachSteps,
  caseStudies,
  changedViews,
  hardQuestions,
  implications,
  interviewQuestions,
  interviews,
  kannadaComplexity,
  landscapeGaps,
  lessons,
  openQuestions,
  references,
  solutions,
  sourceLinks,
  stakeholders,
  successCriteria,
  task1Stats,
  team,
  tools,
} from "../data/evidence";
import { useHashRoute } from "../lib/router";
import { PageHeader } from "../components/PageHeader";
import { Pill } from "../components/Pill";
import { Icon } from "../components/Icon";

const TABS = [
  { id: "problem", label: "Problem" },
  { id: "people", label: "People" },
  { id: "landscape", label: "What exists" },
  { id: "approach", label: "Approach" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function EvidencePage() {
  const route = useHashRoute();
  const queryTab = route.query.get("tab");
  const [tab, setTab] = useState<TabId>(
    queryTab === "people" || queryTab === "landscape" || queryTab === "approach" ? queryTab : "problem",
  );

  useEffect(() => {
    const next = route.query.get("tab");
    if (next === "people" || next === "landscape" || next === "approach") setTab(next);
    else if (next === "problem") setTab("problem");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.hash]);

  const choose = (next: TabId) => {
    setTab(next);
    route.navigate(`/evidence?tab=${next}`);
  };

  return (
    <>
      <PageHeader
        title="Evidence"
        subline="Four task notes, six conversations and seven existing tools. This is the working evidence behind the draft, not a validated SparkL rubric."
      />

      <div className="tabs" role="tablist" aria-label="Evidence sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`tab ${tab === item.id ? "is-active" : ""}`}
            onClick={() => choose(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "problem" ? <ProblemTab /> : null}
      {tab === "people" ? <PeopleTab /> : null}
      {tab === "landscape" ? <LandscapeTab /> : null}
      {tab === "approach" ? <ApproachTab /> : null}

      <section className="evidence-sources" aria-labelledby="sources-title">
        <div className="section-head">
          <div>
            <h2 id="sources-title">Source notes</h2>
            <p className="section-sub">The five PDFs shared by Team Syndicate. They open beside the app.</p>
          </div>
          <span className="section-action">October–November 2026</span>
        </div>
        <div className="source-links">
          {sourceLinks.map((source) => (
            <a key={source.file} href={source.file} target="_blank" rel="noreferrer" className="source-link">
              <span className="source-link-icon">
                <Icon name="book" size={14} />
              </span>
              <span>{source.label}</span>
              <Icon name="chevron-right" size={13} />
            </a>
          ))}
        </div>
        <details className="references">
          <summary>References used in the task notes</summary>
          <ol>
            {references.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ol>
        </details>
      </section>
    </>
  );
}

function ProblemTab() {
  const rest = task1Stats.slice(1);
  return (
    <div className="evidence-tab">
      <section className="evidence-lead" aria-labelledby="problem-lead-title">
        <div className="evidence-lead-main">
          <p className="evidence-kicker">ASER 2024 · rural India</p>
          <p className="evidence-big literata">27.1%</p>
          <p className="evidence-big-label">
            of Std III children in rural India could read a Std II-level text.
          </p>
          <p className="evidence-source">
            About 72.9% could not meet that benchmark. A rural household-survey estimate, not a figure for
            every child in India.
          </p>
        </div>
        <div className="evidence-lead-side">
          <h2 id="problem-lead-title">A grade can hide a gap</h2>
          <p>
            Some children attend a grade that is higher than the reading or arithmetic they can currently
            use. When a child is judged only by school grade, that gap is easy to miss — and lessons get
            planned at the wrong level.
          </p>
          <p>
            SparkL already assesses Kannada, English and Maths. The work is largely manual: assessment,
            grading and progress tracking all take educator time. The app is an attempt to reduce the
            repetitive part without removing the educator from the judgement.
          </p>
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="numbers-title">
        <div className="section-head">
          <div>
            <h2 id="numbers-title">The numbers we started from</h2>
            <p className="section-sub">National and Karnataka figures used in Task 1, with their sources.</p>
          </div>
          <a className="section-action" href="/docs/sparkl-task-1-problem.pdf" target="_blank" rel="noreferrer">
            Task 1 PDF
          </a>
        </div>
        <div className="stat-grid">
          {rest.map((stat) => (
            <article className="stat-item" key={stat.label}>
              <span className="stat-value num">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-detail">{stat.detail}</span>
              <span className="stat-source">{stat.source}</span>
            </article>
          ))}
          <article className="stat-item stat-item--note">
            <span className="stat-note-title">What the evidence does not include</span>
            <p>
              SparkL's number of children assessed, minutes per assessment, staff wages and monthly
              workload. A rupee cost cannot be calculated honestly until those are measured.
            </p>
          </article>
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="meaning-title">
        <div className="section-head">
          <div>
            <h2 id="meaning-title">What we set out to solve</h2>
            <p className="section-sub">The problem in our own words, kept close to Task 1.</p>
          </div>
        </div>
        <div className="prose-grid">
          <div className="prose">
            <p>
              The task is not “build an assessment app”. It is: <strong>find the level a child can
              actually work at, then make that visible to the educator who plans the next lesson.</strong>
            </p>
            <p>
              ASER tests children aged 5–16 with the same progressive tool, whatever their age or grade.
              The reading ladder moves from letters to words, a paragraph and a short Grade II-level story.
              Arithmetic moves from number recognition to subtraction and division. The recorded result is
              the highest level the child can comfortably reach.
            </p>
            <p>
              Adult listening is essential at three points: hearing the child read, judging accuracy and
              comfort, and recording or confirming the level. A digital tool can reduce the writing and
              calculating. It should not quietly replace the listening.
            </p>
            <p>
              The same applies to Kannada. The script is an abugida: a learner has to recognise vowels and
              consonants, understand the inherent vowel, read vowel signs and decode conjunct forms. A
              translated English alphabet sequence would not be a Kannada assessment.
            </p>
            <p>
              NIPUN Bharat, launched on 5 July 2021, aims for foundational literacy and numeracy for every
              child by the end of Grade III. That national goal is the reason a foundational ladder should
              sit alongside the school grade, not replace it.
            </p>
          </div>
          <aside className="margin-note">
            <p className="margin-note-title">The three open questions that shaped the prototype</p>
            <ol>
              <li>What is the exact SparkL rubric, level sequence and pass rule?</li>
              <li>What happens on the actual shared device, with no network and an 8% battery?</li>
              <li>How accurate does Kannada speech need to be before it can assist an educator?</li>
            </ol>
            <p className="margin-note-foot">
              None of these are answered by the desk research. They need observation and a pilot.
            </p>
          </aside>
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="aser-title">
        <div className="section-head">
          <div>
            <h2 id="aser-title">How a level is found</h2>
            <p className="section-sub">The one-to-one progression SparkL's workflow is modelled on.</p>
          </div>
        </div>
        <div className="process-grid">
          <ol className="process-list">
            <li>
              <span className="process-number literata">1</span>
              <div>
                <h3>Start where the child is likely to manage</h3>
                <p>
                  The assessor works one-to-one and uses the same basic tool regardless of the child's age
                  or grade. There is no assumption that Std IV means a Std IV text.
                </p>
              </div>
            </li>
            <li>
              <span className="process-number literata">2</span>
              <div>
                <h3>Listen as the child attempts the rung</h3>
                <p>
                  Letters, familiar words, a connected paragraph, a short story. The assessor judges
                  accuracy, fluency and whether the reading is comfortable.
                </p>
              </div>
            </li>
            <li>
              <span className="process-number literata">3</span>
              <div>
                <h3>Check the level below if it is not comfortable</h3>
                <p>
                  If the child cannot manage a higher level, the assessor checks the lower level indicated
                  by the tool, rather than guessing from the grade.
                </p>
              </div>
            </li>
            <li>
              <span className="process-number literata">4</span>
              <div>
                <h3>Record the highest comfortable level</h3>
                <p>
                  The result is the skill the child can demonstrate, with the difficulty edge recorded
                  beside it. That edge is often the most useful thing for the next lesson.
                </p>
              </div>
            </li>
          </ol>
          <aside className="process-aside">
            <p className="margin-note-title">The arithmetic ladder</p>
            <p>
              Number recognition → two-digit numbers → subtraction → 3-digit-by-1-digit division. ASER
              records the highest skill achieved, not an inferred school grade.
            </p>
            <p className="margin-note-title mt-16">What remains adult-led</p>
            <ul>
              <li>Listening to oral reading.</li>
              <li>Judging accuracy and comfort.</li>
              <li>Resolving hesitant or unclear responses.</li>
              <li>Confirming the recorded level.</li>
            </ul>
            <p className="margin-note-title mt-16">Offline is not unlimited</p>
            <p>
              Local records can work without a network, but sync, storage, battery, screen size and font
              rendering vary by device. Offline speech recognition is a separate, more demanding question;
              it must be tested on the real shared Android phone.
            </p>
          </aside>
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="kannada-title">
        <div className="section-head">
          <div>
            <h2 id="kannada-title">Why Kannada needs its own ladder</h2>
            <p className="section-sub">Four levels of akshara complexity, from a study of 315 Kannada-medium children.</p>
          </div>
        </div>
        <div className="aksara-grid">
          {kannadaComplexity.map((item) => (
            <article className="aksara-tile" key={item.type}>
              <span className="aksara-glyph kannada" lang="kn">{item.form}</span>
              <h3>{item.type}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        <div className="prose-grid mt-24">
          <div className="prose">
            <p>
              The study assessed 315 Kannada-medium children from Grades I–VII using 67 akshara forms
              grouped into vowels, consonants with inherent vowels, consonants with vowel diacritics and
              consonant clusters. Akshara complexity is a real assessment dimension, not a typographic
              detail.
            </p>
            <p>
              SparkL's ladder therefore has its own sequence: akshara, kagunita, simple words, cluster
              words, paragraph, story. The sequence is a draft. The exact akshara list, kagunita order,
              pass criteria and whether alternative forms are used for reassessment are still to be agreed
              with SparkL and a Kannada educator.
            </p>
          </div>
          <aside className="margin-note">
            <p className="margin-note-title">What is still unconfirmed</p>
            <ul>
              <li>The exact SparkL assessment sheets and level names.</li>
              <li>Whether SparkL tests kagunita or specific akshara combinations.</li>
              <li>Pass rules and borderline-response rules.</li>
              <li>Whether another local language is needed in the interface.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="stakeholders-title">
        <div className="section-head">
          <div>
            <h2 id="stakeholders-title">Who is affected</h2>
            <p className="section-sub">The stakeholder map from Task 1, with the question to validate for each group.</p>
          </div>
        </div>
        <div className="stakeholder-table">
          <div className="stakeholder-head" aria-hidden="true">
            <span>Group</span>
            <span>Interest / role</span>
            <span>Question to validate</span>
          </div>
          {stakeholders.map((person) => (
            <div className="stakeholder-row" key={person.group}>
              <span className="stakeholder-group">{person.group}</span>
              <span>{person.interest}</span>
              <span className="muted">{person.question}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="open-title">
        <div className="section-head">
          <div>
            <h2 id="open-title">What we still do not know</h2>
            <p className="section-sub">The twelve questions that must be answered before the rubric is real.</p>
          </div>
        </div>
        <ul className="question-list">
          {openQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PeopleTab() {
  return (
    <div className="evidence-tab">
      <section className="people-intro">
        <div className="people-intro-copy">
          <p className="evidence-kicker">Six conversations · 22–29 October 2026</p>
          <h2 className="people-quote literata">
            “A child can have different strengths in different subjects.”
          </h2>
          <p className="pull-attribution">Rtr. Gargee Mitra · Club Service Director, Rotaract Bangalore West</p>
        </div>
        <div className="people-facts">
          <div>
            <span className="people-fact-value num">6</span>
            <span className="people-fact-label">named conversations</span>
          </div>
          <div>
            <span className="people-fact-value num">15–20</span>
            <span className="people-fact-label">companies approached for CSR support</span>
          </div>
          <div>
            <span className="people-fact-value num">1–1.5</span>
            <span className="people-fact-label">months spent building parents' trust</span>
          </div>
          <div>
            <span className="people-fact-value num">250</span>
            <span className="people-fact-label">students on the Pragati Protsaha trip</span>
          </div>
        </div>
      </section>

      <details className="questions-details">
        <summary>The 12 questions we used in the conversations</summary>
        <ol>
          {interviewQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </details>

      <section className="evidence-section" aria-labelledby="interviews-title">
        <div className="section-head">
          <div>
            <h2 id="interviews-title">What people told us</h2>
            <p className="section-sub">Paraphrased from the meeting notes and the onsite summary. Roles are recorded as given.</p>
          </div>
          <a className="section-action" href="/docs/sparkl-task-2-people.pdf" target="_blank" rel="noreferrer">
            Task 2 PDF
          </a>
        </div>
        <div className="interview-list">
          {interviews.map((interview) => (
            <article className="interview-row" key={interview.name}>
              <div className="interview-person">
                <h3>{interview.name}</h3>
                <p>{interview.role}</p>
                <span className="interview-meta">
                  {interview.date} · {interview.format}
                </span>
                <span className="interview-meta">Team: {interview.team}</span>
              </div>
              <p className="interview-shared">{interview.shared}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="learned-title">
        <div className="section-head">
          <div>
            <h2 id="learned-title">Five things we learned</h2>
            <p className="section-sub">What changed the design, not just the research notes.</p>
          </div>
        </div>
        <ol className="lesson-list">
          {lessons.map((lesson, index) => (
            <li key={lesson.title}>
              <span className="lesson-number literata">{index + 1}</span>
              <div>
                <h3>{lesson.title}</h3>
                <p>{lesson.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="evidence-section" aria-labelledby="changed-title">
        <div className="section-head">
          <div>
            <h2 id="changed-title">What changed in our thinking</h2>
            <p className="section-sub">Task 2 asked us to revise Task 1, not defend it.</p>
          </div>
        </div>
        <div className="change-list">
          {changedViews.map((change) => (
            <div className="change-row" key={change.before}>
              <div>
                <span className="change-label">We first thought</span>
                <p>{change.before}</p>
              </div>
              <span className="change-arrow" aria-hidden="true">
                <Icon name="arrow-right" size={15} />
              </span>
              <div>
                <span className="change-label">The conversations showed</span>
                <p>{change.now}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="implications-title">
        <div className="section-head">
          <div>
            <h2 id="implications-title">What this means for SparkL</h2>
            <p className="section-sub">The design constraints we carried into the prototype.</p>
          </div>
        </div>
        <ul className="check-list two-col">
          {implications.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="evidence-section" aria-labelledby="thin-title">
        <div className="section-head">
          <div>
            <h2 id="thin-title">Where the evidence is still thin</h2>
            <p className="section-sub">Recorded honestly in Task 2's submission checklist.</p>
          </div>
        </div>
        <div className="notice notice--warning">
          <Icon name="alert" size={15} />
          <span>
            Six named interviewees are documented against a ten-conversation requirement. Most are
            Rotaract members or project organisers. More teachers, tutors, children, parents, Kannada
            teachers, speech-language therapists and special educators still need to be heard. Eight photos
            and two videos were documented with transcriptions.
          </span>
        </div>
      </section>
    </div>
  );
}

function LandscapeTab() {
  return (
    <div className="evidence-tab">
      <section className="evidence-section evidence-section--first" aria-labelledby="tools-title">
        <div className="section-head">
          <div>
            <h2 id="tools-title">What already exists</h2>
            <p className="section-sub">
              Reviewed from published sources and product pages. The apps were not independently installed
              or tested for Task 3.
            </p>
          </div>
          <a className="section-action" href="/docs/sparkl-task-3-landscape.pdf" target="_blank" rel="noreferrer">
            Task 3 PDF
          </a>
        </div>
        <div className="tool-list">
          {tools.map((tool) => (
            <article className="tool-row" key={tool.name}>
              <div className="tool-identity">
                <h3>{tool.name}</h3>
                <p className="tool-for">{tool.forWhom}</p>
                <p className="tool-meta">{tool.cost}</p>
                <p className="tool-meta">Maintained by {tool.maintained}</p>
              </div>
              <div className="tool-body">
                <p>{tool.what}</p>
                <p className="tool-limits">
                  <strong>Limit for SparkL:</strong> {tool.limits}
                </p>
              </div>
              <div className="tool-tags">
                <ToolTag label="Kannada" value={tool.kannada} />
                <ToolTag label="Offline" value={tool.offline} />
                <ToolTag label="Adult role" value={tool.adult} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="cases-title">
        <div className="section-head">
          <div>
            <h2 id="cases-title">What the evidence says about TaRL</h2>
            <p className="section-sub">Assessment matters when it changes what happens next.</p>
          </div>
        </div>
        <div className="case-grid">
          {caseStudies.map((study) => (
            <article className="case-card" key={study.place}>
              <p className="case-place">{study.place}</p>
              <p className="case-result literata">{study.result}</p>
              <p className="case-unit">{study.unit}</p>
              <p className="case-body">{study.what}</p>
              <p className="case-detail">{study.detail}</p>
              <p className="case-caution">{study.caution}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="gaps-title">
        <div className="section-head">
          <div>
            <h2 id="gaps-title">The gap none of them fill</h2>
            <p className="section-sub">Six provisional gaps from the desk research, to be validated with SparkL educators.</p>
          </div>
        </div>
        <div className="gap-grid">
          {landscapeGaps.map((gap) => (
            <article className="gap-item" key={gap.title}>
              <h3>{gap.title}</h3>
              <p>{gap.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="needed-title">
        <div className="section-head">
          <div>
            <h2 id="needed-title">Evidence still required</h2>
            <p className="section-sub">The desk research is not a field test.</p>
          </div>
        </div>
        <ul className="check-list two-col">
          <li>Install Google Read Along on the actual Android device; screenshot the language list and document the Kannada result.</li>
          <li>Test Chimple and Khan Academy Kids if feasible; capture language options, progress views and offline behaviour.</li>
          <li>Ask Rocket Learning about languages, offline features, data export, implementation cost and support.</li>
          <li>Observe SparkL's current paper register or spreadsheet with personal data hidden; time the workflow before replacing it.</li>
          <li>Use the Task 2 notes to validate or revise each gap; record which stakeholder raised it without identifying a child.</li>
        </ul>
      </section>
    </div>
  );
}

function ApproachTab() {
  return (
    <div className="evidence-tab">
      <section className="approach-intro">
        <div>
          <p className="evidence-kicker">Task 4 · possible solutions</p>
          <h2 className="approach-statement literata">
            Start with the smallest useful loop: an offline, educator-led assessment and a short record.
          </h2>
        </div>
        <div>
          <p>
            Speech, AI and dashboards are deliberately outside version one. The first job is to make the
            educator's current judgement faster to record, and to prove that the result matches the rubric.
          </p>
          <p className="approach-unknown">
            We have not measured SparkL's assessment time or cost, confirmed the Kannada sequence and pass
            rules, checked the actual shared device, or observed a full assessment. Cost includes devices,
            charging, teacher training, maintenance and staff time — not only software.
          </p>
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="solutions-title">
        <div className="section-head">
          <div>
            <h2 id="solutions-title">Three possible solutions</h2>
            <p className="section-sub">Ranged from the version we would try first to the experiment that needs a partner.</p>
          </div>
          <a className="section-action" href="/docs/sparkl-task-4-approach.pdf" target="_blank" rel="noreferrer">
            Task 4 PDF
          </a>
        </div>
        <div className="solution-list">
          {solutions.map((solution) => (
            <article className="solution-row" key={solution.id}>
              <div className="solution-status">
                <Pill
                  tone={
                    solution.status === "Version one"
                      ? "positive"
                      : solution.status === "Next"
                        ? "neutral"
                        : "warning"
                  }
                >
                  {solution.status}
                </Pill>
              </div>
              <div className="solution-body">
                <h3>{solution.title}</h3>
                <p>{solution.body}</p>
                <p className="solution-why">
                  <strong>Why:</strong> {solution.why}
                </p>
                <p className="solution-funding">
                  <strong>Funding:</strong> {solution.funding}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="steps-title">
        <div className="section-head">
          <div>
            <h2 id="steps-title">What we would do first</h2>
            <p className="section-sub">Six steps before expanding beyond one centre.</p>
          </div>
        </div>
        <div className="approach-steps">
          {approachSteps.map((step, index) => (
            <article className="approach-step" key={step.title}>
              <span className="approach-step-number literata">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="hard-title">
        <div className="section-head">
          <div>
            <h2 id="hard-title">The hard questions</h2>
            <p className="section-sub">The four answers that keep the product honest.</p>
          </div>
        </div>
        <div className="hard-list">
          {hardQuestions.map((item) => (
            <article className="hard-question" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="success-title">
        <div className="section-head">
          <div>
            <h2 id="success-title">What “working” would mean</h2>
            <p className="section-sub">The checks Task 4 commits to before a pilot expands.</p>
          </div>
        </div>
        <ul className="check-list">
          {successCriteria.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="evidence-section" aria-labelledby="need-title">
        <div className="section-head">
          <div>
            <h2 id="need-title">What we need</h2>
            <p className="section-sub">People, access and facts the prototype cannot supply.</p>
          </div>
        </div>
        <div className="need-grid">
          <div>
            <h3>From SparkL</h3>
            <ul className="plain-list">
              <li>Educators and coordinators to explain the rubric.</li>
              <li>The official level names, pass rules and borderline rules.</li>
              <li>A partner centre and the actual shared device.</li>
              <li>A data-approval and consent process.</li>
            </ul>
          </div>
          <div>
            <h3>From a Kannada educator</h3>
            <ul className="plain-list">
              <li>Review of the akshara and kagunita sequence.</li>
              <li>Review of the word, paragraph and story examples.</li>
              <li>Review of the Kannada instructions and examples.</li>
            </ul>
          </div>
          <div>
            <h3>From a technical mentor</h3>
            <ul className="plain-list">
              <li>Offline storage and shared-device account design.</li>
              <li>Audio privacy and speech-service behaviour.</li>
              <li>A realistic low-end device test plan.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="team-title">
        <div className="section-head">
          <div>
            <h2 id="team-title">Team Syndicate</h2>
            <p className="section-sub">The people behind the four task notes.</p>
          </div>
          <a className="section-action" href="/docs/sparkl-skill-map.pdf" target="_blank" rel="noreferrer">
            Skill map
          </a>
        </div>
        <div className="team-grid">
          {team.map((member) => (
            <article className="team-member" key={member.name}>
              <h3>{member.name}</h3>
              <p className="team-branch">{member.branch}</p>
              <p className="team-strengths">{member.strengths}</p>
              <p className="team-contribution">{member.contribution}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="evidence-section" aria-labelledby="story-title">
        <div className="section-head">
          <div>
            <h2 id="story-title">The four-minute story</h2>
            <p className="section-sub">How the team presented the work in Task 4.</p>
          </div>
        </div>
        <details className="video-outline">
          <summary>Open the video outline</summary>
          <div className="video-lines">
            <p><strong>Vismay:</strong> the grade may not show the actual level in every subject. We need to understand how SparkL assesses before deciding what to build.</p>
            <p><strong>Sufiyan:</strong> children have different strengths; teachers must stay involved; language, facilities and privacy matter.</p>
            <p><strong>Hajira:</strong> ASER and TaRL offer useful ideas, but no complete Kannada-first, offline assessment and record workflow was confirmed.</p>
            <p><strong>Aashrith:</strong> start with a simple offline, educator-led assessment; observe the process, agree the rules, then test a small prototype.</p>
          </div>
        </details>
      </section>
    </div>
  );
}

function ToolTag({ label, value }: { label: string; value: string }) {
  const lower = value.toLowerCase();
  const tone =
    lower.startsWith("yes") || lower.startsWith("after")
      ? "positive"
      : lower.startsWith("no")
        ? "negative"
        : lower.startsWith("unconfirmed") || lower.startsWith("not") || lower.startsWith("selected")
          ? "warning"
          : "neutral";
  return (
    <div className={`tool-tag is-${tone}`}>
      <span className={`status-dot status-dot--${tone === "neutral" ? "muted" : tone}`} />
      <span className="tool-tag-label">{label}</span>
      <span className="tool-tag-value">{value}</span>
    </div>
  );
}
