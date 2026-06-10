import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FAQ.css';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      q: "Tüm ürünleriniz %100 kompostlanabilir mi?",
      a: "Evet, tüm kataloğumuz bitki bazlı malzemelerden tasarlanmıştır ve resmi olarak kompostlanabilir sertifikasına sahiptir; böylece hiçbir iz bırakmadığımızdan emin oluruz."
    },
    {
      q: "Bardaklarda özel markalama sunuyor musunuz?",
      a: "Kesinlikle. İlk fikrinizden lansmana kadar, markanız için özel çevre dostu mürekkep baskısı dahil kapsamlı destek sunuyoruz."
    },
    {
      q: "WhatsApp sipariş süreci nasıl işliyor?",
      a: "Koleksiyonumuza göz atmanız, beğendiğiniz üründe 'WhatsApp ile Sipariş Ver' butonuna tıklamanız yeterli; miktar ve teslimat ayrıntılarını netleştirmek için doğrudan satış ekibimize bağlanırsınız."
    },
    {
      q: "Yurt dışına gönderim yapıyor musunuz?",
      a: "Şu anda karbon ayak izimizi en aza indirmek için yerel ve bölgesel dağıtıma odaklanıyoruz, ancak belirli hacim ihtiyaçlarınız için ekibimizle iletişime geçebilirsiniz."
    }
  ];

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section relative-z">
      <div className="faq-container">
        <h2 className="faq-title hover-target" data-hover="SOR">Sıkça Sorulan <span className="text-primary">Sorular</span></h2>
        
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`faq-item hover-target ${activeIndex === idx ? 'active' : ''}`}
              onClick={() => handleToggle(idx)}
              data-hover={activeIndex === idx ? "KAPAT" : "AÇ"}
            >
              <div className="faq-question">
                <h3>{faq.q}</h3>
                <span className="faq-icon">{activeIndex === idx ? '−' : '+'}</span>
              </div>
              
              <AnimatePresence>
                {activeIndex === idx && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                  >
                    <p>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
