-- Henna by Lina: data only, existing Lehnova Ticket and catalogue tables.
-- Re-running this seed preserves existing merchant settings and edited models.
begin;
insert into public.catalogs (client,catalog_title,slug,accent_color,font_style)
values ('Henna by Lina','Henna by Lina','henna-by-lina','#8B5038','elegante')
on conflict (slug) do nothing;
insert into public.catalog_products (catalog_id,name,category,photo_url,photo_urls,position,description)
select c.id,v.name,v.category,v.photo,array[v.photo],v.position,'Modèle de démonstration · visuel généré.'
from public.catalogs c cross join (values
('Fleurs légères','Dessins simples','/demos/henna-by-lina/simple-1.jpg',0),
('Petit mandala','Dessins simples','/demos/henna-by-lina/simple-2.jpg',1),
('Arabesques fleuries','Dessins remplis','/demos/henna-by-lina/rempli-1.jpg',2),
('Dentelle géométrique','Dessins remplis','/demos/henna-by-lina/rempli-2.jpg',3),
('Petit papillon','Enfants','/demos/henna-by-lina/enfant-1.jpg',4),
('Fleur et étoile','Enfants','/demos/henna-by-lina/enfant-2.jpg',5)
) as v(name,category,photo,position)
where c.slug='henna-by-lina' and not exists(select 1 from public.catalog_products p where p.catalog_id=c.id and p.name=v.name);
insert into public.ticket_businesses (name,slug,is_active,offers_url,offer_previews,public_screen_enabled)
values ('Henna by Lina','henna-by-lina',true,'https://lehnova.fr/catalogue/henna-by-lina','[{"title":"Dessins simples","detail":"2 modèles à découvrir pendant votre attente","image_url":"https://lehnova.fr/demos/henna-by-lina/simple-1.jpg","url":"https://lehnova.fr/catalogue/henna-by-lina/dessins-simples"},{"title":"Dessins remplis","detail":"2 modèles à découvrir pendant votre attente","image_url":"https://lehnova.fr/demos/henna-by-lina/rempli-1.jpg","url":"https://lehnova.fr/catalogue/henna-by-lina/dessins-remplis"},{"title":"Enfants","detail":"2 modèles à découvrir pendant votre attente","image_url":"https://lehnova.fr/demos/henna-by-lina/enfant-1.jpg","url":"https://lehnova.fr/catalogue/henna-by-lina/enfants"}]'::jsonb,true)
on conflict (slug) do nothing;
insert into public.ticket_queues (business_id,is_open,queue_mode,estimated_minutes_per_client,public_wait_display_enabled)
select id,true,'tickets',10,true from public.ticket_businesses where slug='henna-by-lina'
on conflict (business_id) do nothing;
commit;
