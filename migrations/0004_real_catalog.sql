-- The store's real launch range. INSERT OR IGNORE keeps any later edits made in the admin.
INSERT OR IGNORE INTO products (slug, category, brand, name_en, name_ru, desc_en, desc_ru, price_aed, volume_ml, abv, origin, image, stock, featured) VALUES
('corona-extra-24', 'beer', 'Corona', 'Corona Extra beer, 24 × 330 ml', 'Пиво Corona Extra, 24 шт × 0,33 л',
 'A case of 24 Corona Extra bottles, the light Mexican lager made for hot days. Best served ice-cold with a wedge of lime. Delivered chilled.',
 'Ящик из 24 бутылок Corona Extra — лёгкий мексиканский лагер для жарких дней. Лучше всего ледяным и с долькой лайма. Привозим охлаждённым.',
 270, 330, 4.5, 'Mexico', '/assets/products/corona-24.jpg', 50, 1),
('heineken-24', 'beer', 'Heineken', 'Heineken beer, 24 × 330 ml', 'Пиво Heineken, 24 шт × 0,33 л',
 'A case of 24 Heineken bottles, the crisp Dutch premium lager. A safe choice for any party, match or yacht day. Delivered chilled.',
 'Ящик из 24 бутылок Heineken — освежающий голландский премиальный лагер. Беспроигрышный выбор для вечеринки, матча или яхты. Привозим охлаждённым.',
 220, 330, 5.0, 'Netherlands', '/assets/products/heineken-24.jpg', 50, 1),
('jacobs-creek-red-1l', 'red-wine', 'Jacob''s Creek', 'Jacob''s Creek red wine, 1 L', 'Вино Jacob''s Creek красное, 1 л',
 'Soft, fruity Australian red with notes of ripe berries and a smooth finish. Great with grilled meat, burgers and pizza.',
 'Мягкое фруктовое австралийское красное вино с нотами спелых ягод и бархатистым послевкусием. Отлично к мясу на гриле, бургерам и пицце.',
 130, 1000, NULL, 'Australia', '/assets/products/red-wine.jpg', 50, 1),
('absolut-vodka-1l', 'vodka', 'Absolut', 'Absolut Vodka, 1 L', 'Водка Absolut, 1 л',
 'The classic Swedish vodka, clean and smooth. Perfect neat and ice-cold or as the base for a vodka tonic or Moscow Mule.',
 'Классическая шведская водка — чистая и мягкая. Хороша ледяной в чистом виде или как основа для водки-тоника и Moscow Mule.',
 120, 1000, 40, 'Sweden', '/assets/products/absolut-1l.jpg', 50, 1);

-- Hide the demo products that came with the template (kept, not deleted, so they can be re-enabled in the admin).
UPDATE products SET active = 0, featured = 0 WHERE brand = 'Sample' AND active = 1;

-- WhatsApp number for the order button, only if none has been set in the admin yet.
INSERT OR IGNORE INTO settings (key, value) VALUES ('whatsapp', '');
UPDATE settings SET value = '+998 91 524 45 92' WHERE key = 'whatsapp' AND TRIM(value) = '';
