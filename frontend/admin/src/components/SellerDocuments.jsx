// Seller verification documents (Account.documents[]) — thumbnail strip plus a
// click-to-enlarge preview. Extracted from SellerVerification so Seller
// Management can show the same proofs without a second document renderer.

import { useState } from "react";
import { FaFileAlt, FaTimes, FaExternalLinkAlt } from "react-icons/fa";

export const DOC_LABELS = { gst: "GST Certificate", pan: "PAN Card", cheque: "Cancelled Cheque", id: "Government ID" };

function docLabel(doc) {
  return DOC_LABELS[doc.type] || doc.label || doc.type;
}

// The preview overlay. Rendered by SellerDocuments, or directly by a page that
// keeps its own `preview` state (SellerVerification does).
export function DocumentPreview({ preview, onClose }) {
  if (!preview) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="font-bold">{preview.label}</h3>
          <div className="flex items-center gap-3">
            <a href={preview.dataUrl} download className="text-brand-600 hover:text-brand-800 text-sm flex items-center gap-1.5"><FaExternalLinkAlt size={12} /> Download</a>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
          </div>
        </div>
        <div className="p-4">
          {preview.isPdf
            ? <iframe title="doc" src={preview.dataUrl} className="w-full h-[65vh] rounded-lg border border-slate-200" />
            : <img src={preview.dataUrl} alt={preview.label} className="w-full rounded-lg" />}
        </div>
      </div>
    </div>
  );
}

export function DocThumb({ doc, onOpen }) {
  const isPdf = typeof doc.dataUrl === "string" && doc.dataUrl.startsWith("data:application/pdf");
  return (
    <button
      onClick={() => onOpen({ label: docLabel(doc), dataUrl: doc.dataUrl, isPdf })}
      className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-slate-200 hover:border-brand-400 hover:shadow-soft transition-all bg-slate-50 w-[104px]"
      title={`Preview ${doc.label || doc.type}`}
    >
      {isPdf ? (
        <div className="w-full h-16 rounded-md bg-white flex items-center justify-center text-brand-500"><FaFileAlt size={22} /></div>
      ) : (
        <img src={doc.dataUrl} alt={doc.type} className="w-full h-16 rounded-md object-cover bg-white" />
      )}
      <span className="text-[11px] font-medium text-slate-600 text-center leading-tight">{docLabel(doc)}</span>
    </button>
  );
}

// Self-contained strip: thumbnails + its own preview modal + empty state.
export default function SellerDocuments({ documents }) {
  const [preview, setPreview] = useState(null);

  if (!documents?.length) {
    return <p className="text-sm text-slate-400">No documents were submitted with this application.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {documents.map((doc, i) => <DocThumb key={i} doc={doc} onOpen={setPreview} />)}
      </div>
      <DocumentPreview preview={preview} onClose={() => setPreview(null)} />
    </>
  );
}
