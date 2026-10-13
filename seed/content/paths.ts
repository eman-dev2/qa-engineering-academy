/**
 * Curriculum seed: learning paths, modules and lesson references in English and Arabic.
 *
 * - `published` lessons are loaded from seed/content/lessons/<path>/<slug>.<locale>.md
 * - `planned` lessons are outlines only (title, summary, objectives). They are shown as
 *   "Planned" on path pages and are never presented as readable lessons.
 */
import type { SkillId } from "../../src/content/skills";
import type { ContentStatus, Level } from "../../src/lib/db/schema";

type L<T> = { en: T; ar: T };

export type SeedLessonRef =
  | { slug: string; published: true }
  | {
      slug: string;
      published: false;
      minutes: number;
      level: Level;
      skills: SkillId[];
      outline: L<{ title: string; summary: string; objectives: string[] }>;
    };

export type SeedModule = { slug: string; text: L<{ title: string; summary: string }>; lessons: SeedLessonRef[] };

export type SeedPath = {
  slug: string;
  status: ContentStatus;
  startsAt: Level;
  leadsTo: Level;
  skills: SkillId[];
  text: L<{ title: string; summary: string; goal: string; prerequisites: string[]; outcomes: string[]; milestones: string[] }>;
  modules: SeedModule[];
};

const planned = (
  slug: string,
  minutes: number,
  level: Level,
  skills: SkillId[],
  outline: L<{ title: string; summary: string; objectives: string[] }>,
): SeedLessonRef => ({ slug, published: false, minutes, level, skills, outline });

const pub = (slug: string): SeedLessonRef => ({ slug, published: true });

export const seedPaths: SeedPath[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: "qa-foundations",
    status: "published",
    startsAt: "Beginner",
    leadsTo: "Junior",
    skills: ["fundamentals", "manual", "test-management"],
    text: {
      en: {
        title: "QA Foundations",
        summary:
          "What testing is for, where it fits in delivery, and how to design tests and report defects that a team can act on.",
        goal: "Work as a junior tester on a product team: design a focused test set from a requirement and report what you find so it gets fixed.",
        prerequisites: [
          "No testing experience needed.",
          "Comfort using web applications and reading short technical documents.",
        ],
        outcomes: [
          "Explain the difference between QA, QC, testing and quality engineering using examples from your own team.",
          "Place testing activities on a delivery timeline and choose the right test level for a given risk.",
          "Derive test cases from a requirement using equivalence partitioning, boundary values and decision tables.",
          "Write a defect report that a developer can reproduce without asking you a question.",
        ],
        milestones: [
          "Finish module 1 and describe your current team's test process in STLC terms.",
          "Finish module 2 and produce a test design for a real form in a product you use.",
        ],
      },
      ar: {
        title: "أساسيات ضمان الجودة",
        summary:
          "ما الغاية من الاختبار، وأين يقع في دورة التسليم، وكيف تصمّم اختبارات وتكتب تقارير أخطاء يستطيع الفريق التصرّف بناءً عليها.",
        goal: "أن تعمل مختبرًا مبتدئًا في فريق منتج: تصمّم مجموعة اختبارات مركّزة انطلاقًا من متطلب، وتبلّغ عمّا تجده بطريقة تضمن إصلاحه.",
        prerequisites: [
          "لا تحتاج إلى أي خبرة سابقة في الاختبار.",
          "أن تكون مرتاحًا لاستخدام تطبيقات الويب وقراءة مستندات تقنية قصيرة.",
        ],
        outcomes: [
          "أن تشرح الفرق بين ضمان الجودة (QA) وضبط الجودة (QC) والاختبار وهندسة الجودة بأمثلة من فريقك.",
          "أن تضع أنشطة الاختبار على الخط الزمني للتسليم وتختار مستوى الاختبار المناسب لكل خطر.",
          "أن تستخرج حالات اختبار من متطلب باستخدام تقسيم التكافؤ والقيم الحدّية وجداول القرار.",
          "أن تكتب تقرير خطأ يستطيع المطوّر إعادة إنتاجه دون أن يسألك أي سؤال.",
        ],
        milestones: [
          "أنهِ الوحدة الأولى وصِف عملية الاختبار الحالية في فريقك بمصطلحات دورة حياة الاختبار (STLC).",
          "أنهِ الوحدة الثانية وأعِدّ تصميم اختبار لنموذج حقيقي في منتج تستخدمه.",
        ],
      },
    },
    modules: [
      {
        slug: "thinking-like-a-tester",
        text: {
          en: { title: "Thinking like a tester", summary: "The vocabulary and mental models the rest of your career is built on." },
          ar: { title: "التفكير كمختبر", summary: "المفردات والنماذج الذهنية التي تُبنى عليها مسيرتك المهنية كلها." },
        },
        lessons: [pub("what-quality-means"), pub("testing-across-the-lifecycle")],
      },
      {
        slug: "designing-tests",
        text: {
          en: {
            title: "Designing tests and reporting defects",
            summary: "Systematic techniques that find more defects with fewer test cases, and reports that get them fixed.",
          },
          ar: {
            title: "تصميم الاختبارات والإبلاغ عن الأخطاء",
            summary: "تقنيات منهجية تكشف أخطاء أكثر بحالات اختبار أقل، وتقارير تضمن إصلاحها.",
          },
        },
        lessons: [pub("equivalence-partitioning-and-boundaries"), pub("decision-tables"), pub("writing-defect-reports")],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "practical-manual-testing",
    status: "published",
    startsAt: "Junior",
    leadsTo: "Mid-level",
    skills: ["manual", "test-management"],
    text: {
      en: {
        title: "Practical Manual Testing",
        summary:
          "Go beyond single-field techniques: model behaviour with state transitions, explore with charters, and choose regression tests your team can afford.",
        goal: "Test a feature with stateful behaviour end to end, combining systematic and exploratory techniques, and justify what you re-test before each release.",
        prerequisites: ["QA Foundations, or equivalent experience with partitions, boundaries and decision tables."],
        outcomes: [
          "Model a feature as a state transition diagram and derive valid and invalid transition tests.",
          "Plan and run a time-boxed exploratory session with a charter, and report what it found.",
          "Reduce a large combination space with pairwise testing.",
          "Select a risk-based regression set for a release and explain what you left out.",
        ],
        milestones: [
          "Finish module 1 and model a real feature (an order, a subscription, a support ticket) as a state machine.",
          "Finish module 2 and run a recorded exploratory session on a product you use.",
        ],
      },
      ar: {
        title: "الاختبار اليدوي التطبيقي",
        summary:
          "تجاوز تقنيات الحقل الواحد: نمذج السلوك بانتقالات الحالة، واستكشف بمواثيق اختبار، واختر اختبارات انحدار يستطيع فريقك تحمّل كلفتها.",
        goal: "أن تختبر ميزة ذات سلوك يعتمد على الحالة من البداية إلى النهاية، جامعًا بين التقنيات المنهجية والاستكشافية، وأن تبرّر ما تعيد اختباره قبل كل إصدار.",
        prerequisites: ["مسار أساسيات ضمان الجودة، أو خبرة مكافئة في تقسيم التكافؤ والقيم الحدّية وجداول القرار."],
        outcomes: [
          "أن تنمذج ميزة كمخطط انتقالات حالة وتستخرج منه اختبارات للانتقالات الصحيحة وغير الصحيحة.",
          "أن تخطط جلسة اختبار استكشافي محددة الوقت بميثاق (charter) وتنفذها وتبلّغ عمّا وجدته.",
          "أن تقلّص فضاء تركيبات كبيرًا باستخدام الاختبار الثنائي (pairwise).",
          "أن تختار مجموعة اختبارات انحدار مبنية على المخاطر لإصدار ما، وتشرح ما استبعدته.",
        ],
        milestones: [
          "أنهِ الوحدة الأولى ونمذج ميزة حقيقية (طلب شراء أو اشتراك أو تذكرة دعم) كآلة حالات.",
          "أنهِ الوحدة الثانية ونفّذ جلسة استكشافية موثّقة على منتج تستخدمه.",
        ],
      },
    },
    modules: [
      {
        slug: "modelling-behaviour",
        text: {
          en: { title: "Modelling behaviour", summary: "Techniques for features whose output depends on history, not just input." },
          ar: { title: "نمذجة السلوك", summary: "تقنيات للميزات التي تعتمد مخرجاتها على ما حدث سابقًا، لا على المدخلات وحدها." },
        },
        lessons: [
          pub("state-transition-testing"),
          planned("pairwise-testing", 20, "Junior", ["manual"], {
            en: {
              title: "Pairwise testing for large combinations",
              summary: "Cover every pair of parameter values with a fraction of the full combination set, and know when pairs aren't enough.",
              objectives: [
                "Explain why most combination defects involve two parameters.",
                "Generate a pairwise set for a configuration with four or more parameters.",
                "Add constraint and risk-based combinations that pairwise alone would miss.",
              ],
            },
            ar: {
              title: "الاختبار الثنائي للتركيبات الكبيرة",
              summary: "غطِّ كل زوج من قيم المعاملات بجزء صغير من مجموع التركيبات الكاملة، واعرف متى لا تكفي الأزواج.",
              objectives: [
                "أن تشرح لماذا تنطوي معظم أخطاء التركيبات على معاملين اثنين.",
                "أن تولّد مجموعة اختبار ثنائية لإعداد فيه أربعة معاملات أو أكثر.",
                "أن تضيف تركيبات تفرضها القيود والمخاطر ولا يلتقطها الاختبار الثنائي وحده.",
              ],
            },
          }),
        ],
      },
      {
        slug: "exploring-and-regression",
        text: {
          en: { title: "Exploration and regression", summary: "Structured exploration, and deciding what to re-test when time is short." },
          ar: { title: "الاستكشاف والانحدار", summary: "استكشاف منظّم، وتحديد ما يُعاد اختباره حين يضيق الوقت." },
        },
        lessons: [
          planned("exploratory-testing-with-charters", 22, "Junior", ["manual"], {
            en: {
              title: "Exploratory testing with charters",
              summary: "Run time-boxed, focused exploration sessions and turn them into evidence a team can use.",
              objectives: [
                "Write a charter that names a target, resources and the information you're after.",
                "Take session notes that separate bugs, questions and coverage.",
                "Debrief a session in five minutes with clear follow-ups.",
              ],
            },
            ar: {
              title: "الاختبار الاستكشافي بالمواثيق",
              summary: "نفّذ جلسات استكشاف مركّزة ومحددة الوقت، وحوّلها إلى أدلة يستفيد منها الفريق.",
              objectives: [
                "أن تكتب ميثاقًا يحدد الهدف والموارد والمعلومة التي تبحث عنها.",
                "أن تدوّن ملاحظات جلسة تفصل بين الأخطاء والأسئلة والتغطية.",
                "أن تلخّص جلسة في خمس دقائق مع خطوات متابعة واضحة.",
              ],
            },
          }),
          planned("choosing-a-regression-set", 18, "Junior", ["manual", "test-management"], {
            en: {
              title: "Choosing a regression set",
              summary: "Decide what to re-test for a release using change impact, risk and history instead of re-running everything.",
              objectives: [
                "Map a code change to the features and data it can affect.",
                "Prioritise regression tests by risk and defect history.",
                "Document what was deliberately not re-tested and why.",
              ],
            },
            ar: {
              title: "اختيار مجموعة اختبارات الانحدار",
              summary: "حدّد ما تعيد اختباره في الإصدار بناءً على أثر التغيير والمخاطر والتاريخ، بدل إعادة تشغيل كل شيء.",
              objectives: [
                "أن تربط تغييرًا في الكود بالميزات والبيانات التي قد يؤثر فيها.",
                "أن ترتّب أولويات اختبارات الانحدار حسب المخاطر وتاريخ الأخطاء.",
                "أن توثّق ما لم يُعَد اختباره عمدًا وسبب ذلك.",
              ],
            },
          }),
        ],
      },
      {
        slug: "working-in-a-delivery-team",
        text: {
          en: { title: "Working in a delivery team", summary: "Test cases, tools and workflows that keep a team aligned." },
          ar: { title: "العمل ضمن فريق تسليم", summary: "حالات اختبار وأدوات وطرق عمل تُبقي الفريق متّسقًا." },
        },
        lessons: [
          planned("test-cases-others-can-run", 16, "Junior", ["manual", "test-management"], {
            en: {
              title: "Test cases other people can run",
              summary: "Write test cases with the right level of detail for their audience, from checklists to fully scripted steps.",
              objectives: [
                "Choose between checklists, high-level and low-level test cases for a given context.",
                "Write preconditions, data and expected results that remove ambiguity.",
                "Link test cases to requirements for traceability.",
              ],
            },
            ar: {
              title: "حالات اختبار يستطيع غيرك تنفيذها",
              summary: "اكتب حالات اختبار بمستوى التفصيل المناسب لمن سيقرؤها، من قوائم التحقق إلى الخطوات المكتوبة بالكامل.",
              objectives: [
                "أن تختار بين قوائم التحقق وحالات الاختبار عالية المستوى ومنخفضة المستوى حسب السياق.",
                "أن تكتب شروطًا مسبقة وبيانات ونتائج متوقعة تزيل أي غموض.",
                "أن تربط حالات الاختبار بالمتطلبات لتحقيق إمكانية التتبّع (traceability).",
              ],
            },
          }),
          planned("testing-in-jira-and-azure-devops", 18, "Junior", ["test-management"], {
            en: {
              title: "Testing workflows in Jira and Azure DevOps",
              summary: "Set up issue types, statuses and links so defects, stories and test evidence stay connected.",
              objectives: [
                "Configure a defect workflow that matches your team's lifecycle.",
                "Link defects, stories and test runs for end-to-end traceability.",
                "Build a filter or query that answers a release question.",
              ],
            },
            ar: {
              title: "سير عمل الاختبار في Jira وAzure DevOps",
              summary: "اضبط أنواع البطاقات وحالاتها وروابطها لتبقى الأخطاء والقصص وأدلة الاختبار مترابطة.",
              objectives: [
                "أن تهيّئ سير عمل للأخطاء يطابق دورة الحياة في فريقك.",
                "أن تربط الأخطاء والقصص وجولات الاختبار لتحقيق تتبّع شامل.",
                "أن تبني مرشّحًا (filter) أو استعلامًا يجيب عن سؤال يخص الإصدار.",
              ],
            },
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "api-testing-essentials",
    status: "published",
    startsAt: "Mid-level",
    leadsTo: "Senior",
    skills: ["api", "security", "programming", "sql"],
    text: {
      en: {
        title: "API Testing Essentials",
        summary:
          "Test the layer where most business rules actually live: HTTP, REST endpoints, authorization and response contracts.",
        goal: "Design and automate a meaningful test set for a REST endpoint, including the negative and security cases most teams forget.",
        prerequisites: [
          "QA Foundations, or equivalent experience designing test cases.",
          "Basic command-line use. Code samples use curl and TypeScript, and each one is explained.",
        ],
        outcomes: [
          "Read and construct HTTP requests and responses, and explain what each part means for testing.",
          "Design positive, negative and edge-case tests for a REST endpoint, including idempotency.",
          "Distinguish authentication from authorization failures and test for broken object-level authorization.",
          "Validate responses against a JSON Schema in an automated Playwright API test.",
        ],
        milestones: [
          "Finish module 1 and test a public API from the command line.",
          "Finish module 2 and commit an automated API test with schema validation.",
        ],
      },
      ar: {
        title: "أساسيات اختبار الواجهات البرمجية (API)",
        summary:
          "اختبر الطبقة التي تعيش فيها معظم قواعد العمل فعليًا: بروتوكول HTTP ونقاط REST والتفويض وعقود الاستجابة.",
        goal: "أن تصمّم مجموعة اختبارات ذات معنى لنقطة REST وتؤتمتها، بما فيها الحالات السلبية والأمنية التي تنساها معظم الفرق.",
        prerequisites: [
          "مسار أساسيات ضمان الجودة، أو خبرة مكافئة في تصميم حالات الاختبار.",
          "استخدام أساسي لسطر الأوامر. تستخدم الأمثلة curl وTypeScript، مع شرح لكل منها.",
        ],
        outcomes: [
          "أن تقرأ طلبات HTTP واستجاباتها وتكتبها، وتشرح ما يعنيه كل جزء منها للاختبار.",
          "أن تصمّم اختبارات إيجابية وسلبية وحدّية لنقطة REST، بما فيها خاصية التكرار الآمن (idempotency).",
          "أن تميّز إخفاقات المصادقة (authentication) من إخفاقات التفويض (authorization) وتختبر خلل التفويض على مستوى الكائن.",
          "أن تتحقق من الاستجابات مقابل مخطط JSON Schema في اختبار API مؤتمت بأداة Playwright.",
        ],
        milestones: [
          "أنهِ الوحدة الأولى واختبر واجهة برمجية عامة من سطر الأوامر.",
          "أنهِ الوحدة الثانية وأضِف إلى مستودعك اختبار API مؤتمتًا يتحقق من المخطط.",
        ],
      },
    },
    modules: [
      {
        slug: "http-for-testers",
        text: {
          en: { title: "HTTP for testers", summary: "The protocol every web and mobile product depends on, from a tester's point of view." },
          ar: { title: "بروتوكول HTTP للمختبرين", summary: "البروتوكول الذي يعتمد عليه كل منتج ويب وجوال، من منظور المختبر." },
        },
        lessons: [pub("anatomy-of-an-http-exchange"), pub("designing-tests-for-a-rest-endpoint")],
      },
      {
        slug: "access-and-contracts",
        text: {
          en: {
            title: "Access control and contracts",
            summary: "The two areas where API defects are most expensive: who can do what, and what the response promises.",
          },
          ar: {
            title: "التحكم في الوصول والعقود",
            summary: "المجالان اللذان تكون فيهما أخطاء الواجهات البرمجية الأعلى كلفة: من يستطيع فعل ماذا، وما الذي تعد به الاستجابة.",
          },
        },
        lessons: [pub("authentication-vs-authorization"), pub("schema-validation-in-automated-tests")],
      },
      {
        slug: "data-behind-the-api",
        text: {
          en: { title: "The data behind the API", summary: "Check what the API stored, not just what it returned." },
          ar: { title: "البيانات خلف الواجهة البرمجية", summary: "تحقق ممّا خزّنته الواجهة البرمجية، لا ممّا أعادته فقط." },
        },
        lessons: [
          planned("sql-for-api-testers", 26, "Mid-level", ["sql", "api"], {
            en: {
              title: "SQL for API testers",
              summary: "Use SELECT, JOIN and aggregation to verify that an API's writes are complete, consistent and correctly scoped.",
              objectives: [
                "Write SELECT queries with joins to check related records after an API call.",
                "Use aggregation to detect duplicates and totals that don't add up.",
                "Set up and clean test data without affecting other tests.",
              ],
            },
            ar: {
              title: "لغة SQL لمختبري الواجهات البرمجية",
              summary: "استخدم SELECT وJOIN والتجميع للتحقق من أن عمليات الكتابة التي تجريها الواجهة البرمجية كاملة ومتسقة ومحصورة في نطاقها الصحيح.",
              objectives: [
                "أن تكتب استعلامات SELECT مع ربط الجداول (JOIN) للتحقق من السجلات المرتبطة بعد استدعاء API.",
                "أن تستخدم دوال التجميع لكشف السجلات المكررة والمجاميع غير المتطابقة.",
                "أن تجهّز بيانات الاختبار وتنظّفها دون التأثير في اختبارات أخرى.",
              ],
            },
          }),
          planned("consumer-driven-contract-testing", 24, "Mid-level", ["api", "advanced-qe"], {
            en: {
              title: "Consumer-driven contract testing",
              summary: "Let each API consumer publish what it depends on, and stop breaking changes before deployment.",
              objectives: [
                "Explain how consumer-driven contracts differ from schema validation.",
                "Describe the consumer test, the contract file and provider verification.",
                "Decide when contract tests replace, and when they complement, integration tests.",
              ],
            },
            ar: {
              title: "اختبار العقود الذي يقوده المستهلك",
              summary: "دع كل مستهلك للواجهة البرمجية ينشر ما يعتمد عليه، وأوقِف التغييرات الكاسرة قبل النشر.",
              objectives: [
                "أن تشرح كيف يختلف العقد الذي يقوده المستهلك عن التحقق من المخطط.",
                "أن تصف اختبار المستهلك وملف العقد وتحقق المزوّد.",
                "أن تقرر متى تحل اختبارات العقود محل اختبارات التكامل ومتى تكمّلها.",
              ],
            },
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "playwright-with-typescript",
    status: "published",
    startsAt: "Junior",
    leadsTo: "Automation",
    skills: ["ui-automation", "programming", "cicd"],
    text: {
      en: {
        title: "Web Automation with Playwright and TypeScript",
        summary:
          "Build browser tests that stay reliable as a product grows: resilient locators, retrying assertions, fixtures, test data and CI.",
        goal: "Design and maintain a Playwright test suite that a team trusts: fast, isolated, readable and running on every pull request.",
        prerequisites: [
          "Basic TypeScript or JavaScript: variables, functions and async/await.",
          "Test design experience from QA Foundations or equivalent.",
        ],
        outcomes: [
          "Choose locators that reflect how users perceive the page and survive markup changes.",
          "Explain Playwright's auto-waiting and web-first assertions, and remove fixed sleeps from a test.",
          "Structure a suite with fixtures and page objects without hiding what each test does.",
          "Run the suite in CI with traces and reports that make failures quick to diagnose.",
        ],
        milestones: [
          "Finish module 1 and automate three critical flows of a demo app with no fixed waits.",
          "Finish module 2 and run your suite in a CI pipeline on every push.",
        ],
      },
      ar: {
        title: "أتمتة الويب باستخدام Playwright وTypeScript",
        summary:
          "ابنِ اختبارات متصفح تبقى موثوقة مع نمو المنتج: محدّدات عناصر متينة، وتحققات تعيد المحاولة تلقائيًا، وتجهيزات (fixtures)، وبيانات اختبار، وتكامل مستمر.",
        goal: "أن تصمّم مجموعة اختبارات Playwright وتصونها بحيث يثق بها الفريق: سريعة ومعزولة ومقروءة وتعمل مع كل طلب دمج.",
        prerequisites: [
          "معرفة أساسية بـ TypeScript أو JavaScript: المتغيرات والدوال وasync/await.",
          "خبرة في تصميم الاختبارات من مسار أساسيات ضمان الجودة أو ما يعادلها.",
        ],
        outcomes: [
          "أن تختار محدّدات عناصر (locators) تعكس طريقة إدراك المستخدم للصفحة وتصمد أمام تغيّر الشيفرة.",
          "أن تشرح الانتظار التلقائي في Playwright والتحققات المعتمدة على الويب، وتزيل فترات الانتظار الثابتة من الاختبار.",
          "أن تنظّم مجموعة الاختبارات بالتجهيزات وكائنات الصفحات دون إخفاء ما يفعله كل اختبار.",
          "أن تشغّل المجموعة في التكامل المستمر مع تتبّعات وتقارير تسرّع تشخيص الإخفاقات.",
        ],
        milestones: [
          "أنهِ الوحدة الأولى وأتمِت ثلاثة مسارات حرجة في تطبيق تجريبي دون أي انتظار ثابت.",
          "أنهِ الوحدة الثانية وشغّل مجموعتك في خط تكامل مستمر مع كل دفع (push).",
        ],
      },
    },
    modules: [
      {
        slug: "reliable-first-tests",
        text: {
          en: { title: "Reliable first tests", summary: "Locators, actions and assertions that don't flake." },
          ar: { title: "اختبارات أولى موثوقة", summary: "محدّدات عناصر وإجراءات وتحققات لا تتذبذب نتائجها." },
        },
        lessons: [
          pub("locators-and-auto-waiting"),
          planned("web-first-assertions", 18, "Junior", ["ui-automation"], {
            en: {
              title: "Web-first assertions",
              summary: "Assertions that wait for the page to reach the expected state, and how to write your own.",
              objectives: [
                "Use toBeVisible, toHaveText and toHaveURL instead of reading values and comparing.",
                "Tune assertion timeouts deliberately rather than globally.",
                "Write a polling assertion for a condition Playwright doesn't cover.",
              ],
            },
            ar: {
              title: "التحققات المعتمدة على الويب (Web-first assertions)",
              summary: "تحققات تنتظر وصول الصفحة إلى الحالة المتوقعة، وكيف تكتب تحققاتك الخاصة.",
              objectives: [
                "أن تستخدم toBeVisible وtoHaveText وtoHaveURL بدل قراءة القيم ومقارنتها يدويًا.",
                "أن تضبط مهلات التحقق عن قصد لا بإعداد عام.",
                "أن تكتب تحققًا دوريًا (polling) لشرط لا تغطيه Playwright.",
              ],
            },
          }),
        ],
      },
      {
        slug: "scaling-a-suite",
        text: {
          en: { title: "Scaling a suite", summary: "Structure, data and pipelines for a growing suite." },
          ar: { title: "توسيع مجموعة الاختبارات", summary: "البنية والبيانات وخطوط التشغيل لمجموعة اختبارات تنمو." },
        },
        lessons: [
          planned("fixtures-and-page-objects", 24, "Automation", ["ui-automation", "programming"], {
            en: {
              title: "Fixtures and page objects",
              summary: "Share setup with fixtures and wrap page interactions without hiding what a test checks.",
              objectives: [
                "Create a custom fixture for an authenticated user.",
                "Write a page object that exposes intent-level methods.",
                "Keep assertions in tests, not in page objects.",
              ],
            },
            ar: {
              title: "التجهيزات وكائنات الصفحات",
              summary: "شارك الإعداد بالتجهيزات (fixtures)، وغلّف التفاعل مع الصفحة دون إخفاء ما يتحقق منه الاختبار.",
              objectives: [
                "أن تنشئ تجهيزًا مخصصًا لمستخدم مسجّل الدخول.",
                "أن تكتب كائن صفحة (page object) يعرض دوالًا تعبّر عن النية.",
                "أن تُبقي التحققات داخل الاختبارات لا داخل كائنات الصفحات.",
              ],
            },
          }),
          planned("test-data-and-isolation", 20, "Automation", ["ui-automation", "sql"], {
            en: {
              title: "Test data and isolation",
              summary: "Create the data each test needs, keep tests independent and run them in parallel safely.",
              objectives: [
                "Seed data through APIs instead of the UI.",
                "Use unique data per test to allow parallel runs.",
                "Clean up, or design tests that don't need cleanup.",
              ],
            },
            ar: {
              title: "بيانات الاختبار والعزل",
              summary: "أنشئ البيانات التي يحتاجها كل اختبار، وأبقِ الاختبارات مستقلة، وشغّلها بالتوازي بأمان.",
              objectives: [
                "أن تجهّز البيانات عبر الواجهات البرمجية بدل واجهة المستخدم.",
                "أن تستخدم بيانات فريدة لكل اختبار لتسمح بالتشغيل المتوازي.",
                "أن تنظّف بعد الاختبار، أو تصمّم اختبارات لا تحتاج إلى تنظيف.",
              ],
            },
          }),
          planned("running-playwright-in-ci", 20, "Automation", ["ui-automation", "cicd"], {
            en: {
              title: "Running Playwright in CI",
              summary: "Run the suite on every pull request with sharding, retries used honestly, traces and reports.",
              objectives: [
                "Configure a GitHub Actions workflow for Playwright.",
                "Collect traces and reports as build artifacts.",
                "Report flaky tests instead of hiding them behind retries.",
              ],
            },
            ar: {
              title: "تشغيل Playwright في التكامل المستمر",
              summary: "شغّل المجموعة مع كل طلب دمج بالتقسيم (sharding)، واستخدام نزيه لإعادة المحاولة، وتتبّعات وتقارير.",
              objectives: [
                "أن تهيّئ سير عمل GitHub Actions لأداة Playwright.",
                "أن تحفظ التتبّعات والتقارير كمخرجات للبناء.",
                "أن تبلّغ عن الاختبارات المتذبذبة بدل إخفائها خلف إعادة المحاولة.",
              ],
            },
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "senior-quality-engineering",
    status: "published",
    startsAt: "Senior",
    leadsTo: "Head of QE",
    skills: ["advanced-qe", "ui-automation", "performance"],
    text: {
      en: {
        title: "Senior Quality Engineering",
        summary:
          "Keep quality high in complex systems: trustworthy test suites, strategy for distributed services, and the signals that show what's really happening in production.",
        goal: "Own the quality strategy for a service-based product: decide what to test at which level, keep the suite trustworthy and use production signals to find risk.",
        prerequisites: ["Several years of hands-on testing, including API testing and some automation."],
        outcomes: [
          "Diagnose a flaky test to its root cause and fix the cause rather than adding retries.",
          "Design a test strategy for a set of microservices across unit, contract, integration and end-to-end levels.",
          "Use logs, metrics and traces to investigate failures and decide where to test more.",
          "Run risk-based testing that stakeholders can understand and challenge.",
        ],
        milestones: [
          "Finish module 1 and reduce the flake rate of a real suite, with before-and-after numbers.",
          "Finish module 2 and present a risk-based strategy for a service you work on.",
        ],
      },
      ar: {
        title: "هندسة الجودة للمستوى الخبير",
        summary:
          "حافظ على جودة عالية في الأنظمة المعقدة: مجموعات اختبار جديرة بالثقة، واستراتيجية للخدمات الموزعة، ومؤشرات تكشف ما يحدث فعلًا في بيئة الإنتاج.",
        goal: "أن تتولى استراتيجية الجودة لمنتج قائم على الخدمات: تقرر ما يُختبر وعلى أي مستوى، وتُبقي مجموعة الاختبارات جديرة بالثقة، وتستخدم مؤشرات الإنتاج لكشف المخاطر.",
        prerequisites: ["سنوات من الاختبار العملي، بما فيه اختبار الواجهات البرمجية وبعض الأتمتة."],
        outcomes: [
          "أن تشخّص اختبارًا متذبذبًا حتى سببه الجذري، وتعالج السبب بدل إضافة إعادة المحاولة.",
          "أن تصمّم استراتيجية اختبار لمجموعة خدمات مصغّرة (microservices) عبر مستويات الوحدة والعقود والتكامل والاختبار الشامل.",
          "أن تستخدم السجلات والمقاييس والتتبّعات للتحقيق في الإخفاقات وتحديد أين تزيد الاختبار.",
          "أن تطبّق اختبارًا مبنيًا على المخاطر يفهمه أصحاب المصلحة ويستطيعون مناقشته.",
        ],
        milestones: [
          "أنهِ الوحدة الأولى وخفّض نسبة التذبذب في مجموعة اختبارات حقيقية، مع أرقام قبل وبعد.",
          "أنهِ الوحدة الثانية واعرض استراتيجية مبنية على المخاطر لخدمة تعمل عليها.",
        ],
      },
    },
    modules: [
      {
        slug: "trustworthy-test-suites",
        text: {
          en: { title: "Trustworthy test suites", summary: "A suite nobody trusts is worse than no suite." },
          ar: { title: "مجموعات اختبار جديرة بالثقة", summary: "مجموعة اختبارات لا يثق بها أحد أسوأ من عدم وجودها." },
        },
        lessons: [
          pub("diagnosing-flaky-tests"),
          planned("test-strategy-for-microservices", 28, "Senior", ["advanced-qe", "api"], {
            en: {
              title: "Test strategy for microservices",
              summary: "Decide what each test level owns when a feature spans several services and teams.",
              objectives: [
                "Map a feature's risks to unit, contract, integration and end-to-end tests.",
                "Keep end-to-end tests few and focused on critical journeys.",
                "Handle asynchronous messaging and eventual consistency in tests.",
              ],
            },
            ar: {
              title: "استراتيجية الاختبار للخدمات المصغّرة",
              summary: "قرّر ما يتولاه كل مستوى اختبار حين تمتد الميزة عبر عدة خدمات وفرق.",
              objectives: [
                "أن تربط مخاطر الميزة باختبارات الوحدة والعقود والتكامل والاختبار الشامل.",
                "أن تُبقي الاختبارات الشاملة قليلة ومركّزة على الرحلات الحرجة.",
                "أن تتعامل في الاختبارات مع الرسائل غير المتزامنة والاتساق النهائي (eventual consistency).",
              ],
            },
          }),
        ],
      },
      {
        slug: "quality-signals",
        text: {
          en: { title: "Quality signals", summary: "Evidence from production and from risk, not just test results." },
          ar: { title: "مؤشرات الجودة", summary: "أدلة من بيئة الإنتاج ومن المخاطر، لا من نتائج الاختبار وحدها." },
        },
        lessons: [
          planned("observability-for-testers", 24, "Senior", ["advanced-qe", "performance"], {
            en: {
              title: "Observability for testers",
              summary: "Use logs, metrics and traces to find where failures start and where testing should focus.",
              objectives: [
                "Follow a request across services with a trace or correlation ID.",
                "Read error-rate and latency dashboards to spot regressions after a release.",
                "Turn a production incident into new tests and monitors.",
              ],
            },
            ar: {
              title: "قابلية الرصد للمختبرين (Observability)",
              summary: "استخدم السجلات والمقاييس والتتبّعات لتعرف أين تبدأ الإخفاقات وأين يجب أن يتركز الاختبار.",
              objectives: [
                "أن تتتبع طلبًا عبر الخدمات بمعرّف تتبّع أو ارتباط.",
                "أن تقرأ لوحات معدّل الأخطاء وزمن الاستجابة لاكتشاف التراجعات بعد الإصدار.",
                "أن تحوّل حادثة في الإنتاج إلى اختبارات ومراقبات جديدة.",
              ],
            },
          }),
          planned("risk-based-testing-in-practice", 22, "Senior", ["advanced-qe", "test-management"], {
            en: {
              title: "Risk-based testing in practice",
              summary: "Identify, score and test product risks, and make the residual risk visible.",
              objectives: [
                "Run a short risk workshop with developers and product owners.",
                "Score risks by likelihood and impact and map them to test depth.",
                "Report residual risk in terms stakeholders understand.",
              ],
            },
            ar: {
              title: "الاختبار المبني على المخاطر عمليًا",
              summary: "حدّد مخاطر المنتج وقيّمها واختبرها، واجعل المخاطر المتبقية واضحة للجميع.",
              objectives: [
                "أن تدير ورشة مخاطر قصيرة مع المطورين ومالكي المنتج.",
                "أن تقيّم المخاطر حسب الاحتمال والأثر وتربطها بعمق الاختبار.",
                "أن تبلّغ عن المخاطر المتبقية بلغة يفهمها أصحاب المصلحة.",
              ],
            },
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "qa-leadership",
    status: "published",
    startsAt: "Senior",
    leadsTo: "Lead",
    skills: ["leadership", "test-management"],
    text: {
      en: {
        title: "QA Leadership",
        summary:
          "Lead quality without becoming the bottleneck: release decisions, defect triage, mentoring, and communicating risk to people who don't test.",
        goal: "Lead the quality work of a product team: make and explain release recommendations, run triage and grow the testers around you.",
        prerequisites: [
          "Experience as a senior tester or quality engineer.",
          "Some experience presenting test results to a team.",
        ],
        outcomes: [
          "Make a go/no-go recommendation from evidence and state the residual risk in business terms.",
          "Run a defect triage that ends with decisions, not a longer list.",
          "Mentor a junior tester with a structured growth plan.",
          "Communicate quality status to executives on one page.",
        ],
        milestones: [
          "Finish module 1 and lead the release recommendation for a real release.",
          "Finish module 2 and agree a growth plan with someone you mentor.",
        ],
      },
      ar: {
        title: "قيادة الجودة",
        summary:
          "قُد الجودة دون أن تصبح عنق الزجاجة: قرارات الإصدار، وفرز الأخطاء، والإرشاد، وإيصال المخاطر لمن لا يختبرون.",
        goal: "أن تقود عمل الجودة في فريق منتج: تقدّم توصيات الإصدار وتشرحها، وتدير فرز الأخطاء، وتطوّر المختبرين من حولك.",
        prerequisites: ["خبرة كمختبر خبير أو مهندس جودة.", "بعض الخبرة في عرض نتائج الاختبار على الفريق."],
        outcomes: [
          "أن تقدّم توصية «إطلاق أو عدم إطلاق» (go/no-go) مبنية على الأدلة، وتصف المخاطر المتبقية بلغة الأعمال.",
          "أن تدير جلسة فرز أخطاء تنتهي بقرارات، لا بقائمة أطول.",
          "أن ترشد مختبرًا مبتدئًا بخطة نمو منظّمة.",
          "أن توصل حالة الجودة للإدارة العليا في صفحة واحدة.",
        ],
        milestones: [
          "أنهِ الوحدة الأولى وتولَّ توصية الإصدار لإصدار حقيقي.",
          "أنهِ الوحدة الثانية واتفق على خطة نمو مع شخص ترشده.",
        ],
      },
    },
    modules: [
      {
        slug: "making-quality-decisions",
        text: {
          en: { title: "Making quality decisions", summary: "Turning test evidence into decisions the business can stand behind." },
          ar: { title: "اتخاذ قرارات الجودة", summary: "تحويل أدلة الاختبار إلى قرارات يستطيع العمل الوقوف خلفها." },
        },
        lessons: [
          pub("release-readiness-and-go-no-go"),
          planned("running-defect-triage", 18, "Lead", ["leadership", "test-management"], {
            en: {
              title: "Running defect triage",
              summary: "A short, regular meeting that turns new defects into decisions: fix, defer, reject or investigate.",
              objectives: [
                "Prepare a triage list that can be decided in 30 minutes.",
                "Facilitate severity and priority discussions with clear criteria.",
                "Record decisions so they don't get re-argued next week.",
              ],
            },
            ar: {
              title: "إدارة جلسات فرز الأخطاء",
              summary: "اجتماع قصير ومنتظم يحوّل الأخطاء الجديدة إلى قرارات: إصلاح أو تأجيل أو رفض أو تحقيق.",
              objectives: [
                "أن تجهّز قائمة فرز يمكن البتّ فيها خلال 30 دقيقة.",
                "أن تدير نقاشات الخطورة والأولوية بمعايير واضحة.",
                "أن توثّق القرارات كي لا يُعاد الجدال فيها الأسبوع التالي.",
              ],
            },
          }),
        ],
      },
      {
        slug: "growing-people-and-influence",
        text: {
          en: { title: "Growing people and influence", summary: "Leadership happens through other people." },
          ar: { title: "تنمية الأفراد والتأثير", summary: "القيادة تتحقق من خلال الآخرين." },
        },
        lessons: [
          planned("mentoring-testers", 20, "Lead", ["leadership", "career"], {
            en: {
              title: "Mentoring testers",
              summary: "Help a junior tester grow with goals, practice and feedback that make progress visible.",
              objectives: [
                "Agree growth goals tied to real work.",
                "Give feedback on test designs and defect reports that teaches, not just corrects.",
                "Recognise when to step back and let someone own a decision.",
              ],
            },
            ar: {
              title: "إرشاد المختبرين",
              summary: "ساعد مختبرًا مبتدئًا على النمو بأهداف وتدريب وتغذية راجعة تجعل التقدّم ملموسًا.",
              objectives: [
                "أن تتفق على أهداف نمو مرتبطة بعمل حقيقي.",
                "أن تقدّم ملاحظات على تصاميم الاختبار وتقارير الأخطاء تعلّم ولا تكتفي بالتصحيح.",
                "أن تعرف متى تتراجع خطوة وتترك لغيرك امتلاك القرار.",
              ],
            },
          }),
          planned("communicating-quality-to-stakeholders", 18, "Lead", ["leadership"], {
            en: {
              title: "Communicating quality to stakeholders",
              summary: "Explain quality status and risk to product, engineering and executives in language they use.",
              objectives: [
                "Write a one-page quality status for executives.",
                "Translate test findings into customer and business impact.",
                "Escalate early without creating alarm.",
              ],
            },
            ar: {
              title: "إيصال حالة الجودة لأصحاب المصلحة",
              summary: "اشرح حالة الجودة والمخاطر لفرق المنتج والهندسة والإدارة العليا باللغة التي يستخدمونها.",
              objectives: [
                "أن تكتب ملخص حالة جودة من صفحة واحدة للإدارة العليا.",
                "أن تترجم نتائج الاختبار إلى أثر على العملاء والأعمال.",
                "أن تصعّد المشكلات مبكرًا دون إثارة الذعر.",
              ],
            },
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "test-management",
    status: "published",
    startsAt: "Lead",
    leadsTo: "Manager",
    skills: ["test-management", "leadership"],
    text: {
      en: {
        title: "Test Management",
        summary: "Plan, estimate, measure and improve testing across projects: the craft of the test manager.",
        goal: "Plan and run the testing of a multi-team project: credible estimates, a clear strategy, metrics that drive decisions and a process that keeps improving.",
        prerequisites: ["Experience leading the testing for at least one team or project."],
        outcomes: [
          "Produce a test estimate with two independent techniques and explain its uncertainty.",
          "Write a test strategy and a test plan that a project can execute.",
          "Choose metrics that inform decisions and avoid metrics that drive bad behaviour.",
          "Run an evidence-based test process improvement cycle.",
        ],
        milestones: [
          "Finish module 1 and produce an estimate and plan for a real project.",
          "Finish module 2 and present a metrics dashboard and one improvement proposal.",
        ],
      },
      ar: {
        title: "إدارة الاختبار",
        summary: "خطّط للاختبار وقدّر جهده وقِسه وحسّنه عبر المشاريع: حرفة مدير الاختبار.",
        goal: "أن تخطط لاختبار مشروع متعدد الفرق وتديره: تقديرات موثوقة، واستراتيجية واضحة، ومقاييس تقود القرارات، وعملية تتحسن باستمرار.",
        prerequisites: ["خبرة في قيادة الاختبار لفريق أو مشروع واحد على الأقل."],
        outcomes: [
          "أن تُعدّ تقديرًا لجهد الاختبار بتقنيتين مستقلتين وتشرح هامش عدم اليقين فيه.",
          "أن تكتب استراتيجية اختبار وخطة اختبار يستطيع المشروع تنفيذهما.",
          "أن تختار مقاييس تدعم القرارات وتتجنب مقاييس تدفع إلى سلوك سيئ.",
          "أن تدير دورة تحسين لعملية الاختبار مبنية على الأدلة.",
        ],
        milestones: [
          "أنهِ الوحدة الأولى وأعِدّ تقديرًا وخطة لمشروع حقيقي.",
          "أنهِ الوحدة الثانية واعرض لوحة مقاييس ومقترح تحسين واحدًا.",
        ],
      },
    },
    modules: [
      {
        slug: "planning-and-estimating",
        text: {
          en: { title: "Planning and estimating", summary: "Credible plans start with honest estimates." },
          ar: { title: "التخطيط والتقدير", summary: "الخطط الموثوقة تبدأ بتقديرات صادقة." },
        },
        lessons: [
          pub("test-estimation-techniques"),
          planned("writing-a-test-strategy-and-plan", 26, "Manager", ["test-management"], {
            en: {
              title: "Writing a test strategy and a test plan",
              summary: "The difference between strategy and plan, and how to write each so people actually use it.",
              objectives: [
                "Separate long-lived strategy decisions from project-specific plans.",
                "Define scope, approach, environments, entry and exit criteria.",
                "Keep the documents short enough to be read and current enough to be trusted.",
              ],
            },
            ar: {
              title: "كتابة استراتيجية الاختبار وخطة الاختبار",
              summary: "الفرق بين الاستراتيجية والخطة، وكيف تكتب كلًّا منهما بحيث يستخدمه الناس فعلًا.",
              objectives: [
                "أن تفصل قرارات الاستراتيجية طويلة الأمد عن الخطط الخاصة بكل مشروع.",
                "أن تحدد النطاق والمنهجية والبيئات ومعايير الدخول والخروج.",
                "أن تُبقي المستندات قصيرة بما يكفي لتُقرأ، وحديثة بما يكفي ليوثق بها.",
              ],
            },
          }),
        ],
      },
      {
        slug: "measuring-and-improving",
        text: {
          en: { title: "Measuring and improving", summary: "Metrics that change decisions, and improvement that sticks." },
          ar: { title: "القياس والتحسين", summary: "مقاييس تغيّر القرارات، وتحسين يدوم." },
        },
        lessons: [
          planned("test-metrics-that-drive-decisions", 22, "Manager", ["test-management", "leadership"], {
            en: {
              title: "Test metrics that drive decisions",
              summary: "Choose a small set of metrics tied to questions people actually ask, and avoid vanity numbers.",
              objectives: [
                "Start from decisions and questions, then pick metrics.",
                "Recognise metrics that encourage gaming, such as raw defect counts per tester.",
                "Present trends with context instead of single numbers.",
              ],
            },
            ar: {
              title: "مقاييس اختبار تقود القرارات",
              summary: "اختر مجموعة صغيرة من المقاييس مرتبطة بأسئلة يطرحها الناس فعلًا، وتجنّب الأرقام الاستعراضية.",
              objectives: [
                "أن تبدأ من القرارات والأسئلة ثم تختار المقاييس.",
                "أن تميّز المقاييس التي تشجع على التلاعب، مثل العدد الخام للأخطاء لكل مختبر.",
                "أن تعرض الاتجاهات مع سياقها بدل الأرقام المفردة.",
              ],
            },
          }),
          planned("improving-the-test-process", 22, "Manager", ["test-management"], {
            en: {
              title: "Improving the test process",
              summary: "Find the bottleneck, run a small experiment, measure the effect, and keep what works.",
              objectives: [
                "Use defect data and retrospectives to find improvement candidates.",
                "Design a small, measurable improvement experiment.",
                "Decide whether to adopt, adapt or abandon the change.",
              ],
            },
            ar: {
              title: "تحسين عملية الاختبار",
              summary: "اعثر على عنق الزجاجة، وأجرِ تجربة صغيرة، وقِس أثرها، واحتفظ بما ينجح.",
              objectives: [
                "أن تستخدم بيانات الأخطاء والاجتماعات الاسترجاعية لإيجاد فرص التحسين.",
                "أن تصمّم تجربة تحسين صغيرة قابلة للقياس.",
                "أن تقرر تبنّي التغيير أو تعديله أو التخلي عنه.",
              ],
            },
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "payments-and-fintech-qa",
    status: "planned",
    startsAt: "Mid-level",
    leadsTo: "Senior",
    skills: ["fintech", "api", "sql"],
    text: {
      en: {
        title: "Payments and Fintech QA",
        summary:
          "Test money movement safely: payment lifecycles, idempotency, reconciliation, multi-currency rounding and the controls regulators expect.",
        goal: "Design tests for a payment flow that prove money is never lost, duplicated or misreported.",
        prerequisites: ["API Testing Essentials or equivalent.", "Basic SQL."],
        outcomes: [
          "Map a card payment through authorization, capture, settlement, refund and chargeback.",
          "Test idempotency, retries and timeouts so customers are never charged twice.",
          "Verify reconciliation between ledgers, providers and bank statements.",
          "Test currency conversion, rounding and fees with exact decimal arithmetic.",
        ],
        milestones: [
          "Finish module 1 and model the payment states of a product you know.",
          "Finish module 2 and design a reconciliation test pack using synthetic data.",
        ],
      },
      ar: {
        title: "ضمان الجودة في المدفوعات والتقنية المالية",
        summary:
          "اختبر حركة الأموال بأمان: دورات حياة الدفع، والتكرار الآمن، والتسوية، وتقريب العملات المتعددة، والضوابط التي تتوقعها الجهات الرقابية.",
        goal: "أن تصمّم اختبارات لمسار دفع تثبت أن الأموال لا تضيع ولا تتكرر ولا يُبلَّغ عنها بشكل خاطئ.",
        prerequisites: ["مسار أساسيات اختبار الواجهات البرمجية أو ما يعادله.", "معرفة أساسية بلغة SQL."],
        outcomes: [
          "أن تتتبع دفعة بالبطاقة عبر التفويض والتحصيل والتسوية والاسترداد والاعتراض (chargeback).",
          "أن تختبر التكرار الآمن وإعادة المحاولة وانتهاء المهلة بحيث لا يُخصم من العميل مرتين أبدًا.",
          "أن تتحقق من التسوية بين دفاتر الحسابات ومزوّدي الدفع وكشوف البنك.",
          "أن تختبر تحويل العملات والتقريب والرسوم بحساب عشري دقيق.",
        ],
        milestones: [
          "أنهِ الوحدة الأولى ونمذج حالات الدفع في منتج تعرفه.",
          "أنهِ الوحدة الثانية وصمّم حزمة اختبارات تسوية باستخدام بيانات اصطناعية.",
        ],
      },
    },
    modules: [
      {
        slug: "payment-lifecycles",
        text: {
          en: { title: "Payment lifecycles", summary: "How money actually moves, and where it can go wrong." },
          ar: { title: "دورات حياة الدفع", summary: "كيف تتحرك الأموال فعلًا، وأين يمكن أن يحدث الخطأ." },
        },
        lessons: [
          planned("authorization-capture-and-settlement", 26, "Mid-level", ["fintech", "api"], {
            en: {
              title: "Authorization, capture and settlement",
              summary: "The states of a card payment and the tests each transition needs.",
              objectives: [
                "Explain authorization holds, captures, partial captures and voids.",
                "Test expiry of uncaptured authorizations.",
                "Verify settlement files against captured transactions.",
              ],
            },
            ar: {
              title: "التفويض والتحصيل والتسوية",
              summary: "حالات الدفع بالبطاقة والاختبارات التي يحتاجها كل انتقال بينها.",
              objectives: [
                "أن تشرح حجز التفويض والتحصيل والتحصيل الجزئي والإلغاء.",
                "أن تختبر انتهاء صلاحية التفويضات غير المحصّلة.",
                "أن تطابق ملفات التسوية مع المعاملات المحصّلة.",
              ],
            },
          }),
          planned("refunds-reversals-and-chargebacks", 22, "Mid-level", ["fintech"], {
            en: {
              title: "Refunds, reversals and chargebacks",
              summary: "Money going back: who initiates it, how it is recorded and what can be disputed.",
              objectives: [
                "Distinguish refunds, reversals and chargebacks.",
                "Test partial and multiple refunds against the original amount.",
                "Check the audit trail for every money-returning event.",
              ],
            },
            ar: {
              title: "الاسترداد والعكس والاعتراض",
              summary: "عودة الأموال: من يبادر بها، وكيف تُسجَّل، وما الذي يمكن الاعتراض عليه.",
              objectives: [
                "أن تميّز بين الاسترداد (refund) والعكس (reversal) والاعتراض (chargeback).",
                "أن تختبر الاسترداد الجزئي والمتعدد مقابل المبلغ الأصلي.",
                "أن تتحقق من سجل التدقيق لكل حدث يُعيد أموالًا.",
              ],
            },
          }),
        ],
      },
      {
        slug: "money-integrity",
        text: {
          en: { title: "Money integrity", summary: "Never lose, duplicate or misreport a single unit of currency." },
          ar: { title: "سلامة الأموال", summary: "لا تفقد ولا تكرر ولا تخطئ في الإبلاغ عن وحدة نقدية واحدة." },
        },
        lessons: [
          planned("idempotency-and-retries-in-payments", 24, "Senior", ["fintech", "api"], {
            en: {
              title: "Idempotency and retries in payments",
              summary: "Design tests that prove timeouts and retries can never charge a customer twice.",
              objectives: [
                "Simulate timeouts between every pair of systems in a payment flow.",
                "Test idempotency keys, including reuse with a different body.",
                "Verify the final state across ledger, provider and customer view.",
              ],
            },
            ar: {
              title: "التكرار الآمن وإعادة المحاولة في المدفوعات",
              summary: "صمّم اختبارات تثبت أن انتهاء المهلة وإعادة المحاولة لا يمكن أن يخصما من العميل مرتين.",
              objectives: [
                "أن تحاكي انتهاء المهلة بين كل نظامين في مسار الدفع.",
                "أن تختبر مفاتيح التكرار الآمن، بما في ذلك إعادة استخدامها مع محتوى مختلف.",
                "أن تتحقق من الحالة النهائية في دفتر الحسابات ولدى المزوّد وفي واجهة العميل.",
              ],
            },
          }),
          planned("reconciliation-and-ledgers", 24, "Senior", ["fintech", "sql"], {
            en: {
              title: "Reconciliation and ledgers",
              summary: "Prove that every system agrees on where the money is, every day.",
              objectives: [
                "Explain double-entry ledgers and why balances must always net to zero.",
                "Write SQL checks that find unmatched and duplicated transactions.",
                "Design reconciliation test data that includes the hard cases.",
              ],
            },
            ar: {
              title: "التسوية ودفاتر الحسابات",
              summary: "أثبت أن كل الأنظمة تتفق يوميًا على مكان وجود الأموال.",
              objectives: [
                "أن تشرح دفاتر القيد المزدوج ولماذا يجب أن يكون صافي الأرصدة صفرًا دائمًا.",
                "أن تكتب فحوص SQL تكشف المعاملات غير المطابقة والمكررة.",
                "أن تصمّم بيانات اختبار للتسوية تشمل الحالات الصعبة.",
              ],
            },
          }),
          planned("currency-rounding-and-fees", 20, "Mid-level", ["fintech"], {
            en: {
              title: "Currency, rounding and fees",
              summary: "Test conversion, minor units and fee calculations where a single fil or cent matters.",
              objectives: [
                "Handle currencies with zero, two and three decimal places.",
                "Choose and test a rounding rule and where it is applied.",
                "Check that fees and totals reconcile after conversion.",
              ],
            },
            ar: {
              title: "العملات والتقريب والرسوم",
              summary: "اختبر التحويل والوحدات الصغرى وحساب الرسوم حيث يُحدث فلس أو سنت واحد فرقًا.",
              objectives: [
                "أن تتعامل مع عملات بلا منازل عشرية أو بمنزلتين أو بثلاث منازل.",
                "أن تختار قاعدة تقريب وتختبرها وتختبر موضع تطبيقها.",
                "أن تتحقق من تطابق الرسوم والمجاميع بعد التحويل.",
              ],
            },
          }),
        ],
      },
    ],
  },
];
