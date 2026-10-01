-- Alcomir store schema. Additive only.
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY, sort INTEGER NOT NULL DEFAULT 0, image TEXT,
  name_en TEXT NOT NULL, name_ru TEXT, name_ar TEXT,
  intro_en TEXT, intro_ru TEXT, intro_ar TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE, category TEXT NOT NULL, brand TEXT,
  name_en TEXT NOT NULL, name_ru TEXT, name_ar TEXT,
  desc_en TEXT, desc_ru TEXT, desc_ar TEXT,
  meta_title_en TEXT, meta_title_ru TEXT, meta_title_ar TEXT,
  meta_desc_en TEXT, meta_desc_ru TEXT, meta_desc_ar TEXT,
  price_aed REAL NOT NULL, old_price_aed REAL, volume_ml INTEGER, abv REAL, origin TEXT, image TEXT,
  stock INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category, active);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL, phone TEXT NOT NULL, area TEXT NOT NULL, address TEXT NOT NULL, notes TEXT,
  items_json TEXT NOT NULL, subtotal REAL NOT NULL, delivery_fee REAL NOT NULL, total REAL NOT NULL,
  payment TEXT NOT NULL, lang TEXT NOT NULL DEFAULT 'en', status TEXT NOT NULL DEFAULT 'new',
  discount REAL NOT NULL DEFAULT 0, promo_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'percent', value REAL NOT NULL,
  min_subtotal REAL NOT NULL DEFAULT 0, max_uses INTEGER, uses INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1, expires_at TEXT, note TEXT
);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT NOT NULL, name TEXT, lang TEXT NOT NULL DEFAULT 'en',
  source TEXT NOT NULL DEFAULT 'popup', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO promo_codes (code, kind, value, min_subtotal, note) VALUES ('WELCOME10', 'percent', 10, 150, 'First-order popup');
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('delivery_eta','45-60'),('delivery_fee','25'),('free_delivery_min','250'),('min_order','100'),('hours','11:00 - 02:00'),
  ('whatsapp',''),('phone',''),('licence','Licensed alcohol retailer in Dubai. Licence number to be added by the store owner.');
INSERT OR IGNORE INTO categories (slug, sort, image, name_en, name_ru, name_ar, intro_en, intro_ru, intro_ar) VALUES
('packs',0,'/assets/products/pack-brunch.jpg','Party packs','Наборы для вечеринок','باقات الحفلات',
 'Ready-made party packs for Dubai brunches, yacht days and house parties. Drinks, ice and mixers in one order, delivered cold.',
 'Готовые наборы для бранчей, яхт и домашних вечеринок в Дубае. Напитки, лёд и миксеры одним заказом, охлаждёнными.',
 'باقات جاهزة للبرانش ورحلات اليخت وحفلات المنزل في دبي. مشروبات وثلج ومكسرات في طلب واحد تصلك مبردة.'),
('mixers',10,'/assets/products/mixers.jpg','Ice & mixers','Лёд и миксеры','الثلج والمشروبات المكملة',
 'Bagged ice, tonic, soda and ginger beer delivered with your drinks across Dubai.',
 'Пакетированный лёд, тоник, содовая и имбирное пиво с доставкой вместе с напитками по Дубаю.',
 'ثلج معبأ وتونيك وصودا وجنجر بير يصلك مع مشروباتك في جميع أنحاء دبي.'),
('beer',1,'/assets/products/beer.jpg','Beer','Пиво','بيرة',
 'Order cold beer in Dubai for home delivery. Lagers, pale ales and craft cans arrive chilled to your apartment, villa or hotel, ready to open.',
 'Закажите холодное пиво в Дубае с доставкой. Лагеры, пейл-эли и крафт приезжают охлаждёнными в квартиру, виллу или отель.',
 'اطلب بيرة باردة في دبي مع التوصيل إلى المنزل. تصلك أنواع اللاغر والبيل إيل والبيرة الحرفية مبردة وجاهزة للتقديم.'),
('red-wine',2,'/assets/products/red-wine.jpg','Red wine','Красное вино','نبيذ أحمر',
 'Buy red wine online in Dubai. Cabernet, Merlot, Shiraz and Rioja from trusted regions, delivered at the right temperature.',
 'Купите красное вино онлайн в Дубае. Каберне, Мерло, Шираз и Риоха из проверенных регионов с доставкой при правильной температуре.',
 'اشترِ النبيذ الأحمر عبر الإنترنت في دبي. كابيرنيه وميرلو وشيراز وريوخا من مناطق موثوقة تصلك بدرجة الحرارة المناسبة.'),
('white-wine',3,'/assets/products/white-wine.jpg','White wine','Белое вино','نبيذ أبيض',
 'White wine delivery in Dubai: crisp Sauvignon Blanc, Pinot Grigio and Chardonnay, delivered chilled.',
 'Доставка белого вина в Дубае: свежий Совиньон Блан, Пино Гриджо и Шардоне приезжают охлаждёнными.',
 'توصيل النبيذ الأبيض في دبي: سوفينيون بلان وبينو غريجيو وشاردونيه منعشة تصلك مبردة.'),
('sparkling',4,'/assets/products/sparkling.jpg','Champagne & sparkling','Шампанское и игристое','شمبانيا ونبيذ فوار',
 'Champagne, Prosecco and Cava delivered ice-cold in Dubai for celebrations, brunches and rooftop evenings.',
 'Шампанское, Просекко и Кава с доставкой в Дубае, ледяные, для праздников, бранчей и вечеров на крыше.',
 'شمبانيا وبروسيكو وكافا تصلك باردة جدًا في دبي للاحتفالات والبرانش والسهرات.'),
('whisky',5,'/assets/products/whisky.jpg','Whisky','Виски','ويسكي',
 'Whisky delivery in Dubai: Scotch single malts, blends, bourbon and Irish whiskey, delivered to your door.',
 'Доставка виски в Дубае: шотландский односолодовый, купажи, бурбон и ирландский виски до двери.',
 'توصيل الويسكي في دبي: سكوتش سينغل مولت وأنواع ممزوجة وبوربون وويسكي إيرلندي حتى باب منزلك.'),
('vodka',6,'/assets/products/vodka.jpg','Vodka','Водка','فودكا',
 'Premium vodka delivered frozen-cold across Dubai. Classic and flavoured bottles for parties and quiet nights.',
 'Премиальная водка с доставкой по Дубаю, ледяная. Классическая и ароматизированная для вечеринок и спокойных вечеров.',
 'فودكا فاخرة تصلك باردة جدًا في جميع أنحاء دبي. زجاجات كلاسيكية ومنكهة للحفلات والأمسيات الهادئة.'),
('gin',7,'/assets/products/gin.jpg','Gin','Джин','جين',
 'Gin delivery in Dubai: London dry and botanical gins for the perfect gin and tonic, delivered chilled.',
 'Доставка джина в Дубае: лондонский сухой и травяной джин для идеального джин-тоника.',
 'توصيل الجين في دبي: جين لندن الجاف وأنواع عشبية لتحضير جين وتونيك مثالي.'),
('rum',8,'/assets/products/rum.jpg','Rum','Ром','رم',
 'White, golden and dark rum delivered in Dubai for cocktails, mojitos and beach evenings.',
 'Белый, золотой и тёмный ром с доставкой в Дубае для коктейлей, мохито и вечеров на пляже.',
 'رم أبيض وذهبي وداكن يصلك في دبي للكوكتيلات والموهيتو وسهرات الشاطئ.'),
('tequila',9,'/assets/products/tequila.jpg','Tequila','Текила','تكيلا',
 'Tequila and mezcal delivered across Dubai: blanco, reposado and añejo, ready for margaritas or sipping.',
 'Текила и мескаль с доставкой по Дубаю: бланко, репосадо и аньехо для маргариты или дегустации.',
 'تكيلا وميزكال تصلك في جميع أنحاء دبي: بلانكو وريبوسادو وأنييخو للمارغريتا أو للتذوق.');
INSERT OR IGNORE INTO products (slug, category, brand, name_en, desc_en, price_aed, old_price_aed, volume_ml, abv, origin, image, stock, featured) VALUES
('brunch-pack','packs','Sample','Brunch Pack: 2 Prosecco + 1 Rosé + Ice','Two bottles of Prosecco, one rosé and a 2 kg bag of ice. Serves 6 to 8.',299,339,2250,11,NULL,'/assets/products/pack-brunch.jpg',20,1),
('yacht-pack','packs','Sample','Yacht Day Pack: 24 Beers + Vodka + Mixers','Twenty-four cold lagers, one vodka, tonic, soda and ice. Built for a day on the water.',549,629,NULL,NULL,NULL,'/assets/products/pack-yacht.jpg',15,1),
('house-party-pack','packs','Sample','House Party Pack: Whisky + Gin + Mixers','One bourbon, one London dry gin, ginger beer, tonic and two bags of ice.',449,509,NULL,NULL,NULL,'/assets/products/pack-party.jpg',15,0),
('party-ice-2kg','mixers','Sample','Party Ice 2 kg','Crystal-clear ice cubes, delivered frozen.',15,NULL,NULL,NULL,'UAE','/assets/products/mixers.jpg',200,0),
('premium-tonic-4-pack','mixers','Sample','Premium Tonic Water 4 x 200 ml','Clean, light tonic for gin and vodka.',25,NULL,800,NULL,'United Kingdom','/assets/products/mixers.jpg',100,0),
('ginger-beer-4-pack','mixers','Sample','Ginger Beer 4 x 200 ml','Spicy ginger beer for mules and dark rum.',25,NULL,800,NULL,'United Kingdom','/assets/products/mixers.jpg',100,0),
('crisp-lager-6-pack','beer','Sample','Crisp Lager 6 x 330 ml','A clean, light lager with a dry finish. Six bottles, delivered ice-cold.',69,NULL,1980,4.8,'Netherlands','/assets/products/beer.jpg',40,1),
('citrus-pale-ale-4-pack','beer','Sample','Citrus Pale Ale 4 x 440 ml','Hop-forward pale ale with grapefruit and pine notes.',79,89,1760,5.6,'United Kingdom','/assets/products/beer.jpg',25,0),
('cabernet-sauvignon-chile','red-wine','Sample','Cabernet Sauvignon, Central Valley','Blackcurrant, cedar and soft tannins. Great with grilled meat.',89,NULL,750,13.5,'Chile','/assets/products/red-wine.jpg',30,1),
('rioja-crianza','red-wine','Sample','Rioja Crianza','Cherry, vanilla and gentle oak from twelve months in barrel.',119,139,750,13.5,'Spain','/assets/products/red-wine.jpg',18,0),
('sauvignon-blanc-marlborough','white-wine','Sample','Sauvignon Blanc, Marlborough','Zesty lime, passion fruit and a crisp mineral finish.',99,NULL,750,12.5,'New Zealand','/assets/products/white-wine.jpg',30,1),
('pinot-grigio-veneto','white-wine','Sample','Pinot Grigio delle Venezie','Light, fresh and easy with pear and green apple.',79,NULL,750,12,'Italy','/assets/products/white-wine.jpg',24,0),
('prosecco-doc-extra-dry','sparkling','Sample','Prosecco DOC Extra Dry','Fine bubbles, green apple and white flowers.',109,NULL,750,11,'Italy','/assets/products/sparkling.jpg',20,1),
('champagne-brut-nv','sparkling','Sample','Champagne Brut NV','Brioche, citrus and a long, elegant finish.',349,399,750,12,'France','/assets/products/sparkling.jpg',10,0),
('speyside-single-malt-12','whisky','Sample','Speyside Single Malt 12 Year','Honey, orchard fruit and a soft oak finish.',289,NULL,700,40,'Scotland','/assets/products/whisky.jpg',15,1),
('kentucky-straight-bourbon','whisky','Sample','Kentucky Straight Bourbon','Caramel, vanilla and toasted oak. Made for an old fashioned.',199,NULL,700,45,'USA','/assets/products/whisky.jpg',15,0),
('premium-wheat-vodka','vodka','Sample','Premium Wheat Vodka','Silky and clean, best straight from the freezer.',159,NULL,700,40,'Poland','/assets/products/vodka.jpg',25,1),
('classic-vodka-1l','vodka','Sample','Classic Vodka 1 L','A crisp, neutral vodka for cocktails and parties.',139,155,1000,40,'Sweden','/assets/products/vodka.jpg',25,0),
('london-dry-gin','gin','Sample','London Dry Gin','Juniper-led with citrus peel and coriander.',169,NULL,700,41.5,'United Kingdom','/assets/products/gin.jpg',20,1),
('cucumber-botanical-gin','gin','Sample','Cucumber Botanical Gin','Fresh cucumber and rose. Pair with tonic and ice.',189,NULL,700,41.4,'Scotland','/assets/products/gin.jpg',15,0),
('caribbean-white-rum','rum','Sample','Caribbean White Rum','Light and bright, built for mojitos and daiquiris.',119,NULL,700,37.5,'Cuba','/assets/products/rum.jpg',20,0),
('aged-dark-rum-8-year','rum','Sample','Aged Dark Rum 8 Year','Molasses, toffee and spice. Sip it over one big cube.',219,NULL,700,40,'Guatemala','/assets/products/rum.jpg',12,1),
('tequila-blanco-agave','tequila','Sample','Tequila Blanco 100% Agave','Peppery agave and citrus. The margarita classic.',199,NULL,700,38,'Mexico','/assets/products/tequila.jpg',15,0),
('tequila-reposado','tequila','Sample','Tequila Reposado','Rested in oak for caramel and soft spice.',249,279,700,38,'Mexico','/assets/products/tequila.jpg',10,1);
