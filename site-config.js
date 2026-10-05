window.SITE_CONFIG = {
  brandName: "NOVA BOT",
  brandTagline: "RESMİ SİPARİŞ MERKEZİ",
  currency: "€",
  products: [
    { id: "basic", name: "Basic Paket", icon: "◌", price: 19, description: "Başlangıç için sade ve hızlı paket.", badge: "BAŞLANGIÇ" },
    { id: "pro", name: "Pro Paket", icon: "✦", price: 39, description: "Daha kapsamlı kullanım için güçlü seçenek.", badge: "POPÜLER" },
    { id: "premium", name: "Premium Paket", icon: "◆", price: 69, description: "Öncelikli işlem ve tam paket deneyimi.", badge: "PREMIUM" }
  ],
  paymentMethods: [
    { id: "bank", name: "Banka Havalesi / SEPA", icon: "↗", note: "Ödeme bilgilerini sipariş sonrası admin tarafından paylaşabilirsin.", help: "Havale / SEPA seçtiysen işlem referansını yazman yeterli. Hesap bilgilerini bu forma girme." },
    { id: "paypal", name: "PayPal", icon: "P", note: "PayPal ile yapılan ödemelerde işlem numarasını ekleyebilirsin.", help: "PayPal ödeme tamamlandıysa işlem numarasını veya kullanılan e-postayı referans alanına yaz." },
    { id: "crypto", name: "USDT / Kripto", icon: "₮", note: "Kullanılan ağ ve işlem bilgisi referansla birlikte gönderilebilir.", help: "USDT için kullandığın ağ ve işlem hash bilgisini not/ref alanında paylaşabilirsin." }
  ]
};
