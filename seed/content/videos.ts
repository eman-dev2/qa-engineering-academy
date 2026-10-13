/**
 * Curated videos. Every entry was checked on 2026-10-12 against YouTube's oEmbed endpoint
 * (title and channel exactly as published) and against the official list at
 * https://playwright.dev/community/learn-videos (source: microsoft/playwright.dev, src/data/learn-videos.tsx).
 * We only link and embed; nothing is downloaded or re-hosted.
 */
import type { SkillId } from "../../src/content/skills";
import type { Level } from "../../src/lib/db/schema";

export type SeedVideo = {
  youtubeId: string;
  title: string;
  creator: string;
  creatorUrl: string;
  language: string;
  level: Level;
  skills: SkillId[];
  relatedLessons: string[];
  verifiedOn: string;
  description: { en: string; ar: string };
};

const PLAYWRIGHT = { creator: "Playwright", creatorUrl: "https://www.youtube.com/@Playwrightdev" };

export const seedVideos: SeedVideo[] = [
  {
    youtubeId: "SLhz2KmBh2Q",
    title: "Playwright for Beginners. Install and run tests using the CLI",
    ...PLAYWRIGHT,
    language: "en",
    level: "Junior",
    skills: ["ui-automation"],
    relatedLessons: ["playwright-with-typescript/locators-and-auto-waiting"],
    verifiedOn: "2026-10-12",
    description: {
      en: "A short first run: installing Playwright, the generated example tests, and running them from the command line.",
      ar: "تشغيل أول سريع: تثبيت Playwright، والاختبارات النموذجية التي يولّدها، وتشغيلها من سطر الأوامر.",
    },
  },
  {
    youtubeId: "WvsLGZnHmzw",
    title: "Get Started with Playwright and VS Code (2025 edition)",
    ...PLAYWRIGHT,
    language: "en",
    level: "Junior",
    skills: ["ui-automation"],
    relatedLessons: ["playwright-with-typescript/locators-and-auto-waiting"],
    verifiedOn: "2026-10-12",
    description: {
      en: "Setting up the VS Code extension to run, debug and pick locators. Useful alongside the locators lesson.",
      ar: "إعداد إضافة VS Code لتشغيل الاختبارات وتصحيحها واختيار محدّدات العناصر. مفيد بجانب درس المحدّدات.",
    },
  },
  {
    youtubeId: "4w0W8qYub2U",
    title: "Handling Visibility in Playwright: getByText vs. getByRole",
    ...PLAYWRIGHT,
    language: "en",
    level: "Junior",
    skills: ["ui-automation"],
    relatedLessons: ["playwright-with-typescript/locators-and-auto-waiting"],
    verifiedOn: "2026-10-12",
    description: {
      en: "Why role-based locators behave differently from text locators when elements are hidden. A concrete case for user-facing locators.",
      ar: "لماذا تتصرف المحدّدات المبنية على الدور (role) بشكل مختلف عن محدّدات النص عند إخفاء العناصر. حالة عملية تدعم استخدام المحدّدات التي يراها المستخدم.",
    },
  },
  {
    youtubeId: "1VxkHP8vfGg",
    title: "Playwright Assertions: Avoid Race Conditions with This Simple Fix!",
    ...PLAYWRIGHT,
    language: "en",
    level: "Junior",
    skills: ["ui-automation"],
    relatedLessons: ["playwright-with-typescript/locators-and-auto-waiting", "senior-quality-engineering/diagnosing-flaky-tests"],
    verifiedOn: "2026-10-12",
    description: {
      en: "Reading a value and comparing it races the page; a web-first assertion waits for it. The most common cause of flaky UI tests in one example.",
      ar: "قراءة قيمة ثم مقارنتها تسابق الصفحة، أمّا التحقق المعتمد على الويب فينتظرها. السبب الأكثر شيوعًا لتذبذب اختبارات الواجهة في مثال واحد.",
    },
  },
  {
    youtubeId: "0dHDmSjx55o",
    title: "How to trigger flaky Playwright tests locally after they fail on CI",
    ...PLAYWRIGHT,
    language: "en",
    level: "Senior",
    skills: ["ui-automation", "advanced-qe"],
    relatedLessons: ["senior-quality-engineering/diagnosing-flaky-tests"],
    verifiedOn: "2026-10-12",
    description: {
      en: "Reproducing a CI-only failure on your machine: the first step of the flaky-test diagnosis loop in the Senior Quality Engineering path.",
      ar: "إعادة إنتاج إخفاق لا يظهر إلا في التكامل المستمر على جهازك: الخطوة الأولى في دورة تشخيص الاختبارات المتذبذبة في مسار هندسة الجودة للمستوى الخبير.",
    },
  },
  {
    youtubeId: "kvGszYAYQ6M",
    title: "How to test dynamic content in Playwright with API mocking",
    ...PLAYWRIGHT,
    language: "en",
    level: "Automation",
    skills: ["ui-automation", "api"],
    relatedLessons: ["playwright-with-typescript/locators-and-auto-waiting"],
    verifiedOn: "2026-10-12",
    description: {
      en: "Controlling the data behind the UI by mocking API responses, so tests of dynamic content are deterministic.",
      ar: "التحكم في البيانات خلف الواجهة بمحاكاة استجابات الواجهة البرمجية، لتصبح اختبارات المحتوى المتغيّر حتمية النتائج.",
    },
  },
  {
    youtubeId: "P4R6hnsE0UY",
    title: "Getting started with ARIA Snapshots",
    ...PLAYWRIGHT,
    language: "en",
    level: "Automation",
    skills: ["ui-automation"],
    relatedLessons: ["playwright-with-typescript/locators-and-auto-waiting"],
    verifiedOn: "2026-10-12",
    description: {
      en: "Asserting on the accessibility tree of a page section: a structural check that also nudges you towards accessible markup.",
      ar: "التحقق من شجرة إمكانية الوصول (accessibility tree) لجزء من الصفحة: فحص بنيوي يدفعك أيضًا نحو شيفرة أكثر قابلية للوصول.",
    },
  },
  {
    youtubeId: "gRXPp6RuExU",
    title: "Get started with end-to-end testing: Playwright | Episode 6 - Running Tests on CI",
    creator: "Visual Studio Code",
    creatorUrl: "https://www.youtube.com/@code",
    language: "en",
    level: "Automation",
    skills: ["ui-automation", "cicd"],
    relatedLessons: ["senior-quality-engineering/diagnosing-flaky-tests"],
    verifiedOn: "2026-10-12",
    description: {
      en: "Running a Playwright suite in a CI pipeline and reading the report. Listed on playwright.dev's official learning videos.",
      ar: "تشغيل مجموعة اختبارات Playwright في خط تكامل مستمر وقراءة التقرير. مدرج ضمن مقاطع التعلّم الرسمية على playwright.dev.",
    },
  },
];
