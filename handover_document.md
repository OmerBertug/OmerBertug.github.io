# Aegis-Detox: Technical Handover Document

Bu belge, **Aegis-Detox** projesinin mevcut mimarisini, tasarım kararlarını, geliştirme sürecinde aşılan engelleri ve bir sonraki adımları özetleyen kapsamlı bir teknik devir (handover) dosyasıdır. Yeni bir sohbet veya geliştirme ortamında yapay zeka asistanına projenin mevcut durumunu tam olarak aktarmak için tasarlanmıştır.

---

## 1. Projenin Amacı ve Mimarisi
**Aegis-Detox**, dijital bağımlılıkla mücadele etmek ve dikkat dağıtıcı dijital unsurları ortadan kaldırmak amacıyla tasarlanmış, yüksek güvenlikli, "kurcalamaya dayanıklı" (tamper-resistant) bir kilit ve odaklanma platformudur.

Proje, modern ve ölçeklenebilir bir **pnpm monorepo** mimarisi kullanılarak inşa edilmiştir.

### Monorepo Paket Yapısı ve İlişkiler
- **`@aegis/domain` (packages/domain):** Projenin kalbi olan "Domain" katmanıdır. Kilit mekanizmaları, durum yönetim mantıkları (state management), kural setleri ve iş kuralları (business logic) burada bulunur. Saf TypeScript ile yazılmıştır; Web ve Mobil katmanları bu pakete bağımlıdır.
- **`@aegis/schemas` (packages/schemas):** Sistem genelinde paylaşılan veri yapıları, Zod doğrulama (validation) şemaları, API ve Event arayüzlerinin bulunduğu pakettir. Uygulamanın tüm katmanları arasında katı bir "kontrat" görevi görür.
- **`@aegis/web` (apps/web):** Kullanıcının oturumlarını yönettiği, cihazlarını izlediği ve analizleri görüntülediği yönetim panelidir. Modern Vite, **TanStack Start** ve Tailwind CSS ile geliştirilmiştir.
- **`@aegis/mobile` (apps/mobile):** Kullanıcının cihazına yüklenen Expo (React Native) tabanlı mobil katmandır. Cihaz seviyesindeki engellemeleri (App Blocking, Network Blocking) uygular ve kilit oturumlarını yürütür.

---

## 2. Kritik Mimari Kararlar
- **Tamper-Resistant (Kurcalamaya Dayanıklı) & Fail-Closed Yaklaşım:**
  Sistem tasarımı, uygulamanın bypass edilmesini engellemek üzerine kuruludur. Cihazda bir çökme yaşanırsa veya kullanıcı uygulamayı zorla kapatmaya çalışırsa (Force Stop), sistem güvenlik açısından "açık (fail-open)" duruma geçmek yerine "kilitli (fail-closed)" pozisyonunu korumayı amaçlar.
- **10 Dakikalık Kilit Pencereleri (Micro-Windows):** 
  Örneğin 2 saatlik bir kilit oturumu başlatıldığında, cayma hakları veya kilit esnetme opsiyonları çok katı kurallara bağlıdır. Sistem mantığı kilitleri 10 dakikalık kırılmaz mikro pencerelere bölerek, anlık dürtülerle (impulse) kilidin kırılmasını teknik olarak engeller.
- **Lokal Odaklı Güvenlik:** İzinlerin manipüle edilmemesi ve ağ/uygulama engellemelerinin dış müdahalelerden korunması mimarinin temel taşlarındandır.

---

## 3. Mobil Katman (Expo Go & Native Stratejisi)
- **Native Yetenekler (Android):**
  Ağ trafiğini kesmek/izlemek için **`VpnService`** ve arayüz üzerinden diğer uygulamaları zorla kapatmak/arayüze erişimi engellemek için **`AccessibilityService`** kullanılacaktır.
- **SIMULATION (Simülasyon) Mimarisi:**
  Bu derin sistem servisleri (VPN, Accessibility) normal şartlarda Expo Go veya Web ortamında çalışmaz. Geliştirme hızını kesmemek adına `core/native` altında bu servisler soyutlanmış, **Expo Go ve Web üzerinde çalışabilen "Simulated" (Mock) davranışlar** geliştirilmiştir. Böylece native kod (Java/Kotlin) yazılmadan önce UI, UX ve Domain mantıkları simülasyon modu üzerinden test edilip olgunlaştırılabilmektedir.

---

## 4. En Son Çözülen Hatalar ve Entegrasyonlar
Projenin güncel altyapıya taşınması sırasında kritik build ve config sorunları çözülmüştür:

1. **Monorepo Build ve Modül Çözümleme Hatalarının Aşılması (`@aegis/domain`):**
   Uygulamalarda import edilen domain/schemas paketleri derlenirken `TS6059: rootDir` ve "modül bulunamadı" hataları alınıyordu. Paketlerin sürekli derlenme zorunluluğunu (build step) ortadan kaldırmak için, `@aegis/domain` ve `@aegis/schemas` içindeki `package.json` dosyalarının `main`, `types`, ve `exports` alanları derlenmiş `/dist` klasörüne değil, **doğrudan kaynak koda (`./src/index.ts`)** yönlendirildi. Bu sayede Vite ve Metro gibi paketleyiciler TypeScript'i doğal yollardan (transpile-only) işleyebilir duruma getirildi.
2. **TanStack Start & Vite Mimari Geçişi (`@aegis/web`):**
   - Eski Vinxi bazlı yapılandırmadan (app.config.ts), güncel **Vite (vite.config.ts)** tabanlı yapıya geçildi (`@tanstack/react-start/plugin/vite` entegre edildi).
   - Yeni sürüm TanStack Router zorunlulukları nedeniyle `router.tsx` içerisindeki `createRouter` fonksiyonu **`getRouter`** olarak adlandırıldı.
   - SSR (Server-Side Rendering) çökmelerine (`Element type is invalid (undefined)`) sebep olan `Meta`, `Scripts` ve `ScrollRestoration` bileşenlerinin içe aktarım (import) yolları `@tanstack/react-start` paketinden çıkartılıp, güncel standart olan **`@tanstack/react-router`** paketine alındı. Eski `Meta` bileşeni **`HeadContent`** ile değiştirildi. 
   - HMR (Hot Reload) hataları Vite konfigürasyonuna `@vitejs/plugin-react` eklentisi dahil edilerek çözüldü.
3. **Analytics Sayfası Tab Etkileşimi:**
   - Web arayüzündeki `/analytics` sayfasında yer alan "Screen" ve "Data" sekmelerinin çalışmama (static buton) sorunu giderildi. `React.useState` kullanılarak aktif sekme yönetimi eklendi, veri yapıları ayrıştırıldı ve sekmeler arası geçişte grafik yüksekliği ile grafik barlarının üzerindeki tooltip etiketleri (Örn: 3.5h, 1.2 GB) dinamik olarak güncellenecek şekilde etkileşimli hale getirildi.

---

## 5. Kalan Yapılacaklar (Todo List / Next Steps)

- [ ] **Simülasyondan Native Modüllere Geçiş (Expo Prebuild):**
  UI/UX testleri ve simülasyonlar tamamen oturduktan sonra projenin "Prebuild" (Continuous Native Generation) aşamasına geçilmesi. `VpnService` ve `AccessibilityService` için gerekli Android (Java/Kotlin) kodlarının Native Modül olarak (Expo modülleri veya doğrudan Android klasörüne) entegre edilmesi.
- [ ] **Güvenlik ve İnatçılık (Persistency) Sağlanması:**
  Kullanıcının cihazı yeniden başlatması (Boot Receiver) veya aykırı durumlarda (Accessibility erişiminin ayardan iptal edilmesi) uygulamanın inatçı bir şekilde yeniden ayağa kalkması ve "fail-closed" durumunu (örneğin ana ekrana overlay basmak) sağlaması için gerekli native servis kilitlerinin kurulması.
- [ ] **Web Dashboard İş Mantığı:**
  Ayağa kaldırılan Vite/TanStack Start tabanlı Web panelinin statik yapıdan çıkartılarak `@aegis/domain` içindeki iş mantığı ile beslenmesi (aktif kilitlerin okunması, geçmiş analytics verilerinin grafiğe dökülmesi).
- [ ] **Yerel Veritabanı ve Senkronizasyon (Local-First Sync):**
  Kurcalamaya dayanıklı sistemin durumu saklamak için şifrelenmiş bir yerel depolama/veritabanı çözümünün (SQLite / WatermelonDB) kalıcı hale getirilmesi ve opsiyonel bulut senkronizasyonu mekanizmasının tasarlanması.
