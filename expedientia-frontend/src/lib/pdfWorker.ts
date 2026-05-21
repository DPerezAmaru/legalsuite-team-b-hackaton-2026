import { pdfjs } from 'react-pdf'

// Worker copiado a public/ para evitar problemas de resolución con pnpm
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
