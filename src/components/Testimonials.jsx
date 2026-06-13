import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Testimonials.css';

gsap.registerPlugin(ScrollTrigger);

const Testimonials = () => {
  const wrapperRef = useRef(null);

  const reviews = [
    {
      text: "Kafemizin kağıt ürünleri için Green Cup'a geçmek yaptığımız en iyi kararlardan biriydi. Biyolojik tek kullanımlık bardaklar yalnızca görsel olarak çekici değil, aynı zamanda sağlam. Rekabetçi fiyatlandırma, bütçemizi zorlamadan sürdürülebilirlik taahhüdümüzü korumamızı sağlıyor.",
      author: "Sarah M",
      role: "Kafe Sahibi",
      avatar: "/img/avatar-1.jpg"
    },
    {
      text: "Green Cup, restoranımızın sürdürülebilirlik anlayışını gerçekten kökten değiştirdi! Bardaklar, tabaklar ve çatal-bıçak dahil biyolojik tek kullanımlık kağıt ürünleri yalnızca çevre dostu değil, aynı zamanda birinci sınıf kalitede. Müşterilerimiz bu doğaya duyarlı dokunuşa bayılıyor.",
      author: "Ahmet S",
      role: "Restoran Sahibi",
      avatar: "/img/avatar-2.jpg"
    },
    {
      text: "Sundukları biyolojik tek kullanımlık kağıt ürünleri her şeyi değiştiriyor. Çeşitlilik, her etkinliğin temasına uyum sağlamama olanak tanıyor ve çevre dostu yönü müşterilerimizin değerleriyle mükemmel şekilde örtüşüyor. Kesinlikle tavsiye ederim!",
      author: "Mert Y",
      role: "Etkinlik Planlamacısı",
      avatar: "/img/avatar-3.jpg"
    }
  ];

  useEffect(() => {
    const cards = gsap.utils.toArray('.review-card');

    gsap.fromTo(cards,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top 75%',
        }
      }
    );
  }, []);

  return (
    <section className="testimonials-section relative-z" ref={wrapperRef}>
      <div className="testimonials-header">
        <h2 className="hover-target" data-hover="SEVGİ">Müşteri <span className="text-secondary">Hikayeleri</span></h2>
      </div>

      <div className="testimonials-grid">
        {reviews.map((rev, index) => (
          <div className="review-card glass hover-target" data-hover="OKU" key={index}>
            <div className="quote-icon">“</div>
            <p className="review-text">{rev.text}</p>
            <div className="review-author">
              <img className="review-avatar" src={rev.avatar} alt={rev.author} loading="lazy" />
              <div className="review-author-info">
                <h4>{rev.author}</h4>
                <span>{rev.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
