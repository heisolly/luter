// Stability Shim for pdfjs-dist 2.x
// Bridges window.pdfjsLib to the module system for react-pdf-viewer compatibility.

const getLib = () => (typeof window !== 'undefined' ? (window.pdfjsLib || window.pdfjs) : null);

// Re-export specific 2.x API surfaces that @react-pdf-viewer expects
export const GlobalWorkerOptions = getLib()?.GlobalWorkerOptions;
export const getDocument = (...args) => getLib()?.getDocument(...args);
export const version = getLib()?.version;
export const PDFWorker = getLib()?.PDFWorker;
export const renderTextLayer = (...args) => getLib()?.renderTextLayer(...args);
export const renderAnnotationLayer = (...args) => getLib()?.renderAnnotationLayer(...args);
export const CMapCompressionType = getLib()?.CMapCompressionType;

export default getLib();
