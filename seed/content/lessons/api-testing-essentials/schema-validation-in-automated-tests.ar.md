---
title: "التحقق من البنية في اختبارات الواجهات البرمجية المؤتمتة"
summary: "اكتب اختبار واجهة برمجية مؤتمتًا باستخدام Playwright وTypeScript يتحقق من الحالة والترويسات وقيم العمل وبنية الاستجابة كاملة مقابل JSON Schema."
objectives:
  - "كتابة JSON Schema تعبّر عن عقد الاستجابة، بما في ذلك الحقول المطلوبة والأنواع والصيغ وقيم التعداد."
  - "استخدام fixture الطلبات (request) في Playwright لإرسال طلبات API والتأكيد على الاستجابات."
  - "التحقق من استجابة مقابل بنية باستخدام Ajv وعرض أخطاء مقروءة."
  - "تقرير أي التأكيدات مكانها في البنية وأيها مكانه في فحوص عمل صريحة."
prerequisites:
  - "تصميم الاختبارات لنقطة نهاية REST"
  - "أساسيات JavaScript أو TypeScript: المتغيرات والدوال والكائنات وasync/await"
keyTerms:
  - term: "JSON Schema"
    definition: "مفردات لوصف بنية مستندات JSON، تُستخدم للتحقق من صحتها."
  - term: "انجراف العقد (Contract drift)"
    definition: "حين تبتعد استجابات الواجهة البرمجية الحقيقية تدريجيًا عمّا يتوقعه العملاء والتوثيق."
  - term: "additionalProperties"
    definition: "كلمة مفتاحية في JSON Schema تتحكم في السماح بخصائص غير مذكورة في البنية."
  - term: "Fixture"
    definition: "في Playwright، قطعة تجهيز قابلة لإعادة الاستخدام تُحقن في الاختبارات، مثل `request` لاستدعاءات API."
mistakes:
  - mistake: "توليد بنية من استجابة عينة واحدة واعتبارها العقد."
    fix: "البنى المولّدة ترمّز مصادفات تلك العينة (حقل يقبل null صادف أن له قيمة). راجع كل حقل مقابل المواصفات."
  - mistake: "استخدام التحقق من البنية بدل تأكيدات العمل."
    fix: "البنية تثبت أن «total نص يطابق نمطًا عشريًا». لكنها لا تستطيع إثبات أن «total يساوي السعر × الكمية». استخدم الاثنين."
  - mistake: "تعيين `additionalProperties: false` في كل مكان دون نقاش."
    fix: "إنه يكتشف تسريب البيانات العرضي، لكنه يجعل التغييرات الإضافية غير الضارة تكسر الاختبارات. اتفقوا على سياسة مع فريق الواجهة (غالبًا صارمة للكائنات الحساسة، ومفتوحة في غيرها)."
  - mistake: "طباعة «فشل التحقق من البنية» فقط."
    fix: "ضمّن مسار الخطأ ورسالته من Ajv في التأكيد، ليقول التقرير أي حقل انكسر وكيف."
exercise:
  title: "أضف اختبارًا يتحقق من البنية لنقطة نهاية قائمة"
  brief: |
    وسّع المثال في هذا الدرس ليغطي `GET /v1/orders?status=paid&limit=2`، التي تعيد:

    ```json
    {
      "data": [ /* order objects */ ],
      "page": { "limit": 2, "nextCursor": "string or null" }
    }
    ```

    1. اكتب بنية لاستجابة القائمة تعيد استخدام بنية الطلب لكل عنصر.
    2. اكتب اختبارًا يتحقق من الحالة، وصلاحية البنية، وأن كل طلب مُعاد حالته `paid`، وأن عدد العناصر المُعادة لا يتجاوز `limit`.
    3. سمِّ اختبارًا إضافيًا تحتاجه نقطة النهاية هذه لا تستطيع البنية التعبير عنه أبدًا.
  modelAnswer: |
    ```ts
    const orderListSchema = {
      type: "object",
      required: ["data", "page"],
      properties: {
        data: { type: "array", items: orderSchema },
        page: {
          type: "object",
          required: ["limit", "nextCursor"],
          properties: {
            limit: { type: "integer", minimum: 1 },
            nextCursor: { type: ["string", "null"] },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    } as const;

    test("lists paid orders, respecting limit", async ({ request }) => {
      const res = await request.get("/v1/orders", {
        params: { status: "paid", limit: 2 },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expectValid(orderListSchema, body);
      expect(body.data.length).toBeLessThanOrEqual(2);
      for (const order of body.data) expect(order.status).toBe("paid");
    });
    ```

    اختبار إضافي لا تستطيع البنية التعبير عنه: **صحة الترقيم**. تتبّع `nextCursor` حتى يصبح `null` وتحقق من عدم وجود تكرارات أو فجوات مقارنة بالمجموعة المصفّاة كاملة. خيار آخر: طلب يغيّر حالته أثناء تصفحك للصفحات لا يظهر مرتين.
quiz:
  - id: q1
    prompt: "أي عيب يستطيع فحص JSON Schema اكتشافه وحده؟"
    options:
      - { id: a, text: "مجموع الطلب محسوب بنسبة ضريبة خاطئة" }
      - { id: b, text: "حقل `status` يعيد \"Paid\" بينما القيم المسموح بها بأحرف صغيرة" }
      - { id: c, text: "عميل يستطيع رؤية طلب عميل آخر" }
      - { id: d, text: "نقطة النهاية تستغرق 4 ثوانٍ للاستجابة" }
    answer: b
    explanation: "الكلمة المفتاحية `enum` في البنية تقيّد `status` بالقيم الموثّقة، فتفشل \"Paid\". أما الحسابات والتفويض والأداء فتحتاج إلى تأكيدات منفصلة."
  - id: q2
    prompt: "لماذا قد يعيّن فريق `additionalProperties: false` على بنية كائن العميل؟"
    options:
      - { id: a, text: "لجعل الاختبارات تعمل أسرع" }
      - { id: b, text: "لاكتشاف الحقول التي تظهر بشكل غير متوقع، مثل تسرّب `passwordHash` الداخلي إلى الاستجابات" }
      - { id: c, text: "لأن JSON Schema يتطلب ذلك" }
      - { id: d, text: "للسماح للعملاء بإرسال أي حقول" }
    answer: b
    explanation: "البنى الصارمة تفشل حين تظهر خصائص غير متوقعة. وعلى الكائنات الحساسة، يحوّل ذلك تسرّب البيانات العرضي إلى اختبار فاشل."
  - id: q3
    prompt: "في Playwright، ماذا يوفّر fixture ‏`request`؟"
    options:
      - { id: a, text: "صفحة متصفح لاختبارات الواجهة" }
      - { id: b, text: "سياق طلبات API لإرسال طلبات HTTP دون متصفح" }
      - { id: c, text: "خادمًا وهميًا (mock server)" }
      - { id: d, text: "اتصالًا بقاعدة البيانات" }
    answer: b
    explanation: "‏`request` هو APIRequestContext. يرسل طلبات HTTP مباشرة، ويتشارك `baseURL` والترويسات من الإعدادات، ويمكنه إعادة استخدام حالة المصادقة."
references:
  - title: "Playwright: API testing"
    url: "https://playwright.dev/docs/api-testing"
    publisher: "Playwright"
  - title: "Understanding JSON Schema"
    url: "https://json-schema.org/understanding-json-schema"
    publisher: "JSON Schema"
  - title: "Ajv JSON schema validator: getting started"
    url: "https://ajv.js.org/guide/getting-started.html"
    publisher: "Ajv"
---

## لماذا نفحص البنية كاملة؟

معظم مجموعات اختبار الواجهات البرمجية تفحص بضعة حقول: رمز الحالة، وربما `id` و`status`. في الوقت نفسه للاستجابة ثلاثون حقلًا، وتطبيق الهاتف يعتمد عليها كلها. حين يُعيد تغيير في الخلفية تسمية `deliveryEta` إلى `eta`، أو يجعل `discount` قابلًا لأن يكون null، أو يبدأ بإعادة المبالغ كأرقام بدل نصوص، تبقى تلك الاختبارات خضراء بينما يتعطّل التطبيق.

هذا الابتعاد التدريجي يسمى **انجراف العقد**. والتحقق من البنية يكتشفه بفحص كل استجابة مقابل وصف للعقد يمكن للآلة قراءته.

## JSON Schema في خمس دقائق

JSON Schema هو نفسه JSON. إنه يصف شكل البيانات الصالحة:

```json
{
  "type": "object",
  "required": ["id", "status", "total", "createdAt"],
  "properties": {
    "id": { "type": "string", "pattern": "^ord_[A-Za-z0-9]+$" },
    "status": {
      "enum": ["pending_payment", "paid", "partially_refunded", "refunded", "cancelled"]
    },
    "total": {
      "type": "object",
      "required": ["amount", "currency"],
      "properties": {
        "amount": { "type": "string", "pattern": "^\\d+\\.\\d{3}$" },
        "currency": { "const": "JOD" }
      },
      "additionalProperties": false
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "note": { "type": ["string", "null"], "maxLength": 500 }
  },
  "additionalProperties": false
}
```

الكلمات المفتاحية التي تقوم بمعظم العمل:

| الكلمة المفتاحية | تكتشف |
| --- | --- |
| `required` | الحقول المفقودة |
| `type` (بما فيها `"null"`) | الأنواع الخاطئة؛ وقيم null غير المتوقعة |
| `enum` / `const` | القيم خارج المجموعة الموثّقة |
| `pattern`، `format` | المعرّفات والمبالغ والتواريخ والبريد الإلكتروني المشوّهة |
| `minimum`، `maxLength`، … | القيم خارج النطاق |
| `additionalProperties: false` | الحقول غير المتوقعة، بما فيها تسرّب البيانات العرضي |

إذا نشر فريق الواجهة مستند OpenAPI، فإن قسم `components.schemas` فيه يحتوي هذه البنى أصلًا. أعد استخدامها بدل إعادة كتابتها، كي تفحص الاختبارات العقد المنشور نفسه.

## الاختبار خطوة بخطوة

يستخدم المثال Playwright مع TypeScript، الذي يتعامل مع اختبارات الواجهة والواجهات البرمجية في مشغّل واحد، و**Ajv**، وهو أداة تحقق واسعة الاستخدام لـ JSON Schema.

```bash
npm init playwright@latest
npm install --save-dev ajv ajv-formats
```

اضبط العنوان الأساسي للواجهة البرمجية مرة واحدة:

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.API_BASE_URL ?? "https://api.staging.shop.example",
    extraHTTPHeaders: {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    },
  },
});
```

دالة مساعدة صغيرة تحوّل أخطاء Ajv إلى رسائل تأكيد مقروءة:

```ts
// tests/support/schema.ts
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { expect } from "@playwright/test";

// allowUnionTypes lets schemas use ["string", "null"] style types
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);

export function expectValid(schema: object, data: unknown) {
  const validate = ajv.compile(schema);
  const ok = validate(data);
  const details = (validate.errors ?? [])
    .map((e) => `${e.instancePath || "(root)"} ${e.message}`)
    .join("\n");
  expect(ok, `Response does not match schema:\n${details}`).toBe(true);
}
```

والاختبار نفسه:

```ts
// tests/orders.api.spec.ts
import { test, expect } from "@playwright/test";
import { expectValid } from "./support/schema";
import { orderSchema } from "./schemas/order";

test("creating an order returns a contract-valid, correctly priced order", async ({ request }) => {
  const res = await request.post("/v1/orders", {
    headers: { "Idempotency-Key": crypto.randomUUID() },
    data: {
      customerId: "c_test_1042",
      items: [{ sku: "TEA-250", quantity: 2 }], // unit price 2.700 JOD in test data
      currency: "JOD",
    },
  });

  // 1. Protocol-level expectations
  expect(res.status()).toBe(201);
  expect(res.headers()["content-type"]).toContain("application/json");
  expect(res.headers()["location"]).toMatch(/^\/v1\/orders\/ord_/);

  // 2. Contract: the full shape
  const order = await res.json();
  expectValid(orderSchema, order);

  // 3. Business rules the schema cannot express
  expect(order.status).toBe("pending_payment");
  expect(order.total).toEqual({ amount: "5.400", currency: "JOD" });

  // 4. Persisted state matches what we were told
  const readBack = await request.get(`/v1/orders/${order.id}`);
  expect(readBack.status()).toBe(200);
  expect(await readBack.json()).toMatchObject({ id: order.id, status: "pending_payment" });
});
```

لاحظ الطبقات الأربع: توقعات البروتوكول، والعقد (البنية كاملة)، وقواعد العمل التي لا تستطيع البنية التعبير عنها، وتطابق الحالة المحفوظة مع ما أُبلغنا به. كل طبقة تكتشف فئة مختلفة من العيوب، ورسالة الفشل تخبرك أي طبقة انكسرت.

## ما لا تستطيع البنى فعله

البنية تجيب عن «هل الشكل صحيح؟». لكنها لا تستطيع الإجابة عن:

- **هل هو صحيح؟** ‏`"amount": "5.400"` يجتاز البنية حتى لو كان المجموع الصحيح 8.100.
- **هل هو مسموح؟** استجابة بشكل مثالي تحتوي طلب شخص آخر ما زالت عيبًا حرجًا (انظر الدرس السابق).
- **هل هو متسق؟** الترقيم، والترتيب، والمجاميع عبر القائمة، والحالة بعد الكتابة كلها تحتاج إلى تأكيدات صريحة.

لذا فالتحقق من البنية *شبكة أمان تحت* تأكيدات العمل، لا بديل عنها.

## إبقاء البنى حيّة

- **خزّن البنى بجانب الاختبارات**، أو الأفضل، ولّدها من مستند OpenAPI للواجهة في خط التنفيذ.
- **اتفقوا على سياسة الصرامة.** صارمة على الكائنات الحساسة (المستخدمون، والمدفوعات). وعلى الكائنات التي يُتوقع فيها إضافة حقول، استخدم `additionalProperties: true` مع قائمة `required` مُراجَعة.
- **حين يفشل اختبار البنية، اسأل ما إذا كان العقد قد تغيّر عن قصد.** إذا كان كذلك، فحدّث البنية *وأبلغ* المستهلكين. وإن لم يكن، فقد اكتشفت تغييرًا كاسرًا قبل مستخدميك.

للواجهات البرمجية التي تستهلكها عدة فرق مستقلة، الخطوة التالية هي **اختبار العقود المُقاد بالمستهلك (consumer-driven contract testing)** (مثلًا باستخدام Pact)، حيث ينشر كل مستهلك أجزاء العقد التي يعتمد عليها. هذا الموضوع مخطط له في مسار هندسة الجودة للخبراء (Senior Quality Engineering).
