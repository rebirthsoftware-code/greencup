// Statik dosya yolu: uygulama alt klasörde (/app/) yayınlandığında da doğru çözülür.
export const asset = (p) => `${import.meta.env.BASE_URL}${p}`;
