export interface MandelbrotWorkerResult {
  type: 'rendered';
  referenceCount: number;
  referencesBuilt: number;
  renderTimeMs: number;
  image: ImageBitmap;
}
