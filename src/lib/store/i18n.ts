export const LANGS = ["ru", "en"] as const;
export type Lang = (typeof LANGS)[number];
/** The site's main language: served at "/" and used as hreflang x-default. */
export const DEFAULT_LANG: Lang = "ru";

export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || "http://localhost:3000").replace(/\/$/, "");
export const BRAND = "Alcomir";

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}
/** Path prefix for a language section (only the home page of the default language is unprefixed). */
export function prefix(lang: Lang): string {
  return `/${lang}`;
}
export function homePath(lang: Lang): string {
  return lang === DEFAULT_LANG ? "/" : `/${lang}`;
}
export function langFromPath(pathname: string): Lang {
  const seg = pathname.split("/")[1];
  return isLang(seg) ? seg : DEFAULT_LANG;
}
export function switchLangPath(pathname: string, to: Lang): string {
  const parts = pathname.split("/");
  if (isLang(parts[1])) {
    const rest = parts.slice(2).join("/");
    return rest ? `/${to}/${rest}` : homePath(to);
  }
  if (pathname === "/" || pathname === "") return homePath(to);
  return pathname;
}
/** Absolute URL for a language-aware path (rest without the lang segment). */
export function langUrl(lang: Lang, rest: string): string {
  if (!rest) return SITE_URL + (lang === DEFAULT_LANG ? "" : `/${lang}`);
  return `${SITE_URL}/${lang}${rest.startsWith("/") ? rest : `/${rest}`}`;
}
/** hreflang alternates for a page that exists in the given languages (all by default). */
export function alternates(rest: string, langs: readonly Lang[] = LANGS) {
  const def = langs.includes(DEFAULT_LANG) ? DEFAULT_LANG : langs[0];
  return [
    ...langs.map((l) => ({ rel: "alternate", hrefLang: l, href: langUrl(l, rest) })),
    ...(def ? [{ rel: "alternate", hrefLang: "x-default", href: langUrl(def, rest) }] : []),
  ];
}

export const LANG_LABEL: Record<Lang, string> = { en: "EN", ru: "RU" };
export const OG_LOCALE: Record<Lang, string> = { en: "en_AE", ru: "ru_RU" };

export type Dict = {
  shop: string; catalog: string; delivery: string; cart: string; allDrinks: string;
  addToCart: string; added: string; outOfStock: string; inStock: string; lowStock: string;
  bestSellers: string; bestSellersSub: string; viewAll: string;
  howTitle: string; howSteps: [string, string][]; faqTitle: string;
  footerAge: string; footerResponsible: string;
  ageTitle: string; ageBody: string; ageYes: string; ageNo: string; ageBlocked: string;
  cartEmpty: string; subtotal: string; deliveryFee: string; free: string; total: string;
  checkout: string; name: string; phone: string; area: string; address: string; notes: string;
  payment: string; cash: string; card: string; confirmAge: string; placeOrder: string;
  orderPlaced: string; orderPlacedBody: string; minOrder: string; freeOver: string;
  volume: string; abv: string; origin: string; related: string; home: string; qty: string;
  remove: string; hours: string; deliveryTitle: string; homeH2Cats: string;
  catalogTitle: string; catalogIntro: string; sortPopular: string; sortLow: string; sortHigh: string;
  aed: string; continueShopping: string; deliveryIntro: string; areasTitle: string; sending: string;
  errorGeneric: string; tagline: string;
  heroTitle: string; heroSub: string; orderWhatsApp: string; trust: [string, string, string, string];
  openNow: string; closedNow: string; etaMin: string; packsTitle: string; packsSub: string;
  areasSub: string; promoLabel: string; promoApply: string; promoApplied: string; promoInvalid: string; discount: string;
  freeLeft: string; freeUnlocked: string; upsellTitle: string; popupTitle: string; popupBody: string; popupCta: string;
  popupThanks: string; popupNo: string; areaH1: string; areaIntro: string; save: string; waMessage: string;
  blog: string; blogTitle: string; blogIntro: string; readMore: string; minRead: string; shopThese: string;
  latestPosts: string; morePosts: string; blogEmpty: string; waShort: string;
};

export const T: Record<Lang, Dict> = {
  en: {
    shop: "Shop the range", catalog: "Shop", delivery: "Delivery", cart: "Cart", allDrinks: "All drinks",
    addToCart: "Add to cart", added: "Added", outOfStock: "Out of stock", inStock: "In stock", lowStock: "Only a few left",
    bestSellers: "Best sellers in Dubai", bestSellersSub: "The bottles our customers reorder most, delivered chilled.",
    viewAll: "See all drinks",
    howTitle: "How alcohol delivery in Dubai works",
    howSteps: [
      ["Choose your drinks", "Browse beer, wine and spirits and add them to your cart."],
      ["Confirm you are 21+", "We check ID on delivery, as Dubai law requires."],
      ["Pay on delivery", "Cash or card to the courier. No online payment needed."],
      ["Open it cold", "Orders are packed chilled and delivered to your door."],
    ],
    faqTitle: "Alcohol delivery in Dubai: your questions",
    footerAge: "21+ only. ID is checked on delivery.", footerResponsible: "Please drink responsibly.",
    ageTitle: "Are you 21 or older?", ageBody: "You must be of legal drinking age in the UAE to enter this site.",
    ageYes: "Yes, I am 21+", ageNo: "No", ageBlocked: "Sorry, you must be 21 or older to visit Alcomir.",
    cartEmpty: "Your cart is empty.", subtotal: "Subtotal", deliveryFee: "Delivery", free: "Free", total: "Total",
    checkout: "Delivery details", name: "Full name", phone: "Phone or WhatsApp", area: "Area",
    address: "Building, apartment or villa", notes: "Notes for the courier (optional)",
    payment: "Payment on delivery", cash: "Cash", card: "Card",
    confirmAge: "I confirm I am 21 or older and will show ID on delivery.", placeOrder: "Place order",
    orderPlaced: "Order received", orderPlacedBody: "We will call or message you shortly to confirm. Your order number:",
    minOrder: "Minimum order", freeOver: "Free delivery over",
    volume: "Volume", abv: "Alcohol", origin: "Origin", related: "You may also like", home: "Home", qty: "Quantity",
    remove: "Remove", hours: "Delivery hours", deliveryTitle: "Alcohol delivery in Dubai", homeH2Cats: "Shop by category",
    catalogTitle: "Buy alcohol online in Dubai",
    catalogIntro: "Beer, wine and spirits delivered chilled across Dubai. Pay cash or card on delivery. 21+ only.",
    sortPopular: "Popular", sortLow: "Price: low to high", sortHigh: "Price: high to low", aed: "AED",
    continueShopping: "Continue shopping",
    deliveryIntro: "Alcomir delivers beer, wine and spirits across Dubai to residents and tourists aged 21 and over. Orders arrive chilled, and you pay cash or card to the courier.",
    areasTitle: "Areas we deliver to", sending: "Sending...", errorGeneric: "Something went wrong. Please try again.",
    tagline: "Ice-cold drinks, delivered across Dubai.",
    heroTitle: "Alcohol delivery in Dubai",
    heroSub: "Champagne, whisky, wine and beer delivered chilled to your door in about an hour. Pay on delivery.",
    orderWhatsApp: "Order on WhatsApp",
    trust: ["Delivery in {eta} min", "Pay cash or card on delivery", "Delivered chilled", "21+ ID check"],
    openNow: "Open now",
    closedNow: "Opens at",
    etaMin: "min",
    packsTitle: "Party packs for Dubai",
    packsSub: "Brunch, yacht day or house party: everything in one order, ice included.",
    areasSub: "Same-hour delivery to every major Dubai neighbourhood.",
    promoLabel: "Promo code",
    promoApply: "Apply",
    promoApplied: "Code applied",
    promoInvalid: "This code is not valid for your order.",
    discount: "Discount",
    freeLeft: "Add {amount} more for free delivery",
    freeUnlocked: "You unlocked free delivery",
    upsellTitle: "Add ice & mixers",
    popupTitle: "10% off your first order",
    popupBody: "Leave your WhatsApp number and get your code instantly. We only message about offers.",
    popupCta: "Get my code",
    popupThanks: "Your code:",
    popupNo: "No thanks",
    areaH1: "Alcohol delivery in {area}",
    areaIntro: "Alcomir delivers beer, wine, champagne and spirits to {area} in about {eta} minutes. Orders arrive chilled, ID is checked at the door, and you pay cash or card to the courier.",
    save: "Save",
    waMessage: "Hello Alcomir, I would like to order:",
    blog: "Blog",
    blogTitle: "Dubai drinks guide: the Alcomir blog",
    blogIntro: "Rules, tips and pairings for drinking well in Dubai: what to order for a brunch, a yacht day or a quiet night in.",
    readMore: "Read",
    minRead: "min read",
    shopThese: "Drinks from this article",
    latestPosts: "From the blog",
    morePosts: "More articles",
    blogEmpty: "New articles are coming soon.",
    waShort: "Order now",
  },
  ru: {
    shop: "Перейти в каталог", catalog: "Каталог", delivery: "Доставка", cart: "Корзина", allDrinks: "Все напитки",
    addToCart: "В корзину", added: "Добавлено", outOfStock: "Нет в наличии", inStock: "В наличии", lowStock: "Осталось мало",
    bestSellers: "Хиты продаж в Дубае", bestSellersSub: "Бутылки, которые заказывают чаще всего. Приезжают охлаждёнными.",
    viewAll: "Все напитки",
    howTitle: "Как работает доставка алкоголя в Дубае",
    howSteps: [
      ["Выберите напитки", "Пиво, вино и крепкий алкоголь в пару кликов."],
      ["Подтвердите возраст 21+", "Курьер проверит документ, как требует закон Дубая."],
      ["Оплата при получении", "Наличными или картой курьеру."],
      ["Открывайте холодным", "Заказ упакован охлаждённым и доставлен до двери."],
    ],
    faqTitle: "Доставка алкоголя в Дубае: вопросы и ответы",
    footerAge: "Только 21+. Документ проверяется при доставке.", footerResponsible: "Пейте ответственно.",
    ageTitle: "Вам уже есть 21 год?", ageBody: "Для входа на сайт нужно достичь легального возраста употребления алкоголя в ОАЭ.",
    ageYes: "Да, мне 21+", ageNo: "Нет", ageBlocked: "Извините, сайт Alcomir доступен только с 21 года.",
    cartEmpty: "Корзина пуста.", subtotal: "Сумма", deliveryFee: "Доставка", free: "Бесплатно", total: "Итого",
    checkout: "Данные для доставки", name: "Имя и фамилия", phone: "Телефон или WhatsApp", area: "Район",
    address: "Здание, квартира или вилла", notes: "Комментарий для курьера (необязательно)",
    payment: "Оплата при получении", cash: "Наличные", card: "Карта",
    confirmAge: "Подтверждаю, что мне 21 год или больше, и покажу документ при доставке.", placeOrder: "Оформить заказ",
    orderPlaced: "Заказ принят", orderPlacedBody: "Мы скоро позвоним или напишем для подтверждения. Номер заказа:",
    minOrder: "Минимальный заказ", freeOver: "Бесплатная доставка от",
    volume: "Объём", abv: "Крепость", origin: "Страна", related: "Вам может понравиться", home: "Главная", qty: "Количество",
    remove: "Удалить", hours: "Часы доставки", deliveryTitle: "Доставка алкоголя в Дубае", homeH2Cats: "Категории напитков",
    catalogTitle: "Купить алкоголь онлайн в Дубае",
    catalogIntro: "Пиво, вино и крепкий алкоголь с доставкой по Дубаю, охлаждённые. Оплата наличными или картой при получении. Только 21+.",
    sortPopular: "Популярные", sortLow: "Сначала дешевле", sortHigh: "Сначала дороже", aed: "AED",
    continueShopping: "Продолжить покупки",
    deliveryIntro: "Alcomir доставляет пиво, вино и крепкий алкоголь по всему Дубаю резидентам и туристам от 21 года. Заказ приезжает охлаждённым, оплата наличными или картой курьеру.",
    areasTitle: "Районы доставки", sending: "Отправляем...", errorGeneric: "Что-то пошло не так. Попробуйте ещё раз.",
    tagline: "Ледяные напитки с доставкой по Дубаю.",
    heroTitle: "Доставка алкоголя в Дубае",
    heroSub: "Шампанское, виски, вино и пиво охлаждёнными до двери примерно за час. Оплата при получении.",
    orderWhatsApp: "Заказать в WhatsApp",
    trust: ["Доставка за {eta} мин", "Оплата наличными или картой", "Привозим охлаждённым", "Проверка возраста 21+"],
    openNow: "Открыто",
    closedNow: "Откроемся в",
    etaMin: "мин",
    packsTitle: "Наборы для вечеринок в Дубае",
    packsSub: "Бранч, яхта или домашняя вечеринка: всё одним заказом, лёд в комплекте.",
    areasSub: "Доставка в течение часа во все основные районы Дубая.",
    promoLabel: "Промокод",
    promoApply: "Применить",
    promoApplied: "Промокод применён",
    promoInvalid: "Этот промокод не подходит для заказа.",
    discount: "Скидка",
    freeLeft: "Добавьте ещё {amount} для бесплатной доставки",
    freeUnlocked: "Бесплатная доставка открыта",
    upsellTitle: "Добавьте лёд и миксеры",
    popupTitle: "Скидка 10% на первый заказ",
    popupBody: "Оставьте номер WhatsApp и получите промокод сразу. Пишем только о предложениях.",
    popupCta: "Получить код",
    popupThanks: "Ваш код:",
    popupNo: "Нет, спасибо",
    areaH1: "Доставка алкоголя: {area}",
    areaIntro: "Alcomir доставляет пиво, вино, шампанское и крепкий алкоголь в {area} примерно за {eta} минут. Заказ приезжает охлаждённым, курьер проверяет документ, оплата наличными или картой.",
    save: "Скидка",
    waMessage: "Здравствуйте, Alcomir! Хочу заказать:",
    blog: "Блог",
    blogTitle: "Блог Alcomir: гид по напиткам в Дубае",
    blogIntro: "Правила, советы и сочетания: что заказать на бранч, на яхту или для спокойного вечера дома в Дубае.",
    readMore: "Читать",
    minRead: "мин чтения",
    shopThese: "Напитки из статьи",
    latestPosts: "Из блога",
    morePosts: "Ещё статьи",
    blogEmpty: "Скоро здесь появятся статьи.",
    waShort: "Заказать",
  },
};

export const FAQ: Record<Lang, { q: string; a: string }[]> = {
  en: [
    { q: "Can tourists buy alcohol in Dubai?", a: "Yes. Tourists and residents aged 21 or over can buy alcohol from licensed retailers in Dubai. Have your passport or Emirates ID ready for the courier." },
    { q: "How old do I need to be to order alcohol in Dubai?", a: "You must be 21 or older. The courier checks ID at the door and cannot hand over an order without it." },
    { q: "Which areas of Dubai do you deliver to?", a: "We deliver across Dubai, including Dubai Marina, JBR, Downtown, Business Bay, JLT, Palm Jumeirah, Jumeirah and Al Barsha." },
    { q: "How do I pay for alcohol delivery?", a: "Pay cash or card to the courier when your order arrives. There is no online payment step." },
    { q: "Do the drinks arrive cold?", a: "Yes. Beer, white wine, sparkling wine and vodka are packed chilled so they are ready to open." },
  ],
  ru: [
    { q: "Могут ли туристы покупать алкоголь в Дубае?", a: "Да. Туристы и резиденты от 21 года могут покупать алкоголь у лицензированных продавцов в Дубае. Подготовьте паспорт или Emirates ID для курьера." },
    { q: "С какого возраста можно заказать алкоголь в Дубае?", a: "С 21 года. Курьер проверяет документ у двери и не передаст заказ без него." },
    { q: "В какие районы Дубая вы доставляете?", a: "По всему Дубаю, включая Dubai Marina, JBR, Downtown, Business Bay, JLT, Palm Jumeirah, Jumeirah и Al Barsha." },
    { q: "Как оплатить доставку алкоголя?", a: "Наличными или картой курьеру при получении. Онлайн-оплата не нужна." },
    { q: "Напитки приезжают холодными?", a: "Да. Пиво, белое и игристое вино и водка упаковываются охлаждёнными." },
  ],
};

export const AREAS = [
  "Dubai Marina", "JBR", "Downtown Dubai", "Business Bay", "JLT", "Palm Jumeirah", "Jumeirah", "Al Barsha",
  "DIFC", "Dubai Hills", "Arabian Ranches", "JVC", "Deira", "Bur Dubai", "Al Quoz", "Mirdif", "Other",
];

export function money(v: number, _lang: Lang): string {
  const n = Number.isInteger(v) ? String(v) : v.toFixed(2);
  return `AED ${n}`;
}
export const THEME_COLOR = "#0b0b0c";

export type Area = { slug: string; name: Record<Lang, string> };
export const AREA_PAGES: Area[] = [
  { slug: "dubai-marina", name: { en: "Dubai Marina", ru: "Дубай Марина" } },
  { slug: "jbr", name: { en: "JBR", ru: "JBR" } },
  { slug: "downtown-dubai", name: { en: "Downtown Dubai", ru: "Даунтаун Дубай" } },
  { slug: "business-bay", name: { en: "Business Bay", ru: "Бизнес Бэй" } },
  { slug: "palm-jumeirah", name: { en: "Palm Jumeirah", ru: "Пальма Джумейра" } },
  { slug: "jlt", name: { en: "JLT", ru: "JLT" } },
  { slug: "jumeirah", name: { en: "Jumeirah", ru: "Джумейра" } },
  { slug: "al-barsha", name: { en: "Al Barsha", ru: "Аль Барша" } },
  { slug: "difc", name: { en: "DIFC", ru: "DIFC" } },
  { slug: "dubai-hills", name: { en: "Dubai Hills", ru: "Дубай Хиллс" } },
  { slug: "jvc", name: { en: "JVC", ru: "JVC" } },
  { slug: "bur-dubai", name: { en: "Bur Dubai", ru: "Бур Дубай" } },
  { slug: "arabian-ranches", name: { en: "Arabian Ranches", ru: "Арабиан Ранчес" } },
  { slug: "deira", name: { en: "Deira", ru: "Дейра" } },
  { slug: "al-quoz", name: { en: "Al Quoz", ru: "Аль-Кваз" } },
  { slug: "mirdif", name: { en: "Mirdif", ru: "Мирдиф" } },
];
export function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
