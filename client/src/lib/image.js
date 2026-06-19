// Уменьшение изображения на клиенте до data URL — для превью и хранения
// в localStorage (учёт EXIF-ориентации, чтобы фото с телефона не было повёрнуто).

export async function fileToPreviewDataUrl(file, max = 1100, quality = 0.72) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null)
  if (bitmap) {
    const { width, height } = bitmap
    const scale = Math.min(1, max / Math.max(width, height))
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    return canvas.toDataURL('image/jpeg', quality)
  }
  // Фолбэк: читаем как есть (без даунскейла).
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
