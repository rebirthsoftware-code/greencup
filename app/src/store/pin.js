import { loadDevice, saveDevice } from './storage';
import { sha256 } from '../utils/format';

/** PIN belirle / kaldır (Ayarlar'dan). */
export async function setDevicePin(pin) {
  if (!pin) { saveDevice({ pinHash: null, pinLen: null }); sessionStorage.removeItem('gc-unlocked'); return; }
  saveDevice({ pinHash: await sha256(pin), pinLen: pin.length }); sessionStorage.setItem('gc-unlocked', '1');
}
export const hasDevicePin = () => !!loadDevice().pinHash;
