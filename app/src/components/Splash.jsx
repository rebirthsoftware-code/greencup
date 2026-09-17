import { asset } from '../utils/asset';
export default function Splash() {
  return (
    <div className="splash" aria-hidden>
      <img src={asset('logo-greencup.png')} alt="GreenCup Promosyon" className="splash-logo" />
      <div className="foot">Müşteri Takip &amp; Cari Yönetim</div>
    </div>
  );
}
